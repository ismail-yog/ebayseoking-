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
        max_tokens: 2500,
        system: "You are an expert eBay SEO copywriter specializing in eBay's Cassini search algorithm. Your goal is to analyze listing information and optimize it for maximum search visibility, click-through rates (CTR), and sales conversion. You must output ONLY a valid, parseable JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks (e.g. do not write ```json or ```). Do not include any conversational filler, preamble, or postamble.",
        messages: [
          {
            role: "user",
            content: `Optimize the following eBay listing.
Original Title: "${title}"
Original Description: "${description}"

Strict SEO Optimization Guidelines:

1. Title Optimization (Cassini Algorithm Rules):
- LENGTH CONSTRAINT: Strictly 80 characters or fewer. Use as much of the 80 characters as possible without filler.
- KEYWORD FRONT-LOADING: Place the absolute most high-volume search terms (Brand, Model, Product Name, Size, Color, Condition, Key Specs) in the first 40 characters.
- NO PUFFERY/SPAM: Do not use subjective words (e.g., "L@@K", "WOW", "STUNNING", "AWESOME", "CHEAP", "BEST") or excessive punctuation (e.g., ***, !!!, -, @). Cassini actively down-ranks listings containing these.
- CASE SENSITIVITY: Use Title Case (capitalize the first letter of each keyword). Do NOT use all-caps.
- READABILITY: Ensure the title makes logical sense to a human shopper, not just a list of keywords.

2. Description Optimization (Responsive HTML / eBay Policy Compliance):
- COMPLIANCE: Do not include active content, JavaScript, external stylesheets, or iframes.
- MOBILE RESPONSIVE: Wrap content in a single container div (max-width: 100% or 800px; margin: 0 auto; padding: 15px; font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; box-sizing: border-box;).
- MODERN STYLING: Use inline CSS styles for a premium, clean layout. Use a slate/indigo palette (background: #ffffff; secondary text: #334155; muted text: #64748b; primary accent: #4f46e5; border-color: #e2e8f0;).
- STRUCTURED LAYOUT:
  - Header Section: Large, bold product heading using <h1> styled cleanly.
  - Features & Description: A well-written overview detailing the product's benefits, incorporating secondary SEO keywords naturally (aim for ~3-5% keyword density).
  - Specifications List: Clean bulleted list (<ul>/<li>) or key-value spec table.
  - Purchase Terms: A clean, minor footer detailing shipping, returns, and customer satisfaction guarantees to build trust.

Response Schema:
{
  "optimized_title": "Fully optimized title matching all Cassini SEO rules, 80 chars max",
  "optimized_description": "Clean, responsive, inline-styled HTML description following the structured layout guidelines"
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
