import LogsAdmin from '@/components/admin/reports/logs-admin';

export const metadata = { title: 'Auditoria | Administração CineAstra' };
export default function AuditPage() { return <LogsAdmin kind="audit" />; }
