import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

const PACKAGE_PRICES: Record<string, { usd: number; pkr: number }> = {
  starter: { usd: 39, pkr: 10950 },
  growth: { usd: 65, pkr: 18250 },
  power: { usd: 79, pkr: 22200 },
  agency: { usd: 149, pkr: 41800 },
  enterprise: { usd: 399, pkr: 112000 },
};

export async function POST(req: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { image, packageId } = (await req.json()) as { image: string; packageId: string };

    if (!image || !packageId) {
      return NextResponse.json({ error: "Missing image receipt or package selection." }, { status: 400 });
    }

    const targetPackage = PACKAGE_PRICES[packageId];
    if (!targetPackage) {
      return NextResponse.json({ error: "Invalid package selected." }, { status: 400 });
    }

    // Parse base64 image data
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format. Please upload a PNG or JPEG screenshot." }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "placeholder-anthropic-key") {
      return NextResponse.json({ error: "Claude AI verification is temporarily unavailable. Please send screenshot to WhatsApp/Email." }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    console.log(`Sending receipt screenshot to Claude for package: ${packageId}...`);

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: "You are an automated payment verification agent. Your job is to extract transaction details from payment receipt screenshots (bank transfers, Easypaisa, JazzCash, etc.) and check if they match the user's selected package price. You must output ONLY a valid, parseable JSON object matching the requested schema. Do NOT wrap JSON in code blocks. Do NOT include conversational filler.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Verify this payment screenshot. The user claims they paid for the "${packageId}" package.
              Expected Prices:
              - USD: $${targetPackage.usd}
              - PKR: Rs. ${targetPackage.pkr} (allow +/- 5% range for exchange rates or transfer fees)

              Analyze the receipt and output a JSON response matching the following schema.
              
              Schema:
              {
                "is_valid_receipt": boolean (true if it represents a successful transfer receipt, false if it is just a pending/failed transaction or an unrelated image),
                "transaction_id": "string representing the unique Reference Number, Transaction ID, or ID from the transfer screenshot. MUST be unique and not empty.",
                "amount": number (the exact transfer amount detected, e.g. 10950 or 39),
                "currency": "string (either 'PKR' or 'USD')",
                "sender_name": "string (the name of the sender if detected, otherwise null)",
                "matches_package": boolean (true if the detected amount matches the expected USD or PKR price of the "${packageId}" package within +/- 5% tolerance),
                "confidence_score": number (between 0.0 and 1.0)
              }`
            }
          ],
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock) {
      throw new Error("Failed to receive structured text from Claude Vision API.");
    }

    let result;
    try {
      result = JSON.parse(textBlock.text.trim());
    } catch {
      console.error("Failed to parse Claude output:", textBlock.text);
      return NextResponse.json({ error: "Failed to parse receipt details. Please ensure the screenshot is clear and try again." }, { status: 422 });
    }

    console.log("Claude AI verification result:", result);

    if (!result.is_valid_receipt) {
      return NextResponse.json({ error: "Invalid payment screenshot. Please ensure you uploaded a completed transfer receipt showing a successful status." }, { status: 400 });
    }

    if (!result.matches_package) {
      return NextResponse.json({ 
        error: `Amount mismatch! Expected around Rs. ${targetPackage.pkr} or $${targetPackage.usd} for the ${packageId} plan, but detected ${result.currency} ${result.amount}.` 
      }, { status: 400 });
    }

    const transactionId = result.transaction_id ? String(result.transaction_id).trim() : "";
    if (!transactionId || transactionId === "null") {
      return NextResponse.json({ error: "Could not extract a valid Transaction ID/Reference Number from the screenshot. Please upload a full, clear receipt." }, { status: 400 });
    }

    // 2. Validate transaction uniqueness using Supabase Admin client
    const supabaseAdmin = createAdminClient();

    // Check if this transaction has already been claimed
    const { data: existingReceipt } = await supabaseAdmin
      .from("payment_receipts")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (existingReceipt) {
      return NextResponse.json({ error: "This transaction ID has already been claimed by another user." }, { status: 400 });
    }

    // 3. Generate a secure unique promo code
    const uniqueCode = "SYNC-REDEEM-" + 
      Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + 
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Insert promo code
    const { error: promoInsertErr } = await supabaseAdmin
      .from("promo_codes")
      .insert({
        code: uniqueCode,
        plan_type: packageId,
        duration_months: 1,
        is_used: false,
      });

    if (promoInsertErr) {
      throw new Error(`Failed to generate activation key: ${promoInsertErr.message}`);
    }

    // Insert payment receipt record to lock the Transaction ID
    const { error: receiptInsertErr } = await supabaseAdmin
      .from("payment_receipts")
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        amount: String(result.amount),
        package_id: packageId,
        raw_analysis: result,
      });

    if (receiptInsertErr) {
      // Rollback promo code if receipt insertion fails to prevent duplicates
      await supabaseAdmin.from("promo_codes").delete().eq("code", uniqueCode);
      throw new Error(`Failed to record transaction log: ${receiptInsertErr.message}`);
    }

    // Log success in system logs
    await supabaseAdmin.from('system_logs').insert({
      user_id: user.id,
      message: `AI Payment sync successful for ${packageId} package (Trx: ${transactionId})`,
      level: 'success'
    });

    return NextResponse.json({
      success: true,
      code: uniqueCode,
      transactionId: transactionId,
      amount: result.amount,
      currency: result.currency
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal receipt verification error";
    console.error("Receipt upload error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
