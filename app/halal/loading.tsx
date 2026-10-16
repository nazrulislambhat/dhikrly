import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function HalalLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Barcode Scanner Box Skeleton */}
      <div className="mb-8 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 dark:bg-[#14211e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36 rounded-2xl" />
            <Skeleton className="h-10 w-36 rounded-2xl" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-24 rounded-2xl" />
        </div>
      </div>

      {/* E-Number Dictionary Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 dark:bg-[#14211e]"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-sm" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
