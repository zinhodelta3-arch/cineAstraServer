import { Clapperboard, Film, Popcorn, Projector, Spotlight, Ticket } from 'lucide-react';

export const accountAvatars = {
  projecao: { name: 'Projeção', icon: Projector, color: '#66344c', ink: '#ffe0b2' },
  claquete: { name: 'Claquete', icon: Clapperboard, color: '#303951', ink: '#e8eefb' },
  ingresso: { name: 'Ingresso', icon: Ticket, color: '#7e3028', ink: '#ffe1b4' },
  holofote: { name: 'Holofote', icon: Spotlight, color: '#3d315b', ink: '#fce2ff' },
  pipoca: { name: 'Pipoca', icon: Popcorn, color: '#543614', ink: '#fff0c4' },
  rolo: { name: 'Rolo de filme', icon: Film, color: '#23443f', ink: '#e0f3d5' },
};

export default function ProfileAvatar({ avatar, name, small = false }) {
  const selected = Object.hasOwn(accountAvatars, avatar) ? accountAvatars[avatar] : null;
  const initials = (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CA';
  if (!selected) return <span className={small ? 'text-xs font-bold' : 'ca-display text-4xl font-black'}>{initials}</span>;
  const Icon = selected.icon;
  return <span aria-hidden="true" data-avatar={avatar} className="relative grid size-full place-items-center overflow-hidden rounded-full"
    style={{ backgroundColor: selected.color, color: selected.ink }}>
    <span className="absolute inset-[12%] rounded-full border border-current opacity-45" />
    <span className="absolute inset-[19%] rounded-full border border-dashed border-current opacity-20" />
    <Icon className={small ? 'relative size-[52%]' : 'relative size-[49%]'} strokeWidth={1.6} />
  </span>;
}
