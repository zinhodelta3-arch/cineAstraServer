'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { newsletterAction, newsletterOptions, newsletterPath } from '@/lib/api/newsletter.mjs';

export default function NewsletterSignup() {
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [revision, retry] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    newsletterOptions({ signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setOptions(data); })
      .catch(cause => { if (!controller.signal.aborted) setLoadError(cause.message); });
    return () => controller.abort();
  }, [revision]);

  async function subscribe(event) {
    event.preventDefault();
    if (saving.current || !options) return;
    const form = new FormData(event.currentTarget);
    const categories = form.getAll('category');
    if (categories.length < 1 || categories.length > 20) {
      setError('Selecione de 1 a 20 categorias.');
      return;
    }
    saving.current = true;
    setPending(true);
    setError('');
    try {
      const data = await newsletterAction('subscribe', {
        email: String(form.get('email')).trim(), categories,
        accepted: form.has('consent'), termsVersion: options.terms.version,
      });
      setMessage(data.message);
    } catch (cause) {
      setError(cause.status === 503 ? 'O envio de confirmação está indisponível no momento. Tente mais tarde.' : cause.message);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return <>
    {message ? <p role="status" className="text-sm font-semibold text-primary">{message}</p>
      : loadError ? <div role="alert"><p className="mb-3 text-sm text-destructive">{loadError}</p>
        <Button variant="outline" onClick={() => { setLoadError(''); retry(value => value + 1); }}>Tentar novamente</Button></div>
      : !options ? <p role="status" className="text-sm text-muted-foreground">Carregando categorias…</p>
      : !options.categories.length ? <p className="text-sm text-muted-foreground">Nenhuma categoria disponível para inscrição.</p>
      : <form onSubmit={subscribe} className="space-y-4">
        <fieldset disabled={pending} className="space-y-4">
          <label className="grid gap-2 text-sm font-semibold">Seu e-mail
            <input name="email" type="email" autoComplete="email" required maxLength={254}
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-ring" />
          </label>
          <fieldset className="grid gap-1 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">O que você quer receber?</legend>
            {options.categories.map(category => <label key={category.code} className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="category" value={category.code} className="size-4 shrink-0 accent-primary" />{category.name}
            </label>)}
          </fieldset>
          <label className="flex items-start gap-2 text-sm leading-relaxed">
            <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-primary" />{options.terms.text}
          </label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="min-h-11 px-4" disabled={pending}>{pending ? 'Enviando…' : 'Solicitar inscrição'}</Button>
      </form>}
    <Link href={newsletterPath} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">
      Gerenciar ou cancelar inscrição
    </Link>
  </>;
}
