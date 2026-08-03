const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching latest logs...");
  const { data: logs, error } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching logs:", error);
    return;
  }
  
  console.log("Latest Logs:");
  logs.forEach(log => {
    console.log(`[${log.level}] ${log.created_at}: ${log.message}`);
  });

  console.log("\nFetching latest listing errors...");
  const { data: listings } = await supabase
    .from("product_listings")
    .select("ebay_item_id, status, error_message, updated_at")
    .eq("status", "Failed")
    .order("updated_at", { ascending: false })
    .limit(5);
    
  console.log("Latest Failed Listings:");
  listings.forEach(l => console.log(l));
}

run();
