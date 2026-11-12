import { redirect } from 'next/navigation';

export default function AdminAuditLogsLegacyRedirect() {
  redirect('/admin/logs');
}
