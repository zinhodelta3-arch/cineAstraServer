import ExperienceInquiry from '@/components/cinema/experiencias/experience-inquiry';

export const metadata = { title: 'Solicitar experiência | CineAstra' };

export default async function Page({ searchParams }) {
  const { experiencia } = await searchParams;
  const valid = typeof experiencia === 'string' &&
    (experiencia === 'personalizado' || (/^[1-9]\d{0,9}$/.test(experiencia) && Number(experiencia) <= 4294967295));
  const initialFormat = valid ? experiencia : '';
  return <ExperienceInquiry key={initialFormat} initialFormat={initialFormat} />;
}
