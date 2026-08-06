const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("product_listings")
    .select("id, ebay_item_id")
    .eq("ebay_item_id", "TEST789012");
    
  console.log("Data:", data, "Error:", error);
}

run();
