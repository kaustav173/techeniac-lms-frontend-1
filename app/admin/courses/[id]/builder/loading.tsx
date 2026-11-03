import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminCourseBuilderLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Top Navbar Placeholder */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:ml-20 lg:ml-72">
        {/* Top Command Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 shadow-xs">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Dual Pane */}
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-[400px] flex-col gap-3 border-r border-slate-200 bg-white p-4 lg:flex">
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="mt-2 space-y-2.5">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
