import LogsAdmin from '@/components/admin/reports/logs-admin';

export const metadata = { title: 'Logs HTTP | Administração CineAstra' };
export default function HttpPage() { return <LogsAdmin kind="http" />; }
