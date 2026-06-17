import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query actual synced listings count
    const { count: syncedCount, error: syncedErr } = await supabase
      .from("product_listings")
      .select("*", { count: "exact", head: true });

    if (syncedErr) throw syncedErr;

    // Query actual optimized listings count
    const { count: optimizedCount, error: optimizedErr } = await supabase
      .from("product_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "Optimized");

    if (optimizedErr) throw optimizedErr;

    // Query actual users count
    const { count: usersCount, error: usersErr } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (usersErr) throw usersErr;

    // Return only actual database records
    const actualSynced = syncedCount || 0;
    const actualOptimized = optimizedCount || 0;
    const actualUsers = usersCount || 0;

    return NextResponse.json({
      listingsSynced: actualSynced.toLocaleString(),
      listingsOptimized: actualOptimized.toLocaleString(),
      usersCount: actualUsers.toLocaleString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database lookup failed";
    console.error(`Stats lookup error: ${msg}`);
    
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
