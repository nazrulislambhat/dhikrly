import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function AmbientLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Main Visualizer & Master Play Skeleton */}
      <div className="mb-8 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 sm:p-8">
        <Skeleton className="mb-6 h-36 sm:h-48 w-full rounded-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-10 w-48 rounded-2xl" />
        </div>
      </div>

      {/* Ambient Sound Sliders Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
