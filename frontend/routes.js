import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { ok: false, error: "E-mail inválido." },
      { status: 400 }
    );
  }

  // TODO: salvar o e-mail no seu banco (Prisma, Supabase, etc.).
  // Por enquanto a rota só valida e confirma o cadastro.

  return NextResponse.json({ ok: true });
}