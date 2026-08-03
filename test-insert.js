const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching a user...");
  const { data: users } = await supabase.from("users").select("id").limit(1);
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  const userId = users[0].id;
  console.log("User ID:", userId);

  console.log("Fetching credentials for user...");
  const { data: creds, error: credError } = await supabase.from("store_credentials").select("*").eq("user_id", userId).single();
  console.log("Credentials:", creds);
  if (credError) console.error("Cred Error:", credError);

  if (creds) {
    console.log("Attempting insert...");
    const { error: insertError } = await supabase.from("product_listings").upsert({
      user_id: userId,
      ebay_item_id: "TEST123456",
      title: "Test Item",
      status: "Pending",
      platform: "ebay",
      external_product_id: "TEST123456",
      original_title: "Test Item",
      store_credential_id: creds.id
    });
    console.log("Insert Error:", insertError);
  }
}

run();
