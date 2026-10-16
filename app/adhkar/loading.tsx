import { Skeleton, PageHeaderSkeleton, AdhkarCardSkeleton } from '@/components/Skeleton';

export default function AdhkarLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Category Tabs Skeleton */}
      <div className="mb-6 flex items-center gap-2 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Category Progress Card Skeleton */}
      <div className="mb-8 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 dark:bg-[#14211e]">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full mb-4" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </div>

      {/* Adhkar Cards Skeleton */}
      <AdhkarCardSkeleton count={4} />
    </div>
  );
}
