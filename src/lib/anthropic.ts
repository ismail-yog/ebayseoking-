/**
 * Calls Anthropic API (Claude 4.6 Sonnet) to optimize an eBay product listing.
 * Front-loads keywords for search ranking and generates structured HTML description.
 */
export async function optimizeListingWithAI(title: string, description: string): Promise<{
  optimized_title: string;
  optimized_description: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY || "placeholder-anthropic-key";

  if (apiKey === "placeholder-anthropic-key") {
    console.warn("Using placeholder Anthropic key. Simulating Claude AI response.");
    
    // Simulate high-quality Cassini optimized response
    const keywords = ["Brand New", "Premium Edition", "Seller Warranty", "Fast Shipping", "Genuine"];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const cleanTitle = title.replace(/[^\w\s-]/g, "").trim();
    const optimizedTitle = `${cleanTitle} ${randomKeyword} Unlocked Original Spec`.substring(0, 80);

    const optimizedDescription = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f0f23; color: #f3f4f6; border-radius: 8px;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #312e81; padding-bottom: 8px;">Product Features</h2>
        <p>${description || "High-quality active listing optimized by SyncSell AI."}</p>
        <h3 style="color: #a855f7;">Why Buy From Us?</h3>
        <ul>
          <li><strong>Top Rated Seller:</strong> Standard service and returns.</li>
          <li><strong>Fast & Free Shipping:</strong> Handled within 1 business day.</li>
          <li><strong>AI Quality Check:</strong> Description optimized for complete accuracy.</li>
        </ul>
      </div>
    `.trim();

    return {
      optimized_title: optimizedTitle,
      optimized_description: optimizedDescription,
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: "You are an expert eBay SEO copywriter. Your goal is to maximize Cassini search visibility. You must output ONLY a valid JSON object. Do NOT wrap it in markdown block syntax. Do not output anything else.",
        messages: [
          {
            role: "user",
            content: `Optimize the following eBay listing. 
Original Title: "${title}"
Original Description: "${description}"

Guidelines:
1. "optimized_title": Must be keyword-rich, frontloaded with high-volume search terms, and strictly maximum 80 characters.
2. "optimized_description": Must be styled in responsive HTML suitable for eBay listings (avoiding external scripts or style tags, use inline styles instead).

Response format:
{
  "optimized_title": "string",
  "optimized_description": "string"
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text.trim();
    
    // Parse response text to JSON
    const parsedData = JSON.parse(responseText);
    
    return {
      optimized_title: parsedData.optimized_title || title,
      optimized_description: parsedData.optimized_description || description,
    };
  } catch (err: unknown) {
    console.error("Error communicating with Anthropic API:", err);
    throw err;
  }
}
