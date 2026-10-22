import { vi } from "vitest";

/** In-memory stand-ins for Next.js request APIs, for use with vi.mock in integration tests. */
export const cookieJar = new Map<string, string>();

export function resetCookies() {
  cookieJar.clear();
}

export const nextHeadersMock = {
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) as string } : undefined,
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
};

export const revalidatePath = vi.fn();
export const nextCacheMock = { revalidatePath };

export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

export const nextNavigationMock = {
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
};
