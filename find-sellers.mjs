import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const EBAY_CLIENT_ID = env.match(/EBAY_CLIENT_ID=(.*)/)[1].trim();
const EBAY_CLIENT_SECRET = env.match(/EBAY_CLIENT_SECRET=(.*)/)[1].trim();

async function getSellers() {
  console.log('Fetching Application Token...');
  const auth = Buffer.from(EBAY_CLIENT_ID + ':' + EBAY_CLIENT_SECRET).toString('base64');
  const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + auth
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });
  
  if (!tokenRes.ok) {
    console.error('Failed to get token', await tokenRes.text());
    return;
  }
  
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  
  console.log('Searching for items to find sellers...');
  const queries = ['vintage shirt', 'used guitar', 'collectible coin', 'mens boots', 'used camera lens', 'video game bundle'];
  const potentialSellers = new Map();

  for (const query of queries) {
    const searchRes = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=50&filter=itemLocationCountry:US`, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });
    
    if (!searchRes.ok) continue;
    
    const searchData = await searchRes.json();
    
    for (const item of searchData.itemSummaries || []) {
      if (item.seller && item.seller.username) {
        potentialSellers.set(item.seller.username, item.seller);
      }
    }
  }
  
  console.log('\n--- VERIFYING SELLER INVENTORIES ---');
  const verifiedSellers = [];
  
  // Check the actual live inventory for each seller
  for (const [username, sellerInfo] of potentialSellers.entries()) {
    if (verifiedSellers.length >= 10) break; // Stop when we have 10 to be fast
    
    try {
      console.log(`Checking inventory for ${username}...`);
      const inventoryRes = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=*&limit=1&filter=sellers:{${username}}`, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        },
        signal: AbortSignal.timeout(4000)
      });
      
      if (inventoryRes.ok) {
        const invData = await inventoryRes.json();
        // Ensure they have between 1 and 60 active listings
        if (invData.total && invData.total >= 1 && invData.total <= 60) {
          verifiedSellers.push({
            username: username,
            feedbackScore: sellerInfo.feedbackScore,
            feedbackPercentage: sellerInfo.feedbackPercentage,
            activeListingsCount: invData.total
          });
          console.log(`Verified ${username}: ${invData.total} active listings.`);
        }
      }
    } catch (e) {
      console.log(`Timeout or error for ${username}`);
    }
  }
  
  console.log('\n--- 100% VERIFIED ACTIVE SELLERS ---');
  console.log('These sellers were double-checked and definitely have active inventory right now:');
  
  verifiedSellers.sort((a, b) => a.activeListingsCount - b.activeListingsCount);
    
  for (const s of verifiedSellers) {
    console.log(`- Username: ${s.username} | Active Listings: ${s.activeListingsCount} | Feedback: ${s.feedbackScore}`);
    console.log(`  Store Link: https://www.ebay.com/usr/${s.username}`);
  }
}
getSellers();
