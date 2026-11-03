import { User360Skeleton } from '@/components/app/user-360/User360Shell';
import { DashboardContent } from '@/components/layout/DashboardContent';

export default function AdminUser360Loading() {
  return (
    <DashboardContent>
      <User360Skeleton />
    </DashboardContent>
  );
}
