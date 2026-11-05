import UnitSessions from '@/components/unit/unit-sessions';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Sessões | Minha unidade' };
export default async function Page() { const user = await requireUnitViewer(); return <UnitSessions canManage={user.role === 'SUPERVISOR'} />; }
