import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const validId = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function targetFor(method, parts, search) {
  if (parts[0] !== "locations") return null;
  if (parts.length === 1 && ["GET", "POST"].includes(method)) return `/admin/locations${method === "GET" ? search : ""}`;
  if (!validId(parts[1])) return null;
  if (parts.length === 2 && ["GET", "PATCH", "DELETE"].includes(method)) return `/admin/locations/${parts[1]}`;
  if (parts[2] !== "rooms") return null;
  if (parts.length === 3 && ["GET", "POST"].includes(method)) return `/admin/locations/${parts[1]}/rooms${method === "GET" ? search : ""}`;
  if (!validId(parts[3])) return null;
  if (parts.length === 4 && ["GET", "PATCH", "DELETE"].includes(method)) return `/admin/locations/${parts[1]}/rooms/${parts[3]}`;
  if (parts[4] !== "seats") return null;
  if (parts.length === 5 && ["GET", "POST"].includes(method)) return `/admin/locations/${parts[1]}/rooms/${parts[3]}/seats${method === "GET" ? search : ""}`;
  if (parts.length === 6 && validId(parts[5]) && ["GET", "PATCH", "DELETE"].includes(method)) return `/admin/locations/${parts[1]}/rooms/${parts[3]}/seats/${parts[5]}`;
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar os locais." }, 401);
  try {
    const user = await currentUser();
    if (user?.role !== "ADMIN") return json({ message: "Acesso restrito à administração." }, 403);
    const target = targetFor(method, (await params).path ?? [], new URL(request.url).search);
    if (!target) return json({ message: "Operação de locais inválida." }, 422);
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
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Sua conta não pode alterar os locais.", 404: "Registro não encontrado.", 409: "A alteração conflita com a capacidade, os vínculos ou o estado do local. Confira salas, assentos e sessões.", 422: "Confira os dados informados e tente novamente." };
    return json(authErrorPayload(error, { message: messages[status] ?? "Não foi possível acessar os locais." }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
