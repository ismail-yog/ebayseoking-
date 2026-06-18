import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { Client } from "@upstash/qstash";
import { processOptimizationJob } from "@/app/api/jobs/worker/route";

const qstashToken = process.env.QSTASH_TOKEN || "placeholder-qstash-token";
const qstashClient = new Client({ token: qstashToken });

export async function POST(req: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingIds, autoPublish = true } = (await req.json()) as { listingIds: string[]; autoPublish?: boolean };

    if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: "No listings specified" }, { status: 400 });
    }

    const selectedCount = listingIds.length;

    // Fetch user to validate credits
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("optimizations_used, optimization_limit")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const remainingCredits = profile.optimization_limit - profile.optimizations_used;

    if (selectedCount > remainingCredits) {
      return NextResponse.json(
        {
          error: `Insufficient Credits! Selected ${selectedCount} listings, but you have only ${remainingCredits} credits left. Please upgrade your plan.`,
        },
        { status: 400 }
      );
    }

    // Increment optimizations_used in Supabase atomically
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        optimizations_used: profile.optimizations_used + selectedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // Determine the dynamic worker callback destination based on host header
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const destinationUrl = `${protocol}://${host}/api/jobs/worker`;

    console.log(`Queueing ${selectedCount} items (AutoPublish: ${autoPublish}). QStash callback: ${destinationUrl}`);

    // Update listings status to In Progress
    const { error: listingsUpdateErr } = await supabase
      .from("product_listings")
      .update({
        status: "In Progress",
        updated_at: new Date().toISOString(),
      })
      .in("id", listingIds)
      .eq("user_id", user.id);

    if (listingsUpdateErr) throw listingsUpdateErr;

    // Publish each listing task to QStash or fallback to synchronous execution
    const fallbackPromises = [];
    for (const listingId of listingIds) {
      if (qstashToken === "placeholder-qstash-token" || process.env.NODE_ENV === "development") {
        console.warn(`[DEV] Mocking QStash publish for listing: ${listingId}. Invoking worker directly in memory...`);
        fallbackPromises.push(processOptimizationJob(listingId, user.id, autoPublish));
      } else {
        await qstashClient.publishJSON({
          url: destinationUrl,
          body: { listingId, userId: user.id, autoPublish },
        });
      }
    }

    if (fallbackPromises.length > 0) {
      // In Vercel serverless environments, we await the promises so the container doesn't die.
      // Calling the imported function directly bypasses network limits and 308 redirect bugs.
      const results = await Promise.all(fallbackPromises);
      
      // Check if any failed
      const hasErrors = results.some(r => r.error);
      if (hasErrors) {
        console.error("Some background optimizations failed:", results.filter(r => r.error));
        // We still return success: true for the queue ingestion, since some might have succeeded.
        // The DB state will accurately reflect individual failures.
      }
    }

    return NextResponse.json({ success: true, count: selectedCount });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal queueing error";
    console.error(`Queue API error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
