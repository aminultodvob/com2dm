import crypto from "crypto";

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function signPayload(payload: Record<string, string>, secret: string) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `${base64UrlEncode(body)}.${signature}`;
}

export function verifySignedPayload(token: string, secret: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const body = base64UrlDecode(encoded);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(body) as Record<string, string>;
  } catch {
    return null;
  }
}
