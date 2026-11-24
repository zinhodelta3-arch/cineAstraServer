import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, resolveServerApiBase, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const validId = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function targetFor(method, parts, search) {
  if (parts.length === 0 && ["GET", "POST"].includes(method)) return "/streaming/profiles";
  if (!validId(parts[0])) return null;
  if (parts.length === 1 && ["GET", "PATCH", "DELETE"].includes(method)) return `/streaming/profiles/${parts[0]}`;
  if (parts.length === 2 && parts[1] === "select" && method === "POST") return `/streaming/profiles/${parts[0]}/select`;
  if (parts.length === 2 && parts[1] === "photo" && ["GET", "DELETE"].includes(method)) return `/streaming/profiles/${parts[0]}/photo`;
  if (parts.length === 2 && ["favorites", "history", "continue-watching"].includes(parts[1]) && method === "GET") return `/streaming/profiles/${parts[0]}/${parts[1]}${search}`;
  if (parts.length === 3 && validId(parts[2]) && parts[1] === "favorites" && ["PUT", "DELETE"].includes(method)) return `/streaming/profiles/${parts[0]}/favorites/${parts[2]}`;
  if (parts.length === 3 && validId(parts[2]) && parts[1] === "progress" && ["GET", "PUT", "DELETE"].includes(method)) return `/streaming/profiles/${parts[0]}/progress/${parts[2]}`;
  return null;
}

async function photoRequest(request, target, token) {
  const base = resolveServerApiBase();
  let response;
  try {
    response = await fetch(`${base}${target}`, { method: request.method, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: request.method === "GET" ? "image/webp" : "application/json" } });
  } catch (error) { return json(authErrorPayload(new AuthError(503, 'Não foi possível acessar a foto do perfil.', error?.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR')), 503); }
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return json(authErrorPayload(new AuthError(response.status, response.status === 404 ? 'Foto não encontrada.' : 'Não foi possível acessar a foto do perfil.', payload?.code, { ...payload, requestId: payload?.requestId ?? response.headers.get('X-Request-Id'), retryAfter: response.headers.get('Retry-After') })), response.status);
  }
  return new NextResponse(response.body, { status: 200, headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const parts = (await params).path ?? [];
  if (method === "PUT" && parts.length === 2 && parts[1] === "photo" && validId(parts[0])) {
    return NextResponse.json({ code:"PROFILE_PHOTO_UPLOAD_DISABLED", message:"Escolha um avatar oficial do CineAstra." },
      { status:405, headers:{ Allow:"GET, DELETE", "Cache-Control":"private, no-store" } });
  }
  const target = targetFor(method, parts, new URL(request.url).search);
  if (!target) return json({ message: "Operação de perfil inválida." }, 404);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre na sua conta para acessar os perfis." }, 401);
  try {
    if (parts[1] === "photo") return await photoRequest(request, target, token);
    let body;
    if (method === "POST" || method === "PATCH" || method === "PUT" || (method === "DELETE" && parts[1] === "progress")) {
      const raw = await request.text();
      if (raw.length > 2000) return json({ message: "Dados muito longos." }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: "Dados inválidos." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Dados inválidos." }, 400);
    }
    const data = await backendAuth(target, { token, method, body });
    return method === "DELETE" || (method === "PUT" && parts[1] === "favorites") ? new NextResponse(null, { status: 204 }) : json(data, method === "POST" && parts.length === 0 ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Acesso restrito a clientes.", 404: "Perfil não encontrado.", 409: "Os perfis foram alterados. Atualize a página e tente novamente.", 422: "Confira os dados do perfil." };
    return json(authErrorPayload(error, { message: messages[status] || "Não foi possível acessar os perfis." }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
