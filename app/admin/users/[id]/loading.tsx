import { User360Skeleton } from '@/components/app/user-360/User360Shell';

export default function AdminUser360Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <User360Skeleton />
    </main>
  );
}
