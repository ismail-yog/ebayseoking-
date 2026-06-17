import crypto from "crypto";

// Retrieve encryption key and safely hash it to exactly 32 bytes to avoid length errors
const getEncryptionKey = (): Buffer => {
  const rawKey = process.env.ENCRYPTION_KEY || "syncsell-aes-256-gcm-fallback-encryption-key-for-local-dev";
  return crypto.createHash("sha256").update(rawKey).digest();
};

/**
 * Encrypts a string using AES-256-GCM.
 * Returns the encrypted text, IV, and auth tag in hex format.
 */
export function encrypt(text: string): { encryptedText: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12); // 12-byte IV is optimal for GCM
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedText: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Requires the encrypted text, IV, and auth tag in hex format.
 */
export function decrypt(encryptedText: string, ivHex: string, authTagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts both access and refresh tokens.
 * Combines IVs and auth tags with a colon separator for single-column DB storage.
 */
export function encryptCredentials(accessToken: string, refreshToken: string): {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  iv: string;
  authTag: string;
} {
  const encAccess = encrypt(accessToken);
  const encRefresh = encrypt(refreshToken);

  return {
    encryptedAccessToken: encAccess.encryptedText,
    encryptedRefreshToken: encRefresh.encryptedText,
    iv: `${encAccess.iv}:${encRefresh.iv}`,
    authTag: `${encAccess.authTag}:${encRefresh.authTag}`,
  };
}

/**
 * Decrypts both access and refresh tokens from combined IV and auth tag strings.
 */
export function decryptCredentials(
  encAccessToken: string,
  encRefreshToken: string,
  combinedIv: string,
  combinedAuthTag: string
): { accessToken: string; refreshToken: string } {
  const [accessIv, refreshIv] = combinedIv.split(":");
  const [accessTag, refreshTag] = combinedAuthTag.split(":");

  return {
    accessToken: decrypt(encAccessToken, accessIv, accessTag),
    refreshToken: decrypt(encRefreshToken, refreshIv, refreshTag),
  };
}
