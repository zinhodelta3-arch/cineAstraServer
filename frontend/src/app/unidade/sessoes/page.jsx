import UnitSessions from '@/components/unit/unit-sessions';
import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Sessões | Minha unidade' };
export default async function Page() { await requireUnitSupervisor(); return <UnitSessions />; }
