import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import { runRetention } from "@/server/services/retention";

function authorized(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(given);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Called daily by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runRetention());
}
