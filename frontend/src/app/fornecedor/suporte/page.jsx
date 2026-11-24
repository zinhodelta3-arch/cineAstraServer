import PortalSupport from '@/components/support/portal-support';
import { validSupportId } from '@/lib/api/support-request.mjs';

export default async function Page({searchParams}) {
  const {chamado}=await searchParams;
  return <PortalSupport supplier initialId={validSupportId(chamado)?chamado:null} />;
}
