import Anthropic from "@anthropic-ai/sdk";

/**
 * Calls Anthropic API (Claude Sonnet) to optimize an eBay product listing.
 * Front-loads keywords for search ranking, extracts item specifics,
 * and generates structured HTML description.
 */
export async function optimizeListingWithAI(title: string, description: string, protectedElements?: string): Promise<{
  optimized_title: string;
  optimized_description: string;
  item_specifics?: Record<string, string>;
  title_character_count?: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "placeholder-anthropic-key") {
    throw new Error("Missing or invalid ANTHROPIC_API_KEY. Please configure your API key to use the Autopilot.");
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: `You are an expert eBay SEO copywriter specializing in eBay's Cassini search algorithm. Your goal is to analyze listing information, retain all critical seller data, and optimize the listing for maximum search visibility, click-through rates (CTR), and sales conversion organically. You must output ONLY a valid, parseable JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks (e.g. do not write \`\`\`json or \`\`\`). Do not include any conversational filler.`,
      messages: [
        {
          role: "user",
          content: `Optimize the following eBay listing.
Original Title: "${title}"
Original Description: "${description}"
Protected Elements/IDs (DO NOT CHANGE): "${protectedElements || 'None'}"

Strict SEO Optimization Guidelines:

1. Handling Identifiers & Protected Elements (CRITICAL CONSTRAINT):
* ABSOLUTE PRESERVATION: You must strictly retain any text, phrases, or numbers provided in the "Protected Elements" field. Do not alter, translate, or truncate them.
* PRODUCT IDs: If a Product ID, Part Number, MPN, UPC, or SKU is detected in the original text or protected elements, do NOT change it.
* ID PLACEMENT: Place any part numbers/IDs at the VERY END of the 80-character title (so they do not disturb the front-loaded SEO keywords) AND explicitly include them in the Item Specifics extraction.

2. Keyword Expansion & Best-Seller Semantic Injection:
* Analyze the product and internally generate the highest-converting, top-tier semantic keywords associated with this type of item (e.g., "OEM", "Authentic", "Vintage", "Mens/Womens", use-cases, or compatible brands).
* Weave these high-value predicted keywords naturally into the Title (if space permits) and heavily throughout the Description's features/benefits section to capture maximum organic long-tail search traffic.

3. Title Optimization (Cassini Algorithm Rules):
* LENGTH CONSTRAINT: Strictly 80 characters or fewer. Use as much of the 80 characters as possible without filler.
* KEYWORD FRONT-LOADING: Place the absolute most high-volume search terms (Brand, Model, Product Name, Size, Color, Condition) in the first 40 characters.
* NO PUFFERY/SPAM: Do not use subjective words (e.g., "L@@K", "WOW", "STUNNING", "AWESOME", "CHEAP", "BEST") or excessive punctuation.
* CASE SENSITIVITY: Use Title Case (capitalize the first letter of each keyword). Do NOT use all-caps.

4. Item Specifics Extraction (The Filter Focus):
* Extract all factual data points (Brand, MPN, Color, Material, Size, Type, etc.) from the original title, description, and protected elements.
* Format these as key-value pairs to ensure the listing appears in eBay's left-hand filtered searches.

5. Description Optimization (Responsive HTML / eBay Policy Compliance):
* COMPLIANCE: Do not include active content, JavaScript, external stylesheets, or iframes. Do NOT include ANY contact information, external website links, or phrases like "Contact us".
* MOBILE RESPONSIVE: Wrap content in a single container div (max-width: 100% or 800px; margin: 0 auto; padding: 15px; font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; box-sizing: border-box;).
* MODERN STYLING: Use inline CSS styles for a premium layout. Use a slate/indigo palette (background: #ffffff; secondary text: #334155; muted text: #64748b; primary accent: #4f46e5; border-color: #e2e8f0;).
* STRUCTURED LAYOUT: Include a large bold <h1> heading, a features/benefits paragraph heavily injected with top-tier semantic keywords (3-5% density), a bulleted list (<ul>/<li>) of specs/IDs, and a clean minor footer detailing shipping/returns.

Response Schema:
{
  "title_character_count": "Integer representing the exact length of the optimized title (must be <= 80)",
  "optimized_title": "Fully optimized title matching all Cassini SEO rules and containing protected elements at the end",
  "item_specifics": {
    "Brand": "Extracted brand",
    "MPN": "Extracted or Protected MPN/Part Number",
    "[Other pertinent keys]": "Extracted values"
  },
  "optimized_description": "Clean, responsive, inline-styled HTML description following the structured layout and injected with high-value semantic keywords"
}`,
        },
      ],
    });

    // Check if the response contains text block
    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock) {
      throw new Error("Anthropic API returned an empty or invalid response type.");
    }
    
    // Parse response text to JSON
    const parsedData = JSON.parse(textBlock.text.trim());
    
    return {
      optimized_title: parsedData.optimized_title || title,
      optimized_description: parsedData.optimized_description || description,
      item_specifics: parsedData.item_specifics || {},
      title_character_count: parsedData.title_character_count || undefined,
    };
  } catch (err: unknown) {
    console.error("Error communicating with Anthropic API:", err);
    throw err;
  }
}
