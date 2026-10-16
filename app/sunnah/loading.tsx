import { Skeleton, PageHeaderSkeleton, SunnahCardSkeleton } from '@/components/Skeleton';

export default function SunnahLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Notification Player Box Skeleton */}
      <div className="mb-8 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 sm:p-7 shadow-xs dark:bg-[#14211e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="mb-6 flex items-center gap-2 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Sunnah Cards List Skeleton */}
      <SunnahCardSkeleton count={4} />
    </div>
  );
}
