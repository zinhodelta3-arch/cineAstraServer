import UnitRequestDetails from '@/components/unit/unit-request-details';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';
import { validSupportId } from '@/lib/api/support-request.mjs';

export default async function Page({searchParams}) {
  const [, {solicitacao}]=await Promise.all([requireUnitViewer(),searchParams]);
  return <UnitRequestDetails key={String(solicitacao)} id={validSupportId(solicitacao)?solicitacao:null} />;
}
