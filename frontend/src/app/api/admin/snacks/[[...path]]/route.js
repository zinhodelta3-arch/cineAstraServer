import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const id = (value) => typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const imageId = (value) => typeof value === "string" && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function targetFor(method, parts, search) {
  const [kind, second, third, fourth] = parts;
  if (kind === 'inputs' && second === 'categories' && parts.length === 2 && method === 'GET') return `/inputs/categories${search}`;
  if (["inputs", "combos"].includes(kind) && id(second) && third === "images") {
    const base = kind === "inputs" ? `/inputs/${second}/images` : `/admin/combos/${second}/images`;
    if (parts.length === 3 && ["GET", "POST"].includes(method)) return `${method === "GET" ? `/admin/${kind}/${second}/images` : base}${method === "GET" ? search : ""}`;
    if (parts.length === 4 && imageId(fourth) && ["PATCH", "DELETE"].includes(method)) return `${base}/${fourth}`;
  }
  if (kind === "inputs" && parts.length === 1 && ["GET", "POST"].includes(method)) return `/inputs${method === "GET" ? search : ""}`;
  if (kind === "inputs" && parts.length === 2 && id(second) && ["GET", "PATCH", "DELETE"].includes(method)) return `/inputs/${second}`;
  if (kind === "combos") {
    if (parts.length === 1 && ["GET", "POST"].includes(method)) return `/admin/combos${method === "GET" ? search : ""}`;
    if (id(second) && parts.length === 2 && ["GET", "PATCH", "DELETE"].includes(method)) return `/admin/combos/${second}`;
    if (id(second) && third === "items" && parts.length === 3 && method === "PUT") return `/admin/combos/${second}/items`;
  }
  if (kind === "inventory") {
    if (second === "movements" && parts.length === 2 && ["GET", "POST"].includes(method)) return `/inventory/movements${method === "GET" ? search : ""}`;
    if (second === "alerts" && parts.length === 2 && method === "GET") return `/inventory/alerts${search}`;
    if (second === "inputs" && id(third) && parts.length === 3 && method === "GET") return `/inventory/inputs/${third}`;
  }
  if (kind === "suppliers") {
    if (parts.length === 1 && method === "GET") return `/admin/suppliers${search}`;
    if (id(second) && third === "locations" && parts.length === 3 && ["GET", "POST"].includes(method)) return `/admin/suppliers/${second}/locations${method === "GET" ? search : ""}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre para acessar o AstraSnack." }, 401);
  try {
    const user = await currentUser();
    if (user?.role !== "ADMIN") return json({ message: "Acesso restrito à administração." }, 403);
    const target = targetFor(method, (await params).path ?? [], new URL(request.url).search);
    if (!target) return json({ message: "Operação do AstraSnack inválida." }, 422);
    let body;
    if (["POST", "PATCH", "PUT"].includes(method)) {
      const raw = await request.text();
      if (raw.length > 25000) return json({ message: "Dados muito longos." }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: "Dados inválidos." }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Dados inválidos." }, 400);
    }
    const data = await backendAuth(target, { token, method, body });
    return method === "DELETE" ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "Sua conta não pode administrar o AstraSnack.", 404: "Registro não encontrado.", 409: "A operação conflita com o estado atual do item, o estoque ou um vínculo existente.", 422: "Confira os dados informados e tente novamente." };
    const message = error instanceof AuthError && error.code === "PRODUCT_RETAIL_CONFLICT" ? error.message : messages[status];
    return json(authErrorPayload(error, { message: message ?? "Não foi possível acessar o AstraSnack." }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
