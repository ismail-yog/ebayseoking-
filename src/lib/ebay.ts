/**
 * Helper to interact with the eBay Trading API using XML.
 * Generates XML payloads and posts to eBay servers.
 */
import { createAdminClient } from "./supabase/admin";
import { encryptCredentials, decryptCredentials } from "./encryption";

export async function getValidEbayToken(userId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: creds, error } = await supabase
    .from("store_credentials")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !creds) {
    throw new Error("No eBay credentials found for user.");
  }

  // Decrypt tokens
  const decrypted = decryptCredentials(
    creds.encrypted_access_token,
    creds.encrypted_refresh_token,
    creds.iv,
    creds.auth_tag
  );

  const expiresAt = new Date(creds.token_expires_at);
  const now = new Date();
  
  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`eBay token for ${userId} is expired or expiring soon. Refreshing...`);
    
    const clientId = process.env.EBAY_CLIENT_ID || "";
    const clientSecret = process.env.EBAY_CLIENT_SECRET || "";
    const isProd = process.env.EBAY_ENVIRONMENT === "production";

    const tokenUrl = isProd
      ? "https://api.ebay.com/identity/v1/oauth2/token"
      : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";

    const credentialsBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentialsBase64}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decrypted.refreshToken,
        scope: "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`eBay Refresh Token Error: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;
    const newExpiresIn = tokenData.expires_in;
    const newTokenExpiresAt = new Date(Date.now() + newExpiresIn * 1000).toISOString();
    
    // Encrypt new tokens (eBay refresh token usually stays the same, but we encrypt both)
    const newRefresh = tokenData.refresh_token || decrypted.refreshToken;
    const encrypted = encryptCredentials(newAccessToken, newRefresh);
    
    await supabase
      .from("store_credentials")
      .update({
        encrypted_access_token: encrypted.encryptedAccessToken,
        encrypted_refresh_token: encrypted.encryptedRefreshToken,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        token_expires_at: newTokenExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    console.log(`Successfully refreshed eBay token for user ${userId}.`);
    return newAccessToken;
  }

  return decrypted.accessToken;
}

export async function getItemDescription(
  itemId: string,
  accessToken: string
): Promise<string> {
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const isSandbox = process.env.EBAY_ENVIRONMENT === "sandbox";
  const endpoint = isSandbox
    ? "https://api.sandbox.ebay.com/ws/api.dll"
    : "https://api.ebay.com/ws/api.dll";

  const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${accessToken}</eBayAuthToken>
  </RequesterCredentials>
  <ItemID>${itemId}</ItemID>
  <DetailLevel>ReturnAll</DetailLevel>
</GetItemRequest>`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
        "X-EBAY-API-CALL-NAME": "GetItem",
        "X-EBAY-API-SITEID": "0", // US Site
        "Content-Type": "text/xml",
      },
      body: xmlBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`eBay API returned status ${response.status}: ${errText}`);
    }

    const responseText = await response.text();

    if (responseText.includes("<Ack>Failure</Ack>") || responseText.includes("<SeverityCode>Error</SeverityCode>")) {
      const errorMsgMatch = responseText.match(/<LongMessage>(.*?)<\/LongMessage>/);
      const errorMsg = errorMsgMatch ? errorMsgMatch[1] : "Unknown eBay API Error";
      throw new Error(errorMsg);
    }

    // Extract Description (handles CDATA)
    const descMatch = responseText.match(/<Description>([\s\S]*?)<\/Description>/);
    if (!descMatch) return "";
    let description = descMatch[1];
    if (description.startsWith("<![CDATA[") && description.endsWith("]]>")) {
      description = description.substring(9, description.length - 3);
    }
    return description;
  } catch (err) {
    console.error(`Error in getItemDescription for ${itemId}:`, err);
    throw err;
  }
}

export async function reviseEbayFixedPriceItem(
  itemId: string,
  title: string,
  description: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken) {
    return { success: false, error: "Access token is missing" };
  }

  const isSandbox = process.env.EBAY_ENVIRONMENT === "sandbox";
  const endpoint = isSandbox
    ? "https://api.sandbox.ebay.com/ws/api.dll"
    : "https://api.ebay.com/ws/api.dll";

  const makeRevisionCall = async (callName: "ReviseFixedPriceItem" | "ReviseItem") => {
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  <Item>
    <ItemID>${itemId}</ItemID>
    <Title><![CDATA[${title}]]></Title>
    <Description><![CDATA[${description}]]></Description>
  </Item>
  <WarningLevel>High</WarningLevel>
</${callName}Request>`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
        "X-EBAY-API-CALL-NAME": callName,
        "X-EBAY-API-SITEID": "0", // US Site
        "X-EBAY-API-IAF-TOKEN": accessToken,
        "Content-Type": "text/xml",
      },
      body: xmlBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `eBay API returned status ${response.status}: ${errText}` };
    }

    const responseText = await response.text();

    if (responseText.includes("<Ack>Failure</Ack>") || responseText.includes("<SeverityCode>Error</SeverityCode>")) {
      const errorMsgMatch = responseText.match(/<LongMessage>(.*?)<\/LongMessage>/);
      const errorMsg = errorMsgMatch ? errorMsgMatch[1] : "Unknown eBay API Error";
      return { success: false, error: errorMsg };
    }

    return { success: true };
  };

  try {
    // Try ReviseFixedPriceItem first
    const res = await makeRevisionCall("ReviseFixedPriceItem");
    if (res.success) {
      return res;
    }

    // Check if error suggests it's not a fixed price listing, then fallback to ReviseItem
    const errMsg = res.error || "";
    const isNotFixedPrice = 
      errMsg.toLowerCase().includes("fixed price") || 
      errMsg.toLowerCase().includes("fixedprice") ||
      errMsg.toLowerCase().includes("listing type") ||
      errMsg.toLowerCase().includes("invalid listing type");

    if (isNotFixedPrice) {
      console.log(`ReviseFixedPriceItem failed due to listing type. Retrying with ReviseItem for listing ${itemId}...`);
      return await makeRevisionCall("ReviseItem");
    }

    return res;
  } catch (err: unknown) {
    console.error("Error calling eBay Trading API:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network request failed" };
  }
}
