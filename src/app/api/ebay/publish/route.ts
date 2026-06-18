import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { decryptCredentials } from "@/lib/encryption";
import { reviseEbayFixedPriceItem } from "@/lib/ebay";

export async function POST(req: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    // 1. Fetch listing details from Database
    const { data: listing, error: listingErr } = await supabase
      .from("product_listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (listingErr || !listing) {
      console.error(`Listing ${listingId} not found in DB`);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!listing.optimized_title || !listing.optimized_description) {
      return NextResponse.json({ error: "Listing has not been optimized yet." }, { status: 400 });
    }

    // 2. Fetch user store credentials and decrypt eBay token
    const { data: credentials, error: credsErr } = await supabase
      .from("store_credentials")
      .select("encrypted_access_token, encrypted_refresh_token, iv, auth_tag")
      .eq("user_id", user.id)
      .maybeSingle();

    if (credsErr || !credentials) {
      return NextResponse.json({ error: "Store credentials not found. Please reconnect your store." }, { status: 400 });
    }

    let accessToken = "";
    try {
      const decrypted = decryptCredentials(
        credentials.encrypted_access_token,
        credentials.encrypted_refresh_token,
        credentials.iv,
        credentials.auth_tag
      );
      accessToken = decrypted.accessToken;
    } catch (decryptErr) {
      console.error("AES token decryption failed:", decryptErr);
      return NextResponse.json({ error: "Token decryption failed. Reconnect store credentials." }, { status: 500 });
    }

    // 3. Revise Fixed Price Item on eBay
    const revision = await reviseEbayFixedPriceItem(
      listing.ebay_item_id,
      listing.optimized_title,
      listing.optimized_description,
      accessToken
    );

    if (!revision.success) {
      console.error(`eBay revision failed: ${revision.error}`);
      return NextResponse.json({ error: `eBay revision failed: ${revision.error}` }, { status: 500 });
    }

    // 4. Update Database listing status to Optimized
    const { error: finalUpdateErr } = await supabase
      .from("product_listings")
      .update({
        status: "Optimized",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    if (finalUpdateErr) throw finalUpdateErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Manual publish failed";
    console.error(`Publish error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
