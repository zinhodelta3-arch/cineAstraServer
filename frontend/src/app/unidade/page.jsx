import UnitOverview from '@/components/unit/unit-overview';
import { currentUser } from '@/lib/auth/server';

export default async function Page() { const user = await currentUser(); return <UnitOverview supervisor={user?.role === 'SUPERVISOR'} />; }
