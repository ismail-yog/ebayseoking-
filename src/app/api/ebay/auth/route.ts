import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  const clientId = process.env.EBAY_CLIENT_ID || "placeholder-ebay-id";
  const ruName = process.env.EBAY_RU_NAME || "placeholder-runame";
  const isProd = process.env.EBAY_ENVIRONMENT === "production";

  const authUrl = isProd
    ? "https://auth.ebay.com/oauth2/authorize"
    : "https://auth.sandbox.ebay.com/oauth2/authorize";

  // Generate a cryptographically secure random state (CSRF token)
  const state = crypto.randomBytes(16).toString("hex");

  // Define required eBay scopes (space-separated)
  const scopes = [
    "https://api.ebay.com/oauth/api_scope",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/sell.marketing",
    "https://api.ebay.com/oauth/api_scope/sell.account",
  ].join(" ");

  // Build the consent redirect URL
  const queryParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: ruName, // eBay requires the registered RuName here
    response_type: "code",
    scope: scopes,
    state: state,
  });

  const redirectUrl = `${authUrl}?${queryParams.toString()}`;

  // Store state in a secure cookie to verify in callback (valid for 10 minutes)
  const cookieStore = await cookies();
  cookieStore.set("ebay_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  console.log(`Initiating eBay Auth. Redirecting to: ${redirectUrl}`);
  return NextResponse.redirect(redirectUrl);
}
