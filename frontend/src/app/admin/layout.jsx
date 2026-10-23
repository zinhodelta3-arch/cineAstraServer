import AdminShell from "./admin-shell";

export const metadata = {
  title: "Dashboard | CineAstra",
  description: "Visão geral do cinema CineAstra.",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
