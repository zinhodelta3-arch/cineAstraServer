import { redirect } from "next/navigation";

// Mantém os links antigos funcionando após a organização do fluxo de sessão.
export default async function IngressosRedirect({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = query.toString();
  redirect(`/cinema/sessao/ingressos${suffix ? `?${suffix}` : ""}`);
}
