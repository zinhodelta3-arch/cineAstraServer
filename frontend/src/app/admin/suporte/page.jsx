import { validSupportId } from '@/lib/api/support-request.mjs';
import AdminSupport from "@/components/admin/support/admin-support";

export const metadata = {
  title: "Suporte | Administração CineAstra",
  description: "Fila de chamados e atendimento aos clientes CineAstra.",
};

export default async function Page({ searchParams }) {
  const {chamado} = await searchParams;
  const initialId=validSupportId(chamado)?chamado:null;
  return <AdminSupport key={initialId ?? ''} initialId={initialId} />;
}
