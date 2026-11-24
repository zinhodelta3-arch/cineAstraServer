import { validSupportId } from '@/lib/api/support-request.mjs';
import SupportCenter from "@/components/support/support-center";

export const metadata = {
  title: "Central de Suporte | CineAstra",
  description: "Encontre respostas para as principais dúvidas sobre o CineAstra.",
};

export default async function SuportePage({ searchParams }) {
  const {chamado} = await searchParams;
  return <SupportCenter cinema initialId={validSupportId(chamado)?chamado:null} />;
}
