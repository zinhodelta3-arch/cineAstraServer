import { notFound } from 'next/navigation';
import ExperienceDetails from '@/components/cinema/experiencias/experience-details';

export default async function Page({ params }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 4294967295) notFound();
  return <ExperienceDetails id={id} />;
}
