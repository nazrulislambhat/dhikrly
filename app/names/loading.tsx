import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function NamesLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Progress & Memorization Stats Skeleton */}
      <div className="mb-6 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-sm" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      {/* Search & Category Pills Skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-44 rounded-2xl shrink-0" />
      </div>

      {/* Grid of 99 Names Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <div className="my-4 text-center space-y-2">
              <Skeleton className="mx-auto h-12 w-32 rounded-xl" />
              <Skeleton className="mx-auto h-5 w-28 rounded-md" />
              <Skeleton className="mx-auto h-4 w-44 rounded-md" />
            </div>
            <div className="pt-4 border-t border-[var(--app-line)] flex items-center justify-between">
              <Skeleton className="h-7 w-20 rounded-xl" />
              <Skeleton className="h-7 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
