'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { newsletterAction, newsletterOptions, newsletterPath } from '@/lib/api/newsletter.mjs';

const subscribe = notify => {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
};
const initialToken = () => '';
function readToken() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  return token && /^[a-f0-9]{64}$/.test(token) ? token : '';
}

export default function NewsletterPreferences({ action }) {
  const token = useSyncExternalStore(subscribe, readToken, initialToken);
  return <NewsletterAction key={token} action={action} token={token} />;
}

function NewsletterAction({ action, token }) {
  const managing = action === 'gerenciar';
  const [preferences, setPreferences] = useState(null);
  const [terms, setTerms] = useState(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (!token || !managing) return;
    let active = true;
    newsletterAction('preferences/view', { token })
      .then(async data => {
        const options = data.status === 'DESCADASTRADO' ? await newsletterOptions() : null;
        if (active) {
          setPreferences(data);
          setTerms(options?.terms ?? null);
        }
      })
      .catch(cause => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [managing, token]);

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    const form = new FormData(event.currentTarget);
    busy.current = true;
    setPending(true);
    setError('');
    try {
      if (!token) {
        const data = await newsletterAction('authorization', {
          email: String(form.get('email')).trim(), purpose: managing ? 'GESTAO' : 'DESCADASTRO',
        });
        setMessage(data.message);
      } else if (managing) {
        const categories = form.getAll('category');
        if (categories.length > 20 || (terms && !categories.length)) {
          setError(terms ? 'Selecione de 1 a 20 categorias.' : 'Selecione até 20 categorias.');
          return;
        }
        if (terms) {
          await newsletterAction('resubscribe', { token, categories, accepted: form.has('consent'), termsVersion: terms.version });
          setMessage('Abra o link enviado ao seu e-mail para confirmar a nova inscrição.');
        } else {
          await newsletterAction('preferences', { token, categories }, 'PATCH');
          setMessage('Preferências atualizadas.');
        }
      } else {
        if (action === 'confirmar') {
          await newsletterAction('confirm', { token });
          setMessage('Inscrição confirmada.');
        } else {
          await newsletterAction('unsubscribe', { token });
          setMessage('Inscrição cancelada.');
        }
      }
    } catch (cause) {
      setError(cause.message);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (message) return <p role="status" className="text-sm font-semibold text-primary">{message}</p>;
  if (!token && action === 'confirmar') {
    return <p className="text-sm">Abra o link de confirmação enviado para o seu e-mail.</p>;
  }
  if (token && managing && !preferences) {
    return error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <p role="status" className="text-sm">Consultando inscrição…</p>;
  }

  return <form onSubmit={submit} className="space-y-4">
    {!token ? <label className="grid gap-2 text-sm font-semibold">E-mail da inscrição
      <input name="email" type="email" autoComplete="email" maxLength={254} required disabled={pending}
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-ring" />
    </label> : preferences ? <fieldset disabled={pending} className="space-y-1">
      <legend className="mb-2 text-sm font-semibold">Categorias que você quer receber</legend>
      {preferences.categories.map(category => <label key={category.code} className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="category" value={category.code} defaultChecked={category.accepted} className="size-4 shrink-0 accent-primary" />{category.name}
      </label>)}
      {terms && <label className="flex items-start gap-2 pt-3 text-sm leading-relaxed">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-primary" />{terms.text}
      </label>}
    </fieldset> : <p className="text-sm">{action === 'confirmar' ? 'Confirme o recebimento das categorias escolhidas.' : 'Confirme para deixar de receber a newsletter.'}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap items-center gap-4">
      <Button type="submit" className="min-h-11 px-4" disabled={pending}>
        {pending ? 'Enviando…' : !token ? 'Enviar link por e-mail' : terms ? 'Solicitar reinscrição' : managing ? 'Salvar preferências' : action === 'confirmar' ? 'Confirmar inscrição' : 'Cancelar inscrição'}
      </Button>
      {managing && !terms && <Link href={`${newsletterPath}?acao=cancelar`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Cancelar inscrição</Link>}
    </div>
  </form>;
}
