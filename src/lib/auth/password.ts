import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/**
 * Password hashing με το built-in scrypt του Node — καμία εξωτερική
 * εξάρτηση (π.χ. bcrypt χρειάζεται native build, next-auth είχε ήδη
 * προβλήματα με εκδόσεις — βλ. STATUS.md ιστορικό). Format αποθήκευσης:
 * "salt:hash" (και τα δύο hex).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hashHex, "hex");
  if (derived.length !== hashBuf.length) return false;
  return timingSafeEqual(derived, hashBuf);
}
