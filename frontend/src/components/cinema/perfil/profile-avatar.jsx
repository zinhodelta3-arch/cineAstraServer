import { Film, Star, Ticket } from "lucide-react";

export default function ProfileAvatar({ avatar, name, small = false }) {
  const icons = { film: Film, star: Star, ticket: Ticket };
  const Icon = icons[avatar];
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CA";
  return Icon ? <Icon className={small ? "size-4" : "size-9"} /> : <span className={small ? "text-xs font-bold" : "ca-display text-4xl font-black"}>{initials}</span>;
}
