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

    const { listingId, autoPublish = true } = (await req.json()) as { listingId: string; autoPublish?: boolean };

    if (!listingId) {
      return NextResponse.json({ error: "No listing specified" }, { status: 400 });
    }

    // 1. Fetch user to validate credits
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("optimizations_used, optimization_limit, is_autopilot_enabled")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 2. Increment optimizations_used in Supabase
    const { error: updateErr } = await supabase
      .from("users")
      .update({ optimizations_used: profile.optimizations_used + 1 })
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 400 });
    }

    // 3. Update listing status to In Progress
    const { error: listingsUpdateErr } = await supabase
      .from("product_listings")
      .update({
        status: "In Progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("user_id", user.id);

    if (listingsUpdateErr) throw listingsUpdateErr;

    // 4. Process the item
    const result = await processOptimizationJob(listingId, user.id, autoPublish);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Fetch the updated listing to return to client
    const { data: updatedListing } = await supabase
      .from("product_listings")
      .select("*")
      .eq("id", listingId)
      .single();

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal queueing error";
    console.error(`Queue API error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
