import { NextResponse } from 'next/server';

export async function GET(_request, { params }) {
  const { cep } = await params;
  if (!/^\d{8}$/.test(cep || '')) return NextResponse.json({ message: 'Informe um CEP com 8 dígitos.' }, { status: 422 });
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000), cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Consulta indisponível');
    const data = await response.json();
    if (data.erro === true) return NextResponse.json({ message: 'CEP não encontrado.' }, { status: 404 });
    return NextResponse.json({ street: data.logradouro || '', district: data.bairro || '', city: data.localidade || '', state: data.uf || '' }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ message: 'Não foi possível consultar o CEP. Preencha o endereço manualmente.' }, { status: 503 });
  }
}
