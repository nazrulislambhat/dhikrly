import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function MasjidsLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Map / Search Skeleton */}
      <div className="mb-6 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 dark:bg-[#14211e]">
        <Skeleton className="h-11 w-full rounded-2xl mb-4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>

      {/* Masjid Cards Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 dark:bg-[#14211e]"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-sm" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
