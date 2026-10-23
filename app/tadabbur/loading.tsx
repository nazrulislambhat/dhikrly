import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function TadabburLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Mood Selector Skeleton */}
      <div className="mb-6 flex items-center gap-2 overflow-hidden pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Search Input Skeleton */}
      <Skeleton className="mb-8 h-11 w-full rounded-2xl" />

      {/* Situational Dua Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-lg mb-3" />
            <Skeleton className="h-20 w-full rounded-2xl mb-4" />
            <Skeleton className="h-4 w-full rounded-md mb-2" />
            <Skeleton className="h-4 w-5/6 rounded-md mb-4" />
            <div className="pt-4 border-t border-[var(--app-line)] flex items-center justify-between">
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
