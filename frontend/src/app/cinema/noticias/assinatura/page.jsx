import Link from 'next/link';
import NewsletterPreferences from '@/components/cinema/noticias/newsletter-preferences';
import styles from '@/components/cinema/ticket.module.css';

export const metadata = { title: 'Inscrição CineAstraNews | CineAstra', referrer: 'no-referrer' };

export default async function Page({ searchParams }) {
  const { acao } = await searchParams;
  const action = acao === 'confirmar' || acao === 'cancelar' ? acao : 'gerenciar';
  return <main className="mx-auto w-full max-w-2xl px-5 py-10 md:px-8">
    <Link href="/cinema/noticias#contato" className="mb-4 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Voltar ao CineAstraNews</Link>
    <section className={`${styles.ticket} overflow-hidden`} aria-labelledby="newsletter-title">
      <header className="px-5 py-5 sm:px-8">
        <h1 id="newsletter-title" className={`${styles.title} text-4xl font-bold`}>
          {action === 'confirmar' ? 'Confirmar inscrição' : action === 'cancelar' ? 'Cancelar inscrição' : 'Gerenciar inscrição'}
        </h1>
      </header>
      <div className={styles.tear} aria-hidden="true" />
      <div className={`${styles.stub} px-5 py-6 sm:px-8`}><NewsletterPreferences key={action} action={action} /></div>
    </section>
  </main>;
}
