import { AVATARS } from "./data";

export default function Avatar({ avatar, name, className = "size-28" }) {
  if (avatar?.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar.src} alt={`Foto de ${name}`} className={`${className} rounded-full object-cover border-2 border-primary`} />;
  }
  const preset = AVATARS.find((a) => a.id === avatar?.id) ?? AVATARS[0];
  const Icon = preset.icon;
  return (
    <div className={`${className} rounded-full border-2 border-primary flex items-center justify-center text-white shrink-0`} style={{ background: `linear-gradient(145deg, ${preset.from}, ${preset.to})` }} role="img" aria-label={`Avatar de ${name}`}>
      <Icon className="size-1/2" aria-hidden="true" />
    </div>
  );
}
