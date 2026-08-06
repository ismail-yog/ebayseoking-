const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching credentials...");
  const { data: creds } = await supabase.from("store_credentials").select("*").limit(1);
  const cred = creds[0];
  const userId = cred.user_id;

  if (cred) {
    console.log("Attempting exact route.ts payload insert...");
    
    const obj1 = {
        user_id: userId,
        platform: "ebay",
        store_credential_id: cred.id,
        ebay_item_id: "TEST-LIVE-1",
        external_product_id: "TEST-LIVE-1",
        original_title: "Title",
        title: "Title",
        description: "Desc",
        price: 10.0,
        currency: "USD",
        image_urls: [],
        status: "Pending",
        optimized_title: null,
        optimized_description: null,
        updated_at: new Date().toISOString(),
    };
    
    const obj2 = {
        user_id: userId,
        platform: "ebay",
        store_credential_id: cred.id,
        ebay_item_id: "TEST-LIVE-2",
        external_product_id: "TEST-LIVE-2",
        original_title: "Title",
        title: "Title",
        description: "Desc",
        price: 10.0,
        currency: "USD",
        image_urls: [],
        status: "Pending",
        optimized_title: null,
        optimized_description: null,
        updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("product_listings").upsert([obj1, obj2], { onConflict: "user_id,ebay_item_id" });
    
    console.log("Insert Error:", insertError);
  }
}

run();
