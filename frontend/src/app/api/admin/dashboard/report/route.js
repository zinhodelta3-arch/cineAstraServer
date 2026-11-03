import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthError, backendAuth, SESSION_COOKIE } from "@/lib/auth/server";

const json = (body, status = 200) => NextResponse.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
});

export async function GET(request) {
  const period = new URL(request.url).searchParams.get("period");
  if (period !== "week" && period !== "month") {
    return json({ message: "Período inválido." }, 422);
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar o painel." }, 401);

  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today.getTime() - (period === "week" ? 6 : 29) * 86400000)
    .toISOString().slice(0, 10);

  try {
    const report = await backendAuth(`/admin/reports/dashboard?from=${from}&to=${to}`, { token });
    if (!report?.sales || !report?.occupancy || !Array.isArray(report.daily) ||
      !Array.isArray(report.ticketTypes) || !Array.isArray(report.rooms) ||
      !Array.isArray(report.topMovies) || !Array.isArray(report.upcomingSessions)) {
      throw new AuthError(503, "Relatório indisponível.");
    }
    return json(report);
  } catch (error) {
    return json({ message: error instanceof AuthError ? error.message : "Não foi possível consultar o relatório." },
      error instanceof AuthError ? error.status : 503);
  }
}
