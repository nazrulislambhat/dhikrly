import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function UmrahLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Talbiyah Player Skeleton */}
      <div className="mb-8 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* Counters Strip Skeleton (Tawaf 7 & Sai 7) */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]">
          <Skeleton className="h-5 w-36 rounded-md mb-2" />
          <Skeleton className="h-14 w-28 rounded-2xl mb-4" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
        <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]">
          <Skeleton className="h-5 w-36 rounded-md mb-2" />
          <Skeleton className="h-14 w-28 rounded-2xl mb-4" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>

      {/* Step by step guide cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs dark:bg-[#14211e]"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-6 w-3/5 rounded-md mb-3" />
            <Skeleton className="h-4 w-full rounded-md mb-2" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
