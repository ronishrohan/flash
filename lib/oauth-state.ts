import { createHmac, randomBytes } from "crypto";

const secret = process.env.NEXTAUTH_SECRET!;

type StatePayload = {
  userId: string;
  nonce: string;
  createdAt: number;
};

export function createOAuthState(userId: string) {
  const payload: StatePayload = {
    userId,
    nonce: randomBytes(16).toString("hex"),
    createdAt: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyOAuthState(state: string) {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  if (expected !== signature) return null;

  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf-8")
  ) as StatePayload;

  if (Date.now() - payload.createdAt > 10 * 60 * 1000) {
    return null;
  }

  return payload;
}
