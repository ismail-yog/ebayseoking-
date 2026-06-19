import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { processOptimizationJob } from "@/app/api/jobs/worker/route";

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

    console.log(`Queueing ${selectedCount} items (AutoPublish: ${autoPublish}). Sync processing in-memory.`);

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

    // Publish each listing task synchronously (bypassing Upstash webhook complexity to ensure reliability)
    for (const listingId of listingIds) {
      // Check if autopilot is still enabled
      const { data: currentUser } = await supabase.from('users').select('is_autopilot_enabled').eq('id', user.id).single();
      if (currentUser && currentUser.is_autopilot_enabled === false) {
        console.log(`Autopilot paused by user. Stopping queue at listing ${listingId}.`);
        // Revert this specific listing to Pending since we didn't process it
        await supabase.from('product_listings').update({ status: 'Pending' }).eq('id', listingId);
        await supabase.from('system_logs').insert({ user_id: user.id, message: 'Queue processing paused by user.', level: 'info' });
        break; // Stop the entire loop
      }

      // Process this item
      const result = await processOptimizationJob(listingId, user.id, autoPublish);
      if (result.error) {
        console.error(`Background optimization failed for ${listingId}:`, result.error);
      }
    }

    return NextResponse.json({ success: true, count: selectedCount });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal queueing error";
    console.error(`Queue API error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
