/**
 * Helper to interact with the eBay Trading API using XML.
 * Generates XML payloads and posts to eBay servers.
 */

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
