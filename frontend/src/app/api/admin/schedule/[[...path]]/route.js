import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const id = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function targetFor(method, parts, search) {
  if (parts[0] === "sessions") {
    if (parts.length === 1 && ["GET", "POST"].includes(method)) return `/admin/sessions${method === "GET" ? search : ""}`;
    if (!id(parts[1])) return null;
    if (parts.length === 2 && ["GET", "PATCH", "DELETE"].includes(method)) return `/admin/sessions/${parts[1]}`;
    if (parts.length === 3 && method === "GET" && ["tickets", "attendance"].includes(parts[2])) return `/sessions/${parts[1]}/${parts[2]}${search}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar as sessões." }, 401);
  try {
    const user = await currentUser();
    if (user?.role !== "ADMIN") return json({ message: "Acesso restrito à administração." }, 403);
    const target = targetFor(method, (await params).path ?? [], new URL(request.url).search);
    if (!target) return json({ message: "Operação de sessões inválida." }, 422);
    let body;
    if (method === "POST" || method === "PATCH") {
      const raw = await request.text();
      if (raw.length > 10000) return json({ message: "Dados muito longos." }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: "Dados inválidos." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Dados inválidos." }, 400);
    }
    const data = await backendAuth(target, { token, method, body });
    return method === "DELETE" ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Sua conta não pode administrar sessões ou ingressos.", 404: "Registro não encontrado.", 409: "A operação conflita com o estado atual, uma venda ou o horário de outra sessão.", 422: "Confira os dados informados e tente novamente." };
    return json(authErrorPayload(error, { message: messages[status] ?? "Não foi possível acessar as sessões." }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
