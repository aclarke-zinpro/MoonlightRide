import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Organizer } from "@/server/db/schema";
import { getOrganizerById } from "@/server/services/organizer";

export const SESSION_COOKIE = "mr_session";
const SESSION_HOURS = 8;

export class UnauthorizedError extends Error {
  constructor() {
    super("Please sign in again.");
    this.name = "UnauthorizedError";
  }
}

const key = () => new TextEncoder().encode(getEnv().AUTH_SECRET);

export async function createSessionToken(organizerId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(organizerId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key());
}

export async function readSessionToken(token: string): Promise<{ organizerId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.sub ? { organizerId: payload.sub } : null;
  } catch {
    return null;
  }
}

export async function startSession(organizerId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(organizerId), {
    httpOnly: true,
    secure: getEnv().isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ organizerId: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? readSessionToken(token) : null;
}

/** Server-side guard for every organizer page and action. */
export async function requireOrganizer(): Promise<Organizer> {
  const session = await getSession();
  const found = session ? await getOrganizerById(session.organizerId) : null;
  if (!found) throw new UnauthorizedError();
  return found;
}
