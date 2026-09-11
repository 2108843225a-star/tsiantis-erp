import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "./session";

export const SESSION_COOKIE = "session";

/** Server Components / Server Actions only — διαβάζει το signed cookie. */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
