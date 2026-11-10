import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const validId = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const validCursor = (value) => /^(0|[1-9]\d{0,19})$/.test(value) && BigInt(value) <= 18446744073709551615n;

async function handle(request, { params }) {
  if (request.method === "POST" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar o suporte." }, 401);

  try {
    const user = await currentUser();
    if (user?.role !== "ADMIN") return json({ message: "Acesso restrito à administração." }, 403);
    const parts = (await params).path ?? [];
    const cursor = new URL(request.url).searchParams.get("cursor") ?? "0";
    const statusFilter = new URL(request.url).searchParams.get('status');
    const limit = new URL(request.url).searchParams.get('limit') ?? '50';
    const q = new URL(request.url).searchParams.get('q')?.trim();
    if (!/^\d{1,3}$/.test(limit) || Number(limit) < 1 || Number(limit) > 100 || (q?.length ?? 0) > 150) return json({ message: 'Paginação ou busca inválida.' }, 422);
    if (statusFilter && !['ABERTO','EM_ATENDIMENTO','RESOLVIDO','FECHADO','ALL'].includes(statusFilter)) return json({ message: 'Status inválido.' }, 422);
    if (!validCursor(cursor) || (parts.length && !validId(parts[0]))) return json({ message: "Chamado ou página inválida." }, 422);

    let body = {};
    if (request.method === "POST") {
      const raw = await request.text();
      if (raw.length > 45000) return json({ message: "Mensagem muito longa." }, 413);
      try { body = raw ? JSON.parse(raw) : {}; } catch { return json({ message: "Dados inválidos." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Dados inválidos." }, 400);
    }

    let target;
    if (request.method === "GET") {
      if (!parts.length) target = `/admin/support?limit=${limit}&cursor=${cursor}${statusFilter ? `&status=${statusFilter}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      else if (parts.length === 1) target = `/support/${parts[0]}`;
      else if (parts.length === 2 && parts[1] === "messages") target = `/support/${parts[0]}/messages?limit=100&cursor=${cursor}`;
    } else if (parts.length === 2) {
      if (parts[1] === "assign" && !Object.keys(body).length) target = `/admin/support/${parts[0]}/assign`;
      if (parts[1] === "resolve" && !Object.keys(body).length) target = `/admin/support/${parts[0]}/resolve`;
      if (parts[1] === "messages" && Object.keys(body).length === 1 && typeof body.message === "string" && body.message.trim().length > 0 && body.message.trim().length <= 10000) target = `/support/${parts[0]}/messages`;
    }
    if (!target) return json({ message: "Operação de suporte inválida." }, 422);

    const payload = request.method === "POST"
      ? parts[1] === "assign" ? { attendantId: user.id } : parts[1] === "messages" ? { message: body.message.trim(), mode: "ASYNC" } : {}
      : undefined;
    return json(await backendAuth(target, { token, method: request.method, body: payload }));
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Você não tem acesso a este chamado.", 404: "Chamado não encontrado.", 409: "O chamado mudou de estado. Atualize a fila e tente novamente.", 422: "Confira a mensagem e tente novamente." };
    return json(authErrorPayload(error, { message: messages[status] ?? "Não foi possível acessar o suporte." }), status);
  }
}

export const GET = handle;
export const POST = handle;
