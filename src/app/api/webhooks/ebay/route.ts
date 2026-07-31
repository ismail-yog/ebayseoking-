import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// eBay requires a challenge response to verify the endpoint
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challengeCode = url.searchParams.get("challenge_code");

  if (challengeCode) {
    // Generate the challenge response
    const verificationToken = process.env.EBAY_WEBHOOK_VERIFICATION_TOKEN || "DEFAULT_TOKEN";
    const endpointUrl = process.env.EBAY_WEBHOOK_ENDPOINT_URL || `https://${url.host}/api/webhooks/ebay`;
    
    const hash = crypto.createHash("sha256");
    hash.update(challengeCode);
    hash.update(verificationToken);
    hash.update(endpointUrl);
    
    const challengeResponse = hash.digest("hex");
    
    return NextResponse.json({
      challengeResponse: challengeResponse
    });
  }

  return NextResponse.json({ error: "No challenge code provided" }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Received eBay Webhook:", JSON.stringify(payload));

    const topic = payload?.metadata?.topic;
    
    if (topic === "ITEM_REVISED" || topic === "ITEM_LISTED") {
      // The exact structure depends on eBay's Notification API. 
      // Typically, the payload data contains the item ID.
      const ebayItemId = payload?.notification?.data?.itemId;
      // We would need the merchant ID to match it to our user
      const merchantId = payload?.notification?.data?.sellerId; // hypothetical field

      if (ebayItemId) {
        const supabase = createAdminClient();
        
        // Find if we already have this listing
        const { data: existingListing } = await supabase
          .from("product_listings")
          .select("id")
          .eq("ebay_item_id", ebayItemId)
          .single();

        if (existingListing) {
          // Re-queue it for optimization
          await supabase
            .from("product_listings")
            .update({ 
              status: "Pending", 
              updated_at: new Date().toISOString(),
              error_message: null
            })
            .eq("id", existingListing.id);
          
          console.log(`Re-queued existing item ${ebayItemId} due to eBay webhook revision.`);
        } else {
          // We don't have the user mapping directly without doing a lookup on merchantId
          // For now, log it so we can implement the exact mapping later
          console.log(`Received webhook for new item ${ebayItemId}, but it is not in our database yet.`);
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("eBay Webhook Error:", msg);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
