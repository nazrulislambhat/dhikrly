import { Skeleton, PageHeaderSkeleton, AyahReaderSkeleton } from '@/components/Skeleton';

export default function QuranLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      {/* Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Surah Selector & Audio Player Control Toolbar Skeleton */}
      <div className="mb-6 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-44 rounded-2xl" />
            <Skeleton className="h-10 w-28 rounded-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-10 w-32 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Reader Ayahs Skeleton */}
      <AyahReaderSkeleton count={5} />
    </div>
  );
}
