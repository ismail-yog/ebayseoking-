import Anthropic from "@anthropic-ai/sdk";

/**
 * Calls Anthropic API (Claude 3.5 Sonnet) to optimize an eBay product listing.
 * Front-loads keywords for search ranking and generates structured HTML description.
 */
export async function optimizeListingWithAI(title: string, description: string): Promise<{
  optimized_title: string;
  optimized_description: string;
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
- COMPLIANCE: Do not include active content, JavaScript, external stylesheets, or iframes. CRITICAL: Do NOT include ANY contact information, email addresses, phone numbers, external website links, or phrases like "Contact us", "Visit our store", or "Message us for details". eBay explicitly bans these and will block the listing.
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
    };
  } catch (err: unknown) {
    console.error("Error communicating with Anthropic API:", err);
    throw err;
  }
}
