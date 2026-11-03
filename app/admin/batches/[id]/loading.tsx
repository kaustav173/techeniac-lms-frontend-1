import { BatchDashboardSkeleton } from '@/components/app/batches/BatchDashboardView';

export default function AdminBatchDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <BatchDashboardSkeleton />
    </div>
  );
}
