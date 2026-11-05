import UnitFilms from '@/components/unit/unit-films';
import { requireUnitViewer } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Filmes | Minha unidade' };
export default async function Page() { const user = await requireUnitViewer(); return <UnitFilms canManage={user.role === 'SUPERVISOR'} />; }
