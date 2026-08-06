const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zmtmwpetitsdhgtaficc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('product_listings')
    .select('id')
    .limit(1);
    
  console.log("Can query product_listings?", !error);

  // Instead of querying system tables, just look at how upsert might fail if the user's table actually doesn't have a default id!
  // Wait, I ALREADY proved my test script successfully inserts without an ID.
  // This means the user's table DOES have a default id!
  
}

run();
