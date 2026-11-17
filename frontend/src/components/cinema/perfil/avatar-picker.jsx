'use client';

import { useAccountPreferences } from '@/components/providers/account-preferences-provider';
import { Button } from '@/components/ui/button';
import Modal from './modal';
import ProfileAvatar, { accountAvatars } from './profile-avatar';

export default function AvatarPicker({ name }) {
  const account = useAccountPreferences();
  if (!account) return null;
  return <Modal trigger={<Button variant="outline" size="sm">Alterar avatar</Button>} title="Seu avatar" description="Escolha uma imagem para identificar sua conta no Cinema e no Streaming.">
    {!account.data && !account.error && <p role="status">Carregando opções…</p>}
    {account.error && <div role="alert"><p>{account.error}</p><Button variant="outline" onClick={account.retry}>Tentar novamente</Button></div>}
    {account.data && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {[null, ...Object.keys(accountAvatars)].map(avatar => <button type="button" key={avatar ?? 'iniciais'}
        disabled={account.saving} aria-pressed={account.data.avatar === avatar} onClick={() => account.save({ avatar })}
        className="grid justify-items-center gap-2 rounded-lg border border-border p-3 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10">
        <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><ProfileAvatar avatar={avatar} name={name} small /></span>
        {accountAvatars[avatar]?.name ?? 'Minhas iniciais'}
      </button>)}
    </div>}
  </Modal>;
}
