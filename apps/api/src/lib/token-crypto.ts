import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function createPublicToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPublicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function encryptSecretToken(token: string, secret: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(
    ":",
  );
}

export function decryptSecretToken(encryptedToken: string, secret: string) {
  const [version, ivValue, authTagValue, encryptedValue] = encryptedToken.split(":");
  if (version !== "v1" || !ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Unsupported encrypted token format");
  }

  const decipher = createDecipheriv(ALGORITHM, deriveKey(secret), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
