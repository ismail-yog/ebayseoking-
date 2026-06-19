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

    // Check if autopilot was paused externally
    if (profile.is_autopilot_enabled === false) {
      return NextResponse.json({ error: "Autopilot is paused" }, { status: 400 });
    }

    const remainingCredits = profile.optimization_limit - profile.optimizations_used;

    if (remainingCredits <= 0) {
      return NextResponse.json({ error: "Insufficient Credits!" }, { status: 400 });
    }

    // 2. Increment optimizations_used in Supabase atomically by 1
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        optimizations_used: profile.optimizations_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

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

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal queueing error";
    console.error(`Queue API error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
