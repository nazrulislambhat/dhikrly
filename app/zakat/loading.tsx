import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function ZakatLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Nisab Ticker Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6">
          <Skeleton className="h-4 w-32 rounded-md mb-2" />
          <Skeleton className="h-8 w-44 rounded-xl mb-1" />
          <Skeleton className="h-3 w-28 rounded-sm" />
        </div>
        <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6">
          <Skeleton className="h-4 w-32 rounded-md mb-2" />
          <Skeleton className="h-8 w-44 rounded-xl mb-1" />
          <Skeleton className="h-3 w-28 rounded-sm" />
        </div>
      </div>

      {/* Zakat Form Skeleton */}
      <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
