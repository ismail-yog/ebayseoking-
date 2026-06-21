import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MOCK_TITLES = [
  'Vintage Leather Jacket Mens Medium',
  'Nintendo 64 Console Tested Working',
  'Pokemon Card Charizard Base Set',
  'Apple iPad Pro 12.9 5th Gen 256GB Space Gray',
  'Sony Headphones WH-1000XM4 Black',
  'Samsung Galaxy S22 Ultra 5G 512GB Unlocked',
  'Canon EOS R5 Mirrorless Camera Body',
  'DJI Mini 3 Pro Drone Combo',
  'Rolex Submariner 116610LN Stainless Steel',
  'Nike Dunk Low Panda Black White Sneakers'
];

async function insertDummy() {
  const listings = [];
  const targetUserId = 'bb4f2e09-c7b7-4973-8dfb-99885a22eada'; // immicpb@gmail.com
  
  const { data: creds } = await supabase.from('store_credentials').select('id').eq('user_id', targetUserId).limit(1);
  const storeCredId = creds && creds.length > 0 ? creds[0].id : null;

  for (let i = 0; i < 100; i++) {
    const randomTitle = MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)];
    listings.push({
      user_id: targetUserId,
      store_credential_id: storeCredId,
      platform: 'ebay',
      external_product_id: 'DUMMY' + Date.now() + i,
      ebay_item_id: 'DUMMY' + Date.now() + i,
      title: `${randomTitle} ${i}`,
      original_title: `${randomTitle} ${i}`,
      description: 'This is a high quality ' + randomTitle + ' ready for a quick sale. Check the photos for details.',
      original_description: 'This is a high quality ' + randomTitle + ' ready for a quick sale. Check the photos for details.',
      status: 'Pending',
      price: (Math.random() * 500 + 50).toFixed(2),
      currency: 'USD',
      image_urls: ['https://via.placeholder.com/150'],
      created_at: new Date().toISOString()
    });
  }

  const { error } = await supabase.from('product_listings').insert(listings);
  if (error) {
    console.error('Failed to insert dummy listings:', error);
  } else {
    console.log('Successfully inserted 100 dummy listings for bulk testing!');
  }
}
insertDummy();
