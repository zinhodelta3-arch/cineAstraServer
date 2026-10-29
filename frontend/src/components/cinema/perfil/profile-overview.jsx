import {Film,Mail,Phone} from 'lucide-react';
import EditProfile from './edit-profile';
import ProfileAvatar from './profile-avatar';
export default function ProfileOverview({profile,saveProfile}){
 return <section className="ca-grain relative overflow-hidden rounded-2xl border border-border bg-card">
  <div className="ca-profile-cover relative h-25 overflow-hidden border-b border-border"><Film className="absolute -top-3 right-6 size-32 -rotate-12 text-primary/10" /><div className="ca-perf absolute top-4 inset-x-5 opacity-30" /></div>
  <div className="relative px-6 pb-6"><div className="-mt-10 mb-4 flex size-20 items-center justify-center rounded-full border-[5px] border-card bg-primary text-primary-foreground"><ProfileAvatar name={profile.name} /></div>
   <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Sua conta CineAstra</p>
   <h2 className="ca-display break-words text-4xl font-black uppercase">{profile.name}</h2>
   <div className="mt-5 space-y-3 text-sm text-muted-foreground"><p className="flex items-start gap-3"><Mail className="size-4 shrink-0" /><span className="break-all">{profile.email}</span></p><p className="flex items-start gap-3"><Phone className="size-4 shrink-0" />{profile.phone||'Telefone não informado'}</p></div>
   <EditProfile profile={profile} onSave={saveProfile} />
  </div>
 </section>;
}
