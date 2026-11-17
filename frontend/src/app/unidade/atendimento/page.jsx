import UnitAttendance from '@/components/unit/unit-attendance';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Atendimento | Minha unidade' };

export default async function Page() {
  const user = await requireUnitViewer();
  return <UnitAttendance supervisor={user.role === 'SUPERVISOR'} />;
}
