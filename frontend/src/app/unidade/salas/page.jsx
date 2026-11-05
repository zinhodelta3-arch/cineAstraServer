import UnitRooms from '@/components/unit/unit-rooms';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Salas | Minha unidade' };
export default async function Page() { const user = await requireUnitViewer(); return <UnitRooms canManage={user.role === 'SUPERVISOR'} />; }
