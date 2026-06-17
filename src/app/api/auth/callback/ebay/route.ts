import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientServer } from "@/lib/supabase/server";
import { encryptCredentials } from "@/lib/encryption";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Retrieve cookie state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("ebay_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    console.error("eBay OAuth validation failed. State mismatch or missing code.");
    return NextResponse.json(
      { error: "Security validation failed. Invalid state token or missing code." },
      { status: 400 }
    );
  }

  // Clear CSRF cookie
  cookieStore.delete("ebay_oauth_state");

  const clientId = process.env.EBAY_CLIENT_ID || "placeholder-ebay-id";
  const clientSecret = process.env.EBAY_CLIENT_SECRET || "placeholder-ebay-secret";
  const ruName = process.env.EBAY_RU_NAME || "placeholder-runame";
  const isProd = process.env.EBAY_ENVIRONMENT === "production";

  const tokenUrl = isProd
    ? "https://api.ebay.com/identity/v1/oauth2/token"
    : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";

  try {
    // 1. Swap auth code for access & refresh tokens
    const credentialsBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentialsBase64}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: ruName, // Must match your registered RuName exactly
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error(`eBay OAuth token exchange failed: ${errText}`);
      throw new Error(`eBay Token Exchange Error: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      expires_in,
      refresh_token,
      refresh_token_expires_in,
    } = tokenData;

    // 2. Encrypt tokens using AES-256-GCM
    const encrypted = encryptCredentials(access_token, refresh_token);

    // Calculate dates
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + refresh_token_expires_in * 1000).toISOString();

    // 3. Save / Upsert to Supabase store_credentials table
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    // Attempt to query eBay API or mock store information
    const ebayUsername = "eBay Seller Account";
    const ebayStoreName = "My SyncSell Store";

    const { error: upsertErr } = await supabase
      .from("store_credentials")
      .upsert(
        {
          user_id: user.id,
          ebay_store_name: ebayStoreName,
          ebay_username: ebayUsername,
          encrypted_access_token: encrypted.encryptedAccessToken,
          encrypted_refresh_token: encrypted.encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          refresh_token_expires_at: refreshExpiresAt,
          iv: encrypted.iv,
          auth_tag: encrypted.authTag,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) throw upsertErr;

    console.log(`Successfully connected eBay account for user ${user.id}`);
    
    // Redirect back to Dashboard
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal token exchange error";
    console.error(`eBay Callback Error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
