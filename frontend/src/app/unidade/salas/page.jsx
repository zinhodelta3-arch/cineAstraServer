import UnitRooms from '@/components/unit/unit-rooms';
import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Salas | Minha unidade' };
export default async function Page() { await requireUnitSupervisor(); return <UnitRooms />; }
