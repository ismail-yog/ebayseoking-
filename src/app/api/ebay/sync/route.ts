import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { decryptCredentials } from "@/lib/encryption";
import { getItemDescription } from "@/lib/ebay";

export async function POST() {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if store credentials exist
    const { data: credentials } = await supabase
      .from("store_credentials")
      .select("encrypted_access_token, encrypted_refresh_token, iv, auth_tag")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!credentials) {
      return NextResponse.json(
        { error: "No eBay store connected. Please connect your eBay store first." },
        { status: 400 }
      );
    }

    interface EbayItem {
      ebay_item_id: string;
      title: string;
      description: string;
      price: number;
      currency: string;
      image_urls: string[];
      status: string;
    }

    let itemsToInsert: EbayItem[] = [];
    let isLiveSync = false;

    if (credentials) {
      console.log(`Store credentials found for user ${user.id}. Executing live eBay inventory fetch.`);
      
      try {
        // 1. Decrypt eBay Access Token
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

        const allItemsXml: string[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          console.log(`Fetching active items page ${page} of ${totalPages} from eBay...`);
          // 2. Query eBay XML Trading API (GetMyeBaySelling)
          const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${accessToken}</eBayAuthToken>
  </RequesterCredentials>
  <ActiveList>
    <Sort>TimeLeft</Sort>
    <Pagination>
      <EntriesPerPage>200</EntriesPerPage>
      <PageNumber>${page}</PageNumber>
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
            console.error(`eBay API request failed on page ${page}: ${response.status}`);
            break;
          }

          const xmlResponse = await response.text();
          
          if (page === 1) {
            const totalPagesMatch = xmlResponse.match(/<TotalNumberOfPages>(\d+)<\/TotalNumberOfPages>/);
            if (totalPagesMatch) {
              totalPages = parseInt(totalPagesMatch[1]);
            }
          }

          const matches = xmlResponse.match(/<Item>([\s\S]*?)<\/Item>/g);
          if (matches && matches.length > 0) {
            allItemsXml.push(...matches);
          } else {
            console.warn(`No active items returned from page ${page}.`);
            break;
          }

          page++;
        } while (page <= totalPages);

        if (allItemsXml.length > 0) {
          const rawItems = allItemsXml.map((itemXml) => {
            const ebay_item_id = itemXml.match(/<ItemID>(.*?)<\/ItemID>/)?.[1] || "";
            const title = itemXml.match(/<Title>(.*?)<\/Title>/)?.[1] || "";
            const priceVal = itemXml.match(/<CurrentPrice[^>]*>(.*?)<\/CurrentPrice>/)?.[1] || "0.00";
            const currency = itemXml.match(/<CurrentPrice currencyID="(.*?)">/)?.[1] || "USD";
            const imageUrl = itemXml.match(/<GalleryURL>(.*?)<\/GalleryURL>/)?.[1] || "";

            return {
              ebay_item_id,
              title,
              description: "",
              price: parseFloat(priceVal) || 0.0,
              currency,
              image_urls: imageUrl ? [imageUrl] : [],
              status: "Pending",
            };
          });

          // Fetch existing listings from DB to reuse descriptions and preserve statuses
          const { data: existingListings } = await supabase
            .from("product_listings")
            .select("ebay_item_id, description, status, optimized_title, optimized_description")
            .eq("user_id", user.id);

          const existingMap = new Map(existingListings?.map(l => [l.ebay_item_id, l]) || []);

          // Fetch descriptions in batches of 10 for new items only
          console.log(`Fetching descriptions for ${rawItems.length} items...`);
          const batchSize = 10;
          itemsToInsert = [];

          for (let i = 0; i < rawItems.length; i += batchSize) {
            const chunk = rawItems.slice(i, i + batchSize);
            const chunkRes = await Promise.all(
              chunk.map(async (item) => {
                const existing = existingMap.get(item.ebay_item_id);
                if (existing && existing.description) {
                  return { ...item, description: existing.description };
                }

                try {
                  const desc = await getItemDescription(item.ebay_item_id, accessToken);
                  return { ...item, description: desc || "eBay active listing." };
                } catch (err) {
                  console.error(`Failed to fetch description for ${item.ebay_item_id}:`, err);
                  return { ...item, description: "eBay active listing." };
                }
              })
            );
            itemsToInsert.push(...chunkRes);
          }

          isLiveSync = true;
          console.log(`Live synced ${itemsToInsert.length} active items from eBay.`);
        } else {
          console.warn("No active items returned from eBay GetMyeBaySelling.");
        }
      } catch (syncErr) {
        console.error("Error during live eBay listing sync:", syncErr);
      }
    }

    // If no active items were fetched, return success with count 0
    if (itemsToInsert.length === 0) {
      console.log("No listings found to sync.");
      return NextResponse.json({ success: true, count: 0, live: isLiveSync });
    }

    // Fetch existing listings from DB to preserve statuses (again just in case map changed)
    const { data: existingListings } = await supabase
      .from("product_listings")
      .select("ebay_item_id, status, optimized_title, optimized_description")
      .eq("user_id", user.id);

    const existingMap = new Map(existingListings?.map(l => [l.ebay_item_id, l]) || []);

    // Format items with user_id
    const listings = itemsToInsert.map((item) => {
      const existing = existingMap.get(item.ebay_item_id);
      return {
        user_id: user.id,
        ebay_item_id: item.ebay_item_id,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        image_urls: item.image_urls,
        status: existing ? existing.status : item.status,
        optimized_title: existing ? existing.optimized_title : null,
        optimized_description: existing ? existing.optimized_description : null,
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert listings to prevent duplicate key errors
    const { error: upsertErr } = await supabase
      .from("product_listings")
      .upsert(listings, { onConflict: "user_id, ebay_item_id" });

    if (upsertErr) throw upsertErr;

    console.log(`Successfully synced ${listings.length} listings (Live: ${isLiveSync}) for user ${user.id}`);
    return NextResponse.json({ success: true, count: listings.length, live: isLiveSync });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Inventory sync failed";
    console.error(`Listing sync error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
