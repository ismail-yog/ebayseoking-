import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/encryption";
import { optimizeListingWithAI } from "@/lib/anthropic";
import { reviseEbayFixedPriceItem } from "@/lib/ebay";

export async function processOptimizationJob(listingId: string, userId: string, autoPublish: boolean) {
  const supabase = createAdminClient();

  const logToDB = async (message: string, level: 'info' | 'error' | 'success' = 'info') => {
    try {
      await supabase.from('system_logs').insert({ user_id: userId, message, level });
    } catch (e) {
      console.error("Failed to insert system log:", e);
    }
  };

  try {
    // 1. Fetch listing details from Database
    const { data: listing, error: listingErr } = await supabase
      .from("product_listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", userId)
      .single();

    if (listingErr || !listing) {
      await logToDB(`Error: Listing ${listingId} not found in DB.`, 'error');
      return { error: "Listing not found", status: 404 };
    }

    await logToDB(`Starting optimization for: ${listing.title.substring(0, 30)}...`, 'info');

    // 2. Fetch user store credentials and decrypt eBay token
    const { data: credentials, error: credsErr } = await supabase
      .from("store_credentials")
      .select("encrypted_access_token, encrypted_refresh_token, iv, auth_tag")
      .eq("user_id", userId)
      .maybeSingle();

    if (credsErr || !credentials) {
      const errorMsg = credsErr ? credsErr.message : "Store credentials not found. Please connect your eBay store.";
      await logToDB(`Error: ${errorMsg}`, 'error');
      await supabase
        .from("product_listings")
        .update({
          status: "Failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId);
      return { error: errorMsg, status: 400 };
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
    } catch {
      await logToDB("Token decryption failed. Reconnect store credentials.", 'error');
      await supabase
        .from("product_listings")
        .update({
          status: "Failed",
          error_message: "Failed to decrypt eBay access token. Reconnect store credentials.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId);
      return { error: "Token decryption failed", status: 500 };
    }

    // 3. Call Claude AI to rewrite listing
    await logToDB(`Sending data to Claude AI for Cassini SEO optimization...`, 'info');
    let optimizedTitle = "";
    let optimizedDesc = "";
    let itemSpecifics = {};
    let titleCharacterCount = null;

    try {
      const protectedElements = listing.protected_elements || listing.sku || "";
      const result = await optimizeListingWithAI(listing.title, listing.description || "", protectedElements);
      optimizedTitle = result.optimized_title;
      optimizedDesc = result.optimized_description;
      itemSpecifics = result.item_specifics || {};
      titleCharacterCount = result.title_character_count || null;
      await logToDB(`Claude AI optimization successful!`, 'success');
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : "Anthropic optimization error";
      await logToDB(`Claude AI Optimization failed: ${msg}`, 'error');
      await supabase
        .from("product_listings")
        .update({
          status: "Failed",
          error_message: `AI Optimizer failed: ${msg}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId);
      return { error: `AI Optimization failed: ${msg}`, status: 500 };
    }

    // 4. Revise Fixed Price Item on eBay (if autoPublish is true)
    let finalStatus = "Pending Review";
    
    if (autoPublish) {
      await logToDB(`Syncing optimized listing back to eBay...`, 'info');
      const revision = await reviseEbayFixedPriceItem(
        listing.ebay_item_id,
        optimizedTitle,
        optimizedDesc,
        accessToken
      );

      if (!revision.success) {
        await logToDB(`eBay revision failed: ${revision.error}`, 'error');
        await supabase
          .from("product_listings")
          .update({
            status: "Failed",
            error_message: `eBay API error: ${revision.error}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", listingId);
        return { error: `eBay revision failed: ${revision.error}`, status: 500 };
      }
      
      finalStatus = "Optimized";
      await logToDB(`eBay sync successful! Status updated to Optimized.`, 'success');
    }

    // 5. Update Database listing status
    const { error: finalUpdateErr } = await supabase
      .from("product_listings")
      .update({
        status: finalStatus,
        optimized_title: optimizedTitle,
        optimized_description: optimizedDesc,
        item_specifics: itemSpecifics,
        title_character_count: titleCharacterCount,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    if (finalUpdateErr) throw finalUpdateErr;

    return { success: true, autoPublish };

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fatal worker execution error";
    
    // Attempt to mark listing as failed
    try {
      const logToDB = async (message: string) => supabase.from('system_logs').insert({ user_id: userId, message, level: 'error' });
      await logToDB(`Fatal background worker error: ${errorMsg}`);
      await supabase
        .from("product_listings")
        .update({
          status: "Failed",
          error_message: `Fatal error: ${errorMsg}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId);
    } catch (dbErr) {
      console.error("Failed to update listing failure status in DB:", dbErr);
    }

    return { error: errorMsg, status: 500 };
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { listingId, userId, autoPublish = true } = payload;
    
    if (!listingId || !userId) {
      return NextResponse.json({ error: "Missing listingId or userId" }, { status: 400 });
    }

    const result = await processOptimizationJob(listingId, userId, autoPublish);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Malformed body" }, { status: 400 });
  }
}
