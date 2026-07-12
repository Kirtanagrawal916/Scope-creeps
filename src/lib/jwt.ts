import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_TOKEN_KEY = "scopeguard_token";

const JWT_SECRET = process.env.JWT_SECRET ?? "scopeguard-dev-secret-change-in-production";
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

export async function signToken(userId: string): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      iat: issuedAt,
      exp: issuedAt + TOKEN_EXPIRY_SECONDS,
    }),
  );
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expectedSignature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  try {
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const decoded = JSON.parse(base64UrlDecode(payload)) as {
    sub?: string;
    exp?: number;
  };

  if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { userId: decoded.sub };
}
