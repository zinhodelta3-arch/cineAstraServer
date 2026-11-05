import UnitSnack from '@/components/unit/unit-snack';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'AstraSnack | Minha unidade' };
export default async function Page() { const user = await requireUnitViewer(); return <UnitSnack canManage={user.role === 'SUPERVISOR'} />; }
