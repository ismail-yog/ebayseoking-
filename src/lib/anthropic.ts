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

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: `You are an expert eBay SEO copywriter specializing in eBay's Cassini search algorithm. Your goal is to analyze listing information, retain all critical seller data, and optimize the listing for maximum search visibility, click-through rates (CTR), and sales conversion organically. Accuracy and seller trust outrank creativity — never invent a fact that isn't in the source material. You must output ONLY a valid, parseable JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks. Do not include any conversational filler.`,
        messages: [
          {
            role: "user",
            content: `Optimize the following eBay listing for the Cassini search algorithm.

ORIGINAL TITLE: "${title}"
ORIGINAL DESCRIPTION: "${description}"
PROTECTED ELEMENTS (SKU/MPN/UPC/Part#, etc. — do not alter, translate, reformat, or truncate): "${protectedElements || 'None'}"

Strict SEO Optimization Guidelines:

1. PROTECTED ELEMENTS (Non-negotiable)
- Reproduce every protected ID exactly as given, character-for-character.
- Place all part numbers/IDs at the END of the title, after the primary keywords.
- Repeat them exactly in Item Specifics.

2. FACTUAL INTEGRITY (Critical for trust & fitment)
- Only use keywords, fitment claims, and specs that are stated or directly implied in the original title/description/protected elements.
- Do NOT claim "OEM," "Genuine," "Authentic," or a specific brand compatibility unless the source text supports it.
- If year/make/model/engine/trim fitment (or specific sizing) is present in the original, preserve it exactly — do not broaden or narrow it.
- If a fact is ambiguous or missing (e.g., condition, material), leave it out rather than guessing.

3. TITLE (≤80 characters)
- Front-load Brand, Part/Item Name, and key fitment terms in the first 40 characters.
- Title Case, no ALL-CAPS, no filler words ("L@@K," "WOW," "Best," etc.), no excess punctuation.
- IDs/part numbers go last.

4. ITEM SPECIFICS
- Extract only factual data points explicitly present in the source: Brand, MPN, UPC, Fitment, Material, Type, Condition, etc.
- Format as key-value pairs.
- Mark anything not stated in the original as "Not specified" rather than inferring it.

5. DESCRIPTION (HTML, eBay-policy compliant)
- No JavaScript, iframes, external stylesheets, or outbound links/contact info.
- Single responsive container div, inline CSS only.
- Structure: bold <h1> title → short features/benefits paragraph using natural, varied keyword phrasing (no keyword stuffing or artificial density targets) → <ul> of specs/IDs → brief shipping/returns footer using generic policy language only (no seller contact details).

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
      attempt++;
      const isRateLimit = err instanceof Error && (err.message.includes("429") || err.message.includes("rate limit") || err.message.includes("Too Many Requests"));
      
      if (isRateLimit && attempt < MAX_RETRIES) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Anthropic rate limit hit. Retrying in ${waitTime}ms (Attempt ${attempt} of ${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      console.error("Error communicating with Anthropic API:", err);
      throw err;
    }
  }

  throw new Error("Anthropic API failed after maximum retries.");
}
