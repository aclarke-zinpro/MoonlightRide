import { toCsv } from "@/lib/csv";
import { requireOrganizer, UnauthorizedError } from "@/server/auth/session";
import { listSubscribers } from "@/server/services/subscription";

export async function GET(): Promise<Response> {
  try {
    await requireOrganizer();
  } catch (error) {
    if (error instanceof UnauthorizedError) return new Response("Sign in required.", { status: 401 });
    throw error;
  }
  const rows = await listSubscribers();
  const csv = toCsv(
    ["Email", "Status", "Confirmed At"],
    rows.map((s) => [s.email, s.status, s.confirmedAt]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="moonlight-ride-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
