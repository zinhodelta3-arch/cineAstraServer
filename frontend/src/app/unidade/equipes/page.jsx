import { notificationId } from '@/lib/api/notifications.mjs';
import UnitTeams from '@/components/unit/unit-teams';

export const metadata = { title: 'Equipes | Minha unidade' };
export default async function Page({searchParams}) {
  const {entrada}=await searchParams;
  return <UnitTeams entryId={notificationId(entrada)?entrada:null} />;
}
