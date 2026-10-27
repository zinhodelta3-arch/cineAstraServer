"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegisterForm } from "@/hooks/auth/use-register-form";
import { useAuthForm } from "@/hooks/auth/use-auth-form";
import SessionControls from "@/components/auth/session-controls";
import { Checkbox } from "@/components/ui/checkbox";

export function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, required = true, minLength, maxLength, max }) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="grid gap-[7px]">
      <label htmlFor={inputId} className="text-xs font-extrabold text-foreground">{label}</label>
      <span className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-3.5 z-10 size-[18px] text-muted-foreground" aria-hidden="true" />
        <Input
          id={inputId}
          className="h-12 w-full rounded-lg border-input bg-background px-[42px] text-base shadow-none placeholder:text-muted-foreground md:text-sm dark:bg-background"
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          max={max}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 size-10 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-controls={inputId}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        )}
      </span>
    </div>
  );
}

export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <main className="relative flex min-h-[calc(100svh-81px)] flex-col items-center justify-center overflow-hidden bg-background px-3.5 pt-[34px] pb-[50px] text-foreground min-[701px]:px-5 min-[701px]:pt-14 min-[701px]:pb-[72px]">
      <section className="relative grid w-full max-w-[920px] overflow-hidden rounded-2xl border border-border bg-card min-[701px]:min-h-[560px] min-[701px]:grid-cols-[minmax(0,1fr)_210px]" aria-labelledby="auth-title">
        <span className="pointer-events-none absolute top-1/2 -left-[13px] z-10 size-6 -translate-y-1/2 rounded-full border border-border bg-background [clip-path:inset(0_0_0_50%)]" aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 -right-[13px] z-10 size-6 -translate-y-1/2 rounded-full border border-border bg-background [clip-path:inset(0_50%_0_0)] min-[701px]:right-[197px]" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-6 top-1 h-px border-t border-dashed border-border opacity-75" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-6 bottom-1 h-px border-t border-dashed border-border opacity-75" aria-hidden="true" />

        <div className="relative min-w-0 px-[22px] pt-[30px] pb-[34px] min-[521px]:px-[clamp(28px,5vw,58px)] min-[521px]:pt-[38px] min-[521px]:pb-[42px]">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 rounded-sm text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a Home
          </Link>

          <div className="mb-3.5 flex h-[58px] w-[190px] max-w-full items-center [&_img]:size-full [&_img]:object-contain [&_img]:object-left">
            <img src="/CineAstra.png" alt="CineAstra" />
          </div>

          <p className="mb-1 text-[11px] font-extrabold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
          <h1 id="auth-title" className="m-0 font-sans text-[clamp(32px,4vw,46px)] leading-tight font-extrabold tracking-[-0.04em] text-foreground">{title}</h1>
          <p className="mt-[13px] mb-7 max-w-[560px] text-sm leading-relaxed text-muted-foreground">{description}</p>

          {children}
        </div>

        <aside className="relative flex min-h-[130px] items-center justify-center border-t-2 border-dashed border-border bg-secondary px-4 py-6 text-secondary-foreground min-[701px]:border-t-0 min-[701px]:border-l-2" aria-label="CineAstra">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center min-[701px]:flex-col min-[701px]:gap-[13px] [&_strong]:text-xl [&_strong]:leading-none [&_strong]:tracking-[-0.04em] min-[701px]:[&_strong]:text-[27px]">
            <span className="text-[10px] font-black tracking-[0.22em]">CINEASTRA</span>
            <strong>VIVA O<br />CINEMA.</strong>
            <span className="h-0.5 w-8 bg-accent min-[701px]:w-[58px]" />
            <div className="flex h-10 items-end gap-0.5 opacity-75 min-[701px]:h-[58px]" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <i key={index} className={`block bg-current ${index % 3 === 0 ? "w-[3px]" : "w-px"} ${["h-1/2", "h-3/4", "h-full", "h-2/3"][index % 4]}`} />
              ))}
            </div>
          </div>
        </aside>
      </section>
      {footer}
    </main>
  );
}

export function RegisterPage() {
  const { form, accepted, setAccepted, update, handleSubmit, message, pending, success, documents, documentError, retryDocuments, today } = useRegisterForm();
  const termsId = useId();

  return (
    <AuthCard
      eyebrow="Novo ingresso"
      title="Crie sua conta"
      description="Cadastre-se para comprar ingressos, acompanhar seus pedidos e aproveitar sua experiência CineAstra."
      footer={
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:font-extrabold [&_a]:text-primary [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring">
          Já possui uma conta? <Link href="/auth/login">Entrar na CineAstra</Link>
        </p>
      }
    >
      <p className="mb-5 rounded-lg border border-border bg-muted/40 p-4 text-sm">Sua idade será autodeclarada, não verificada. Recursos que exigem comprovação continuarão sujeitos à verificação.</p>
      <form className="grid gap-[17px]" onSubmit={handleSubmit}>
        <Field label="Nome completo" icon={UserRound} value={form.name} onChange={update("name")} autoComplete="name" minLength={2} maxLength={100} />
        <Field label="CPF" icon={UserRound} value={form.cpf} onChange={update("cpf")} placeholder="000.000.000-00" maxLength={14} />
        <Field label="Data de nascimento" icon={UserRound} type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} autoComplete="bday" max={today} />
        <Field label="E-mail" icon={Mail} type="email" value={form.email} onChange={update("email")} placeholder="seuemail@exemplo.com" autoComplete="email" />


        <div className="grid grid-cols-1 gap-[17px] min-[521px]:grid-cols-2 min-[521px]:gap-4">
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={update("password")} placeholder="••••••••" autoComplete="new-password" minLength={12} maxLength={72} />
          <Field label="Confirmar senha" icon={LockKeyhole} type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="••••••••" autoComplete="new-password" minLength={12} maxLength={72} />
        </div>

        <p className="text-xs text-muted-foreground">Senha com 12 caracteres ou mais, maiúscula, minúscula, número e símbolo. Máximo de 72 bytes.</p>
        {documents && <div className="space-y-3">{[documents.terms, documents.privacy].map(doc => <details key={doc.slug} className="rounded-lg border border-border p-3"><summary className="cursor-pointer font-semibold">{doc.title} — {doc.version}</summary><p className="mt-3 whitespace-pre-wrap text-sm">{doc.body.text}</p></details>)}</div>}
        {!documents && !documentError && <p role="status">Carregando termos e privacidade…</p>}
        {documentError && <div role="alert"><p>{documentError}</p><Button type="button" variant="outline" onClick={retryDocuments}>Tentar novamente</Button></div>}
        <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground [&_a]:font-bold [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline">
          <Checkbox id={termsId} className="mt-0.5 shrink-0" disabled={!documents || pending || success} checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
          <label htmlFor={termsId} className="cursor-pointer">
            Li e concordo com os Termos de Uso e a Política de Privacidade apresentados acima.
          </label>
        </div>

        {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}

        <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit" disabled={pending || success || !documents || !accepted}>
          <Check size={18} aria-hidden="true" />
          {pending ? "Criando conta…" : "Criar minha conta"}
        </Button>
        {success && <Link href="/auth/login" className="font-bold text-primary underline">Entrar com minha conta</Link>}
      </form>
    </AuthCard>
  );
}

export function LoginPage() {
  const { form, update, resetOpen, setResetOpen, message, pending, user, handleSubmit } = useAuthForm();

  return (
    <AuthCard
      eyebrow="Bem-vindo de volta"
      title="Entre na CineAstra"
      description="Acesse sua conta para continuar sua experiência de cinema."
      footer={
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:font-extrabold [&_a]:text-primary [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring">
          Ainda não possui uma conta? <Link href="/auth/cadastro">Criar conta</Link>
        </p>
      }
    >
      {user && <SessionControls />}
      {!resetOpen ? (
        <form className="grid gap-[17px]" onSubmit={handleSubmit}>
          <Field label="E-mail" type="email" icon={UserRound} value={form.login} onChange={update("login")} placeholder="seuemail@exemplo.com" autoComplete="username" />
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={update("password")} placeholder="••••••••" autoComplete="current-password" />

          <Button type="button" variant="link" className="-mt-1 h-auto justify-self-end p-0 text-xs font-bold text-primary" disabled={pending} onClick={() => setResetOpen(true)}>
            Esqueci minha senha
          </Button>

          {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}

          <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit" disabled={pending || Boolean(user)}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      ) : (
        <form className="grid gap-[17px]" onSubmit={handleSubmit}>
          <Field label="E-mail" icon={Mail} type="email" value={form.login} onChange={update("login")} placeholder="seuemail@exemplo.com" autoComplete="email" />
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha.</p>
          {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}
          <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit" disabled={pending}>{pending ? "Solicitando…" : "Redefinir senha"}</Button>
          <Button type="button" variant="link" className="-mt-1 h-auto justify-self-end p-0 text-xs font-bold text-primary" disabled={pending} onClick={() => setResetOpen(false)}>
            Voltar para o login
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
