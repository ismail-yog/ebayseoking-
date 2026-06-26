import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email, ebayStoreUrl, activeListingsCount, monthlyRevenue } = await req.json();

    if (!email || !ebayStoreUrl || !activeListingsCount || !monthlyRevenue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine qualification status
    // Qualifies if they manage 100+ listings AND are making money
    const hasEnoughListings = activeListingsCount === "100-1,000" || activeListingsCount === "1,000+";
    const isMakingMoney = monthlyRevenue !== "not-making-money";
    const qualified = hasEnoughListings && isMakingMoney;

    const status = qualified ? "approved" : "waitlisted";

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("beta_applications")
      .insert({
        email,
        ebay_store_url: ebayStoreUrl,
        active_listings_count: activeListingsCount,
        monthly_revenue: monthlyRevenue,
        status
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, qualified, status, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    console.error(`Beta application submission error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
