/**
 * Sends a transactional email using Resend API via lightweight fetch.
 * Falls back to database system logs if RESEND_API_KEY is not configured.
 */
export async function sendActivationEmail(
  toEmail: string,
  code: string,
  packageName: string,
  creditsCount: number
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "SyncSell <onboarding@resend.dev>";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; line-height: 1.6;">
      <h2 style="color: #4f46e5; margin-bottom: 20px; font-size: 22px;">Your SyncSell Activation Key</h2>
      <p>Hello,</p>
      <p>Thank you for your manual transfer! Your transaction receipt has been verified successfully by our AI.</p>
      <p>Here is your one-time activation key to unlock your <strong>${packageName.toUpperCase()} Pack (${creditsCount} credits)</strong>:</p>
      
      <div style="background-color: #f8fafc; border: 2px dashed #4f46e5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <span style="font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #0f172a;">${code}</span>
      </div>
      
      <p><strong>To activate your credits:</strong></p>
      <ol style="margin-left: 20px; padding-left: 0;">
        <li>Go to your SyncSell Dashboard.</li>
        <li>Open the <strong>Billing</strong> tab.</li>
        <li>Paste the key into the <strong>Redeem Promo Code</strong> section and click <strong>Apply</strong>.</li>
      </ol>
      
      <p style="margin-top: 30px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        If you did not request this code, please ignore this email. SyncSell billing team.
      </p>
    </div>
  `;

  if (!apiKey || apiKey === "placeholder-resend-key") {
    console.warn("RESEND_API_KEY is not configured. Falling back to log print.");
    return { success: false, error: "Resend API Key is missing. Falling back to log." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: "Your SyncSell Activation Key",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Resend API returned status ${response.status}: ${errText}` };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to send email via Resend:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
