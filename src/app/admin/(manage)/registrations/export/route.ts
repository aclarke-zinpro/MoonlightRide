import { toCsv } from "@/lib/csv";
import { requireOrganizer, UnauthorizedError } from "@/server/auth/session";
import {
  listForEdition,
  REGISTRATION_CSV_HEADERS,
  toCsvRows,
} from "@/server/services/registration";
import { requireCurrentEdition } from "@/server/services/ride";

export async function GET(): Promise<Response> {
  try {
    await requireOrganizer();
  } catch (error) {
    if (error instanceof UnauthorizedError) return new Response("Sign in required.", { status: 401 });
    throw error;
  }
  const edition = await requireCurrentEdition();
  const rows = await listForEdition(edition.id);
  return new Response(toCsv(REGISTRATION_CSV_HEADERS, toCsvRows(rows)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moonlight-ride-${edition.year}-registrations.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
