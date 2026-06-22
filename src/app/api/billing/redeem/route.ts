import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_LIMITS: Record<string, number> = {
  starter: 200,
  growth: 350,
  power: 500,
  agency: 1000,
  enterprise: 3000,
  basic: 100,
  pro: 1000,
  business: 3000,
};

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session
    const supabaseUser = await createClientServer();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { code } = (await req.json()) as { code: string };

    if (!code || typeof code !== "string" || code.trim() === "") {
      return NextResponse.json({ error: "Please provide a valid code" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 2. Query promo_codes table using secure Admin client
    const supabaseAdmin = createAdminClient();

    const { data: promo, error: promoErr } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_used", false)
      .maybeSingle();

    if (promoErr || !promo) {
      console.error(`Invalid promo code redemption attempt: ${cleanCode}`, promoErr);
      return NextResponse.json(
        { error: "Invalid, expired, or already redeemed license key." },
        { status: 400 }
      );
    }

    const limit = PLAN_LIMITS[promo.plan_type] || 10;
    
    // Calculate expiration timestamp (e.g. 1 month or 12 months from now)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + promo.duration_months);
    const planExpiresAt = expirationDate.toISOString();

    // 3. Mark code as used
    const { error: promoUpdateErr } = await supabaseAdmin
      .from("promo_codes")
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", promo.id);

    if (promoUpdateErr) throw promoUpdateErr;

    // 4. Upgrade user profile
    const { error: profileUpdateErr } = await supabaseAdmin
      .from("users")
      .update({
        plan_type: promo.plan_type,
        optimization_limit: limit,
        optimizations_used: 0, // Reset usage counter on upgrade
        plan_expires_at: planExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateErr) {
      // Rollback code usage if profile update fails
      await supabaseAdmin
        .from("promo_codes")
        .update({
          is_used: false,
          used_by: null,
          used_at: null,
        })
        .eq("id", promo.id);

      throw profileUpdateErr;
    }

    console.log(`Successfully upgraded user ${user.id} to ${promo.plan_type} using code ${cleanCode}`);

    return NextResponse.json({
      success: true,
      planType: promo.plan_type,
      limit: limit,
      expiresAt: planExpiresAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal redemption error";
    console.error(`Redeem API error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
