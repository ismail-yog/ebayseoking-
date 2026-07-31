import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processOptimizationJob } from "@/app/api/jobs/worker/route";

export const maxDuration = 60; // Set max duration for Vercel functions
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Optional: Add simple secret validation for the cron endpoint
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Find users who have autopilot enabled
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("id, optimization_limit, optimizations_used")
      .eq("is_autopilot_enabled", true);

    if (userErr || !users || users.length === 0) {
      return NextResponse.json({ success: true, message: "No users with autopilot enabled." });
    }

    const activeUserIds = users
      .filter((u) => u.optimization_limit > u.optimizations_used)
      .map((u) => u.id);

    if (activeUserIds.length === 0) {
      return NextResponse.json({ success: true, message: "All autopilot users have exhausted their credits." });
    }

    // 2. Find a small batch of Pending listings across these users
    // We process a small batch (3) sequentially to avoid Vercel timeouts (60s max)
    const { data: listings, error: listingErr } = await supabase
      .from("product_listings")
      .select("id, user_id")
      .in("user_id", activeUserIds)
      .eq("status", "Pending")
      .order("created_at", { ascending: true })
      .limit(3);

    if (listingErr || !listings || listings.length === 0) {
      return NextResponse.json({ success: true, message: "No pending listings to process." });
    }

    console.log(`Autopilot Cron: Found ${listings.length} listings to process.`);

    const results = [];

    // 3. Process them sequentially
    for (const listing of listings) {
      // Mark as In Progress
      await supabase
        .from("product_listings")
        .update({ status: "In Progress", updated_at: new Date().toISOString() })
        .eq("id", listing.id);

      // Increment optimizations_used for the user
      const user = users.find((u) => u.id === listing.user_id);
      if (user) {
        user.optimizations_used += 1;
        await supabase
          .from("users")
          .update({ optimizations_used: user.optimizations_used })
          .eq("id", listing.user_id);
      }

      console.log(`Processing listing ${listing.id} for user ${listing.user_id}...`);
      
      try {
        const result = await processOptimizationJob(listing.id, listing.user_id, true);
        results.push({ listingId: listing.id, result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing listing ${listing.id}:`, msg);
        results.push({ listingId: listing.id, error: msg });
      }
    }

    return NextResponse.json({ success: true, processed: listings.length, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("Autopilot Cron Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
