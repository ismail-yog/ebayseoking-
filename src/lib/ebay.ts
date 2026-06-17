/**
 * Helper to interact with the eBay Trading API using XML.
 * Generates XML payloads and posts to eBay servers.
 */
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

  const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<ReviseFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <Item>
    <ItemID>${itemId}</ItemID>
    <Title><![CDATA[${title}]]></Title>
    <Description><![CDATA[${description}]]></Description>
  </Item>
  <WarningLevel>High</WarningLevel>
</ReviseFixedPriceItemRequest>`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
        "X-EBAY-API-CALL-NAME": "ReviseFixedPriceItem",
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

    // Check if the response contains error severity "Error"
    if (responseText.includes("<Ack>Failure</Ack>") || responseText.includes("<SeverityCode>Error</SeverityCode>")) {
      // Basic extraction of error message from XML
      const errorMsgMatch = responseText.match(/<LongMessage>(.*?)<\/LongMessage>/);
      const errorMsg = errorMsgMatch ? errorMsgMatch[1] : "Unknown eBay API Error";
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Error calling eBay Trading API:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network request failed" };
  }
}
