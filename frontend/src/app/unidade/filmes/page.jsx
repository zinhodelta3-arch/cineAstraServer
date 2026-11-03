import UnitFilms from '@/components/unit/unit-films';
import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';

export const metadata = { title: 'Filmes | Minha unidade' };
export default async function Page() { await requireUnitSupervisor(); return <UnitFilms />; }
