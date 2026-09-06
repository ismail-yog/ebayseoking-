const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching credentials for a user...");
  const { data: creds } = await supabase.from("store_credentials").select("*").limit(1);
  if (!creds || creds.length === 0) return console.log("No creds");
  
  const credentials = creds[0];
  const userId = credentials.user_id;
  
  console.log(`Testing full sync for user ${userId}`);

  // Fetch existing listings
  const { data: existingListings, error: getErr } = await supabase
    .from("product_listings")
    .select("id, ebay_item_id, status, optimized_title, optimized_description")
    .eq("user_id", userId);
    
  if (getErr) return console.log("Error fetching existing:", getErr);

  const existingMap = new Map(existingListings?.map(l => [l.ebay_item_id, l]) || []);
  
  // Create a mock payload of 3 items
  const rawItems = [
    {
      ebay_item_id: "EBAY_MOCK_1",
      title: "Test Title 1",
      description: "Test Desc",
      price: 19.99,
      currency: "USD",
      image_urls: [],
      status: "Pending"
    },
    {
      ebay_item_id: "EBAY_MOCK_2",
      title: "Test Title 2",
      description: "Test Desc",
      price: 29.99,
      currency: "USD",
      image_urls: [],
      status: "Pending"
    }
  ];
  
  const crypto = require("crypto");

  const listings = rawItems.map((item) => {
    const existing = existingMap.get(item.ebay_item_id);
    
    return {
      id: existing ? existing.id : crypto.randomUUID(),
      user_id: userId,
      platform: "ebay",
      store_credential_id: credentials.id,
      ebay_item_id: item.ebay_item_id,
      external_product_id: item.ebay_item_id,
      original_title: item.title,
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

  console.log("Upserting payload...");
  const { error: upsertErr } = await supabase
    .from("product_listings")
    .upsert(listings);
    
  if (upsertErr) {
    console.error("UPSERT ERROR:", upsertErr);
  } else {
    console.log("Upsert successful!");
  }
}

run();
