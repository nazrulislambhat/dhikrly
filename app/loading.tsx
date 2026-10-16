import { Skeleton, PageHeaderSkeleton, StatCardSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      {/* Top Greeting & Date Skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>

      {/* Progress & Stat Cards Row Skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Heatmap / Streak Skeleton */}
      <div className="mb-6 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 dark:bg-[#14211e]">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      {/* Duas List Skeleton */}
      <div className="space-y-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-xs dark:bg-[#14211e]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-sm" />
              </div>
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <div className="my-3 space-y-1.5 text-right">
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-4/5 ml-auto rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
