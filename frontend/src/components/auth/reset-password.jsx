"use client";
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { AuthCard, Field } from './auth-shell';
import { Button } from '@/components/ui/button';
import { useAuthForm } from '@/hooks/auth/use-auth-form';
export default function ResetPassword({token}) {
 const {form,update,handleSubmit,message,pending,success}=useAuthForm({resetToken:token});
 return <AuthCard eyebrow="Sua conta" title="Redefinir senha" description="Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo. Máximo de 72 bytes.">
  {!/^[a-f0-9]{64}$/.test(token)?<p role="alert">Link inválido. Solicite uma nova recuperação na tela de login.</p>:<form className="grid gap-4" onSubmit={handleSubmit}>
   <Field label="Nova senha" icon={LockKeyhole} type="password" autoComplete="new-password" value={form.password} onChange={update('password')} minLength={12} maxLength={72}/>
   <Field label="Confirmar nova senha" icon={LockKeyhole} type="password" autoComplete="new-password" value={form.confirmation} onChange={update('confirmation')} minLength={12} maxLength={72}/>
   {message&&<p role="status">{message}</p>}<Button disabled={pending||success} type="submit">{pending?'Salvando…':'Salvar nova senha'}</Button>
  </form>}
  <Link href="/auth/login" className="mt-5 inline-block text-primary underline">Voltar ao login</Link>
 </AuthCard>;
}
