import { describeError, logger } from "@/server/logger";
import { unsubscribe } from "@/server/services/subscription";

/**
 * RFC 8058 one-click unsubscribe target for the List-Unsubscribe-Post header. Always answers
 * 200 so it reveals nothing about which addresses are subscribed.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  try {
    await unsubscribe(token);
  } catch (error) {
    logger.error({ err: describeError(error) }, "One-click unsubscribe failed");
  }
  return new Response("You're unsubscribed.", { status: 200 });
}
