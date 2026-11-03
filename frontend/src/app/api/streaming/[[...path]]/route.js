import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from "@/lib/auth/server";
import { isAllowedAuthOrigin } from "@/lib/auth/request-origin.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const id = (value) => typeof value === "string" && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function targetFor(method, parts, search) {
  if (method === "GET" && parts.length === 1 && parts[0] === "my-accesses") return `/streaming/my-accesses${search}`;
  if (method === "POST" && parts.length === 2 && id(parts[0]) && parts[1] === "play") return `/streaming/${parts[0]}/play`;
  if (method === "POST" && parts.length === 3 && parts[0] === "films" && id(parts[1]) && parts[2] === "play") return `/streaming/films/${parts[1]}/play`;
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== "GET" && !isAllowedAuthOrigin(request)) return json({ message: "Origem não permitida." }, 403);
  const target = targetFor(method, (await params).path ?? [], new URL(request.url).search);
  if (!target) return json({ message: "Operação de streaming inválida." }, 404);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "Entre na sua conta para assistir." }, 401);
  try {
    if ((await currentUser())?.role !== "CLIENTE") return json({ message: "Acesso restrito a clientes." }, 403);
    const data = await backendAuth(target, { token, method });
    return json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const reasons = { STREAMING_ACCESS_REQUIRED: "Você ainda não tem acesso a este filme.", AGE_VERIFICATION_REQUIRED: "Confira a verificação de idade da sua conta.", AGE_RESTRICTION: "Sua conta não atende à classificação etária deste filme." };
    const messages = { 401: "Sua sessão expirou. Entre novamente.", 403: "A reprodução não está permitida para esta conta.", 404: "Filme ou acesso não encontrado.", 503: "Este vídeo está indisponível no momento." };
    return json({ message: reasons[error.code] || messages[status] || "Não foi possível iniciar a reprodução.", ...(reasons[error.code] ? { code: error.code } : {}) }, status);
  }
}

export const GET = handle;
export const POST = handle;
