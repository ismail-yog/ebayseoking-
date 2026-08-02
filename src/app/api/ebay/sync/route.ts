import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";


export async function POST(req: Request) {
  try {
    // Parse limit from request if provided
    let userRequestedLimit = 10;
    try {
      const body = await req.json();
      if (body && typeof body.limit === 'number') {
        userRequestedLimit = body.limit;
      }
    } catch {
      // Ignore if no body
    }

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
        // 1. Get Valid eBay Access Token (auto-refreshes if needed)
        const { getValidEbayToken } = await import("@/lib/ebay");
        const accessToken = await getValidEbayToken(user.id, supabase);
        const clientId = process.env.EBAY_CLIENT_ID || "";
        const clientSecret = process.env.EBAY_CLIENT_SECRET || "";
        const isProd = process.env.EBAY_ENVIRONMENT === "production";
        
        const endpoint = isProd
          ? "https://api.ebay.com/ws/api.dll"
          : "https://api.sandbox.ebay.com/ws/api.dll";

        // Use the dynamically requested limit from the frontend
        const LISTING_LIMIT = userRequestedLimit;
        
        const allItemsXml: string[] = [];
        let page = 1;
        let totalPages = 1;
        let totalFetched = 0;

        do {
          const remainingToFetch = LISTING_LIMIT - totalFetched;
          if (remainingToFetch <= 0) break;
          
          const entriesPerPage = Math.min(remainingToFetch, 200);

          console.log(`Fetching active items page ${page} of ${totalPages} from eBay (Limit: ${entriesPerPage})...`);
          // 2. Query eBay XML Trading API (GetMyeBaySelling)
          const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${accessToken}</eBayAuthToken>
  </RequesterCredentials>
  <ActiveList>
    <Sort>TimeLeft</Sort>
    <Pagination>
      <EntriesPerPage>${entriesPerPage}</EntriesPerPage>
      <PageNumber>${page}</PageNumber>
    </Pagination>
  </ActiveList>
  <DetailLevel>ReturnSummary</DetailLevel>
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
            totalFetched += matches.length;
          } else {
            console.warn(`No active items returned from page ${page}.`);
            break;
          }

          if (totalFetched >= LISTING_LIMIT) {
             console.log(`Reached listing limit of ${LISTING_LIMIT}. Stopping fetch.`);
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

          // We are skipping fetching descriptions here to save API limits (Lazy Loading)
          itemsToInsert = rawItems.map(item => ({
            ...item,
            description: existingMap.get(item.ebay_item_id)?.description || "eBay active listing."
          }));

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
      .upsert(listings, { onConflict: "ebay_item_id" });

    if (upsertErr) {
       console.error("Supabase Upsert Error: ", JSON.stringify(upsertErr));
       throw new Error(`Database Error: ${upsertErr.message}`);
    }

    console.log(`Successfully synced ${listings.length} listings (Live: ${isLiveSync}) for user ${user.id}`);
    return NextResponse.json({ success: true, count: listings.length, live: isLiveSync });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Inventory sync failed";
    console.error(`Listing sync error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
