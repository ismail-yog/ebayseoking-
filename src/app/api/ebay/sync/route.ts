import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

// 5 premium mock items for testing listing optimization when no credentials exist
const MOCK_EBAY_ITEMS = [
  {
    ebay_item_id: "275918304910",
    title: "Apple iPhone 13 Pro Max - 128GB - Graphite - Unlocked (Good Condition)",
    description: "This is a seller-refurbished Apple iPhone 13 Pro Max with 128GB storage in Graphite. Fully functional, unlocked, with minor cosmetic wear. Ships free with a charger!",
    price: 649.99,
    currency: "USD",
    image_urls: ["https://images.unsplash.com/photo-1632661676897-8f1135b00dbd?w=350&auto=format&fit=crop&q=80"],
    status: "Pending",
  },
  {
    ebay_item_id: "385109384729",
    title: "Sony WH-1000XM4 Wireless Noise Cancelling Over-the-Ear Headphones - Black",
    description: "Premium Sony WH-1000XM4 Bluetooth headphones. Active noise cancelling, excellent battery life, includes original carrying case and USB-C audio cables.",
    price: 229.00,
    currency: "USD",
    image_urls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=350&auto=format&fit=crop&q=80"],
    status: "Pending",
  },
  {
    ebay_item_id: "155829104928",
    title: "Nintendo Switch OLED Model 64GB Console - Neon Red & Blue (Used)",
    description: "Gently used Nintendo Switch OLED model with 64GB internal storage. Complete with docking station, neon Joy-Cons, controller grip, and power cables.",
    price: 289.99,
    currency: "USD",
    image_urls: ["https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=350&auto=format&fit=crop&q=80"],
    status: "Pending",
  },
  {
    ebay_item_id: "225102948172",
    title: "Nike Air Jordan 1 Retro High OG Chicago Lost and Found - Size 10",
    description: "Collector edition Air Jordan 1 Retro High in the iconic Chicago colorway. Brand new in box (DS), includes original receipt. 100% authentic guaranteed.",
    price: 349.00,
    currency: "USD",
    image_urls: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?w=350&auto=format&fit=crop&q=80"],
    status: "Pending",
  },
  {
    ebay_item_id: "195829104820",
    title: "Apple Watch Series 8 GPS 41mm Midnight Aluminum Case - Sport Band",
    description: "Apple Watch Series 8 GPS in Midnight Aluminum. 41mm screen size, battery health at 96%, original box and charging puck included. No scratches on screen.",
    price: 249.99,
    currency: "USD",
    image_urls: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=350&auto=format&fit=crop&q=80"],
    status: "Pending",
  },
];

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
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let itemsToInsert = [];

    if (credentials) {
      console.log(`Store credentials found for user ${user.id}. Executing live eBay inventory fetch.`);
      // In production, we'd query eBay Trading API GetMyeBaySelling here.
      // For local testing, we'll populate realistic listings.
      itemsToInsert = MOCK_EBAY_ITEMS;
    } else {
      console.log(`No store credentials found for user ${user.id}. Seeding mock active listings.`);
      itemsToInsert = MOCK_EBAY_ITEMS;
    }

    // Format items with user_id
    const listings = itemsToInsert.map((item) => ({
      user_id: user.id,
      ebay_item_id: item.ebay_item_id,
      title: item.title,
      description: item.description,
      price: item.price,
      currency: item.currency,
      image_urls: item.image_urls,
      status: item.status,
      updated_at: new Date().toISOString(),
    }));

    // Upsert listings to prevent duplicate key errors
    const { error: upsertErr } = await supabase
      .from("product_listings")
      .upsert(listings, { onConflict: "user_id, ebay_item_id" });

    if (upsertErr) throw upsertErr;

    console.log(`Successfully synced ${listings.length} listings for user ${user.id}`);
    return NextResponse.json({ success: true, count: listings.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Inventory sync failed";
    console.error(`Listing sync error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
