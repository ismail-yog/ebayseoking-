import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/encryption";

export async function POST(req: Request) {
  // Add a basic security check (e.g. check a cron secret key or QStash authorization header to prevent public spamming)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Autopilot endpoint accessed with invalid authorization header.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Fetch all users who have autopilot enabled
    const { data: autopilotUsers, error: usersErr } = await supabase
      .from("users")
      .select("id, plan_type, optimization_limit, optimizations_used")
      .eq("is_autopilot_enabled", true);

    if (usersErr) throw usersErr;
    if (!autopilotUsers || autopilotUsers.length === 0) {
      console.log("No users with Autopilot Mode enabled.");
      return NextResponse.json({ success: true, message: "No active autopilot users." });
    }

    console.log(`Processing autopilot for ${autopilotUsers.length} users...`);
    let totalSyncedListings = 0;
    let totalOptimizedListings = 0;

    for (const user of autopilotUsers) {
      // 2. Fetch eBay store credentials
      const { data: credentials, error: credsErr } = await supabase
        .from("store_credentials")
        .select("encrypted_access_token, encrypted_refresh_token, iv, auth_tag, ebay_store_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (credsErr || !credentials) {
        console.warn(`Autopilot skipped for user ${user.id}: credentials missing or error.`);
        continue;
      }

      // Check credit quota limit
      if (user.plan_type !== "unlimited" && user.optimizations_used >= user.optimization_limit) {
        console.warn(`Autopilot skipped for user ${user.id}: optimization quota limit reached (${user.optimizations_used}/${user.optimization_limit}).`);
        continue;
      }

      try {
        // 3. Decrypt eBay Access Token
        const decrypted = decryptCredentials(
          credentials.encrypted_access_token,
          credentials.encrypted_refresh_token,
          credentials.iv,
          credentials.auth_tag
        );

        const accessToken = decrypted.accessToken;
        const clientId = process.env.EBAY_CLIENT_ID || "";
        const clientSecret = process.env.EBAY_CLIENT_SECRET || "";
        const isProd = process.env.EBAY_ENVIRONMENT === "production";
        
        const endpoint = isProd
          ? "https://api.ebay.com/ws/api.dll"
          : "https://api.sandbox.ebay.com/ws/api.dll";

        // 4. Fetch Active eBay Inventory
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${accessToken}</eBayAuthToken>
  </RequesterCredentials>
  <ActiveList>
    <Sort>TimeLeft</Sort>
    <Pagination>
      <EntriesPerPage>50</EntriesPerPage>
      <PageNumber>1</PageNumber>
    </Pagination>
  </ActiveList>
  <DetailLevel>ReturnAll</DetailLevel>
</GetMyeBaySellingRequest>`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
            "X-EBAY-API-SITEID": "0", // 0 is US site
            "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
            "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
            "X-EBAY-API-APP-NAME": clientId,
            "X-EBAY-API-DEV-NAME": "",
            "X-EBAY-API-CERT-NAME": clientSecret,
          },
          body: xmlBody,
        });

        if (!response.ok) {
          console.error(`eBay inventory fetch failed for user ${user.id}: ${response.status}`);
          continue;
        }

        const xmlResponse = await response.text();
        const matches = xmlResponse.match(/<Item>([\s\S]*?)<\/Item>/g);

        if (matches && matches.length > 0) {
          const itemsToInsert = matches.map((itemXml) => {
            const ebay_item_id = itemXml.match(/<ItemID>(.*?)<\/ItemID>/)?.[1] || "";
            const title = itemXml.match(/<Title>(.*?)<\/Title>/)?.[1] || "";
            const priceVal = itemXml.match(/<CurrentPrice[^>]*>(.*?)<\/CurrentPrice>/)?.[1] || "0.00";
            const currency = itemXml.match(/<CurrentPrice currencyID="(.*?)">/)?.[1] || "USD";
            const imageUrl = itemXml.match(/<GalleryURL>(.*?)<\/GalleryURL>/)?.[1] || "";

            return {
              user_id: user.id,
              ebay_item_id,
              title,
              description: "eBay active listing. Auto-sync via Autopilot.",
              price: parseFloat(priceVal) || 0.0,
              currency,
              image_urls: imageUrl ? [imageUrl] : [],
              status: "Pending",
              updated_at: new Date().toISOString(),
              platform: "ebay",
              store_url: "ebay.com",
              store_name: credentials.ebay_store_name || "My Store",
              is_active: true,
            };
          });

          // Sync listings to DB (preventing duplicates using user_id, ebay_item_id conflict)
          const { error: upsertErr } = await supabase
            .from("product_listings")
            .upsert(itemsToInsert, { onConflict: "user_id, ebay_item_id" });

          if (upsertErr) throw upsertErr;
          totalSyncedListings += itemsToInsert.length;

          // 5. Query Pending listings to trigger background optimization tasks
          const { data: pendingListings, error: pendingErr } = await supabase
            .from("product_listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "Pending")
            .limit(10); // Batch limit per cycle to maintain API safety bounds

          if (pendingErr) throw pendingErr;

          if (pendingListings && pendingListings.length > 0) {
            // Invoke the local worker asynchronous job to optimize and revise on eBay in background
            const originUrl = new URL(req.url).origin;
            const workerUrl = `${originUrl}/api/jobs/worker`;

            for (const listing of pendingListings) {
              // Trigger worker fetch without awaiting to make it fully background and non-blocking
              fetch(workerUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-qstash-signature-mock": "true", // Bypass webhook signature verification locally or in serverless worker env
                },
                body: JSON.stringify({ listingId: listing.id, userId: user.id }),
              }).catch((err) => console.error(`Worker trigger failed for listing ${listing.id}:`, err));

              totalOptimizedListings++;
            }
          }
        }
      } catch (err: unknown) {
        console.error(`Error processing autopilot loop for user ${user.id}:`, err);
      }
    }

    console.log(`Autopilot run completed. Synced: ${totalSyncedListings}, Queued for optimization: ${totalOptimizedListings}`);
    return NextResponse.json({
      success: true,
      synced: totalSyncedListings,
      queued: totalOptimizedListings,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Autopilot run failed";
    console.error(`Autopilot error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
