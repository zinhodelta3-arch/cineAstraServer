import UnitSnack from '@/components/unit/unit-snack';
import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'AstraSnack | Minha unidade' };
export default async function Page() { await requireUnitSupervisor(); return <UnitSnack />; }
