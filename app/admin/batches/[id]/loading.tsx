import { BatchDashboardSkeleton } from '@/components/app/batches/BatchDashboardView';
import { DashboardContent } from '@/components/layout/DashboardContent';

export default function AdminBatchDetailLoading() {
  return (
    <DashboardContent>
      <BatchDashboardSkeleton />
    </DashboardContent>
  );
}
