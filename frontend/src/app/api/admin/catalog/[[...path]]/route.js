import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { resolveApiBase } from "@/lib/api/api-base.mjs";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const id = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const imageId = (value) => typeof value === "string" && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;
const imageKey = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/.test(value);

function targetFor(method, parts, search) {
  const [kind, filmId, third, fourth] = parts;
  if (kind === "films" || kind === "genres") {
    if (parts.length === 1 && method === "GET") return `/admin/${kind}${search}`;
    if (parts.length === 1 && method === "POST") return `/${kind}`;
    if (parts.length === 2 && id(filmId)) {
      if (method === "GET") return `/admin/${kind}/${filmId}`;
      if (method === "PATCH" || method === "DELETE") return `/${kind}/${filmId}`;
    }
  }
  if (kind !== "films" || !id(filmId)) return null;
  if (third === "genres") {
    if (parts.length === 3 && method === "GET") return `/admin/films/${filmId}/genres${search}`;
    if (parts.length === 3 && method === "POST") return `/films/${filmId}/genres`;
    if (parts.length === 4 && method === "DELETE" && id(fourth)) return `/films/${filmId}/genres/${fourth}`;
  }
  if (third === "images") {
    if (parts.length === 3 && method === "GET") return `/admin/films/${filmId}/images${search}`;
    if (parts.length === 3 && method === "POST") return `/admin/films/${filmId}/images`;
    if (parts.length === 4 && imageId(fourth) && (method === "PATCH" || method === "DELETE")) return `/admin/films/${filmId}/images/${fourth}`;
  }
  return null;
}

async function uploadImage(request, token) {
  const size = Number(request.headers.get("content-length"));
  if (size > 6_000_000) return json({ message: "A imagem deve ter até 5 MB." }, 413);
  let form;
  try { form = await request.formData(); }
  catch { throw new AuthError(400, 'Não foi possível ler a imagem enviada. Selecione o arquivo novamente.', 'INVALID_UPLOAD'); }
  const file = form.get("image");
  if ([...form.keys()].some((key) => key !== "image") || form.getAll("image").length !== 1 || !file || typeof file.arrayBuffer !== "function" || file.size > 5_242_880 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return json({ message: "Selecione uma imagem JPG, PNG ou WebP de até 5 MB." }, 422);
  }
  const body = new FormData();
  body.set("image", file, file.name);
  const base = resolveApiBase(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL);
  let response;
  try {
    response = await fetch(`${base}/admin/uploads/images`, { method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body });
  } catch (error) { return json(authErrorPayload(new AuthError(503, 'Não foi possível enviar a imagem.', error?.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR')), 503); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true || !imageKey(payload.data?.key)) {
    const status = response.ok ? 503 : response.status;
    return json(authErrorPayload(new AuthError(status, 'Não foi possível enviar a imagem.', response.ok ? 'INVALID_RESPONSE' : payload?.code, { ...payload, requestId: payload?.requestId ?? response.headers.get('X-Request-Id'), retryAfter: response.headers.get('Retry-After') })), status);
  }
  return json(payload.data, 201);
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar o catálogo." }, 401);
  try {
    const user = await currentUser();
    if (user?.role !== "ADMIN") return json({ message: "Acesso restrito à administração." }, 403);
    const parts = (await params).path ?? [];
    if (parts[0] === "uploads" && parts.length === 1 && method === "POST") return await uploadImage(request, token);
    if (parts[0] === "uploads" && parts.length === 2 && imageKey(parts[1]) && method === "DELETE") {
      await backendAuth(`/admin/uploads/images/${parts[1]}`, { token, method });
      return new NextResponse(null, { status: 204 });
    }
    const target = targetFor(method, parts, new URL(request.url).search);
    if (!target) return json({ message: "Operação de catálogo inválida." }, 422);
    let body;
    if (method === "POST" || method === "PATCH") {
      const raw = await request.text();
      if (raw.length > 25000) return json({ message: "Dados muito longos." }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: "Dados inválidos." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Dados inválidos." }, 400);
    }
    const data = await backendAuth(target, { token, method, body });
    return method === "DELETE" ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Sua conta não pode alterar o catálogo.", 404: "Registro não encontrado.", 409: "Há um conflito com os dados ou o estado atual do registro. Atualize a lista e confira as informações.", 422: "Confira os dados informados e tente novamente." };
    return json(authErrorPayload(error, { message: messages[status] ?? "Não foi possível acessar o catálogo." }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
