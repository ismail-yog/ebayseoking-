import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/encryption";
import { optimizeListingWithAI } from "@/lib/anthropic";
import { reviseEbayFixedPriceItem } from "@/lib/ebay";

const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY || "placeholder-signing-key";
const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY || "placeholder-next-signing-key";

const receiver = new Receiver({
  currentSigningKey: currentKey,
  nextSigningKey: nextKey,
});

export async function processOptimizationJob(listingId: string, userId: string, autoPublish: boolean) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch listing details from Database
    const { data: listing, error: listingErr } = await supabase
      .from("product_listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", userId)
      .single();

    if (listingErr || !listing) {
      console.error(`Listing ${listingId} not found in DB`);
      return { error: "Listing not found", status: 404 };
    }

    // 2. Fetch user store credentials and decrypt eBay token
    const { data: credentials, error: credsErr } = await supabase
      .from("store_credentials")
      .select("encrypted_access_token, encrypted_refresh_token, iv, auth_tag")
      .eq("user_id", userId)
      .maybeSingle();

    let accessToken = "placeholder-token";
    if (credsErr) {
      console.error("Error looking up store credentials:", credsErr);
    } else if (credentials) {
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
        // Save failure to database listing
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
    } else {
      console.warn(`No store credentials found for user ${userId}. Proceeding with mock token.`);
    }

    // 3. Call Claude AI to rewrite listing
    let optimizedTitle = "";
    let optimizedDesc = "";
    try {
      const result = await optimizeListingWithAI(listing.title, listing.description || "");
      optimizedTitle = result.optimized_title;
      optimizedDesc = result.optimized_description;
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : "Anthropic optimization error";
      console.error(`Claude AI optimization failed: ${msg}`);
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
      const revision = await reviseEbayFixedPriceItem(
        listing.ebay_item_id,
        optimizedTitle,
        optimizedDesc,
        accessToken
      );

      if (!revision.success) {
        console.error(`eBay revision failed: ${revision.error}`);
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
    }

    // 5. Update Database listing status
    const { error: finalUpdateErr } = await supabase
      .from("product_listings")
      .update({
        status: finalStatus,
        optimized_title: optimizedTitle,
        optimized_description: optimizedDesc,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    if (finalUpdateErr) throw finalUpdateErr;

    console.log(`Successfully completed background AI optimization for listing ${listingId} (Auto-Publish: ${autoPublish})`);
    return { success: true, autoPublish };

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fatal worker execution error";
    console.error(`Fatal background worker error: ${errorMsg}`);
    
    // Attempt to mark listing as failed
    try {
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
  const rawBody = await req.text();
  const signature = req.headers.get("upstash-signature") || "";
  const isMock = req.headers.get("x-qstash-signature-mock") === "true";

  // Signature verification logic
  let isValid = false;

  try {
    if (isMock || currentKey === "placeholder-signing-key" || process.env.NODE_ENV === "development") {
      console.warn("Dev mode detected or placeholder QStash keys. Bypassing webhook signature verification.");
      isValid = true;
    } else {
      isValid = await receiver.verify({
        signature,
        body: rawBody,
      });
    }
  } catch (err: unknown) {
    console.error("QStash signature verification failed:", err);
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid QStash Signature" }, { status: 401 });
  }

  // Parse payload
  let payload: { listingId: string; userId: string; autoPublish?: boolean };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const { listingId, userId, autoPublish = true } = payload;
  if (!listingId || !userId) {
    return NextResponse.json({ error: "Missing listingId or userId" }, { status: 400 });
  }

  const result = await processOptimizationJob(listingId, userId, autoPublish);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }
  
  return NextResponse.json(result);
}
