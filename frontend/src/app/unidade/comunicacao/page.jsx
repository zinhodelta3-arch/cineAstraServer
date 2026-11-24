import UnitCommunication from '@/components/unit/unit-communication';
import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';

export default async function Page() {
  await requireUnitSupervisor();
  return <UnitCommunication />;
}
