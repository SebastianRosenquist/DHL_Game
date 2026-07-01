import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin";
export const UID_COOKIE = "uid";

function secret(): string {
  return process.env.SESSION_SECRET ?? "insecure-dev-secret";
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** The opaque token stored in the admin cookie: an HMAC over a fixed message. */
export function adminToken(): string {
  return createHmac("sha256", secret()).update("admin-session-v1").digest("hex");
}

/** Constant-time check of a typed passcode against ADMIN_PASSCODE. */
export function verifyPasscode(input: string): boolean {
  const expected = process.env.ADMIN_PASSCODE ?? "";
  if (!expected) return false;
  return safeEqual(input, expected);
}

/** True when the current request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!token && safeEqual(token, adminToken());
}

/** The user id from the (unsigned, trust-based) identity cookie, if any. */
export async function currentUserId(): Promise<string | null> {
  return (await cookies()).get(UID_COOKIE)?.value ?? null;
}
