import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDE2MywiZXhwIjoyMDk2NzQwMTYzfQ.AuBk1LTDX4VROj6BnuuiKbFb5hqnDwN0Qsu3jZ9xKiw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Fetch the specific user ID to link the listings to
  const { data: users, error: userError } = await supabase.from('users').select('id').eq('email', 'immicpb@gmail.com').limit(1);
  
  if (userError || !users || users.length === 0) {
    console.error('Error fetching user immicpb@gmail.com or no users found:', userError);
    return;
  }
  
  const userId = users[0].id;

  // Check for store credential
  let { data: creds, error: credError } = await supabase.from('store_credentials').select('id').eq('user_id', userId).limit(1);
  
  let storeCredId = null;

  if (creds && creds.length > 0) {
    storeCredId = creds[0].id;
  } else {
    // Insert a dummy store credential
    const { data: newCred, error: insertCredError } = await supabase.from('store_credentials').insert({
      user_id: userId,
      platform: 'ebay',
      store_name: 'Dummy Store',
      store_url: 'https://ebay.com',
      encrypted_access_token: 'dummy',
      encrypted_refresh_token: 'dummy',
      iv: 'dummy',
      auth_tag: 'dummy'
    }).select();

    if (insertCredError || !newCred) {
      console.error('Failed to create dummy store credential:', insertCredError);
      return;
    }
    storeCredId = newCred[0].id;
  }
  
  const dummyListings = [
    {
      user_id: userId,
      platform: 'ebay',
      store_credential_id: storeCredId,
      external_product_id: '123456789001',
      ebay_item_id: '123456789001',
      original_title: 'Sony PlayStation 5 Console PS5 Disc Version Excellent Condition',
      title: 'Sony PlayStation 5 Console PS5 Disc Version Excellent Condition',
      description: 'Used PS5 console in great condition. Comes with one controller and power cable. No original box.',
      price: 399.99,
      currency: 'USD',
      image_urls: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400'],
      status: 'Pending',
      updated_at: new Date().toISOString()
    },
    {
      user_id: userId,
      platform: 'ebay',
      store_credential_id: storeCredId,
      external_product_id: '123456789002',
      ebay_item_id: '123456789002',
      original_title: 'Apple iPhone 13 Pro Max 128GB Unlocked Graphite',
      title: 'Apple iPhone 13 Pro Max 128GB Unlocked Graphite',
      description: 'Refurbished iPhone 13 Pro Max. Unlocked for all carriers. Battery health 89%. Small scratch on back glass.',
      price: 549.00,
      currency: 'USD',
      image_urls: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400'],
      status: 'Pending',
      updated_at: new Date().toISOString()
    },
    {
      user_id: userId,
      platform: 'ebay',
      store_credential_id: storeCredId,
      external_product_id: '123456789003',
      ebay_item_id: '123456789003',
      original_title: 'Nike Air Max 90 Men Sneakers Black/White Size 10.5',
      title: 'Nike Air Max 90 Men Sneakers Black/White Size 10.5',
      description: 'Brand new Nike Air Max 90. Men size 10.5. Never worn, comes with original box.',
      price: 120.00,
      currency: 'USD',
      image_urls: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400'],
      status: 'Pending',
      updated_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('product_listings')
    .upsert(dummyListings, { onConflict: 'user_id, ebay_item_id' });

  if (error) {
    console.error('Error inserting dummy listings:', error);
  } else {
    console.log('Successfully inserted 3 dummy listings!');
  }
}

main();
