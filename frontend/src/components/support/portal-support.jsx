'use client';

import { useSession } from '@/hooks/auth/use-session';
import UnitLayout from '@/components/unit/unit-layout';
import SupplierLayout from '@/components/supplier/supplier-layout';
import SupportWorkspace from './support-workspace';

export default function PortalSupport({initialId, supplier=false}) {
  const { user, loading } = useSession();
  const Layout=supplier?SupplierLayout:UnitLayout;
  return <Layout title="Suporte" description="Abra chamados de atendimento e acompanhe as respostas da administração.">
    {loading ? <p role="status">Verificando sua conta…</p> : user &&
      <SupportWorkspace key={`${user.id}:${initialId ?? ''}`} staffRole={user.role} initialId={initialId} />}
  </Layout>;
}
