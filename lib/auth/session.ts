import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type Session,
} from "@/lib/auth/types";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (need 32+ characters).",
    );
  }
  return new TextEncoder().encode(value);
}

/** Sign a session into a stateless JWT — no database, the cookie is the store. */
export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const email = String(payload.email ?? "");
    return {
      login: String(payload.login ?? ""),
      name: String(payload.name ?? ""),
      email,
      image: String(payload.image ?? ""),
      // Recomputed every request — the env is the single source of truth,
      // so changing GITHUB_ADMIN_EMAIL takes effect without re-logging-in.
      isAdmin: !!email && email === process.env.GITHUB_ADMIN_EMAIL,
    };
  } catch {
    return null;
  }
}

/** Read the current session in a server component / route / server action. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Throws unless the caller is the authenticated admin. Use to guard mutations. */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized: admin access required.");
  }
  return session;
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
export type { Session };
