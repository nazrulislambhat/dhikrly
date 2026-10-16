import { Skeleton, PageHeaderSkeleton, PrayerCardSkeleton } from '@/components/Skeleton';

export default function SalahLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Tabs Row Skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-10 w-28 rounded-2xl" />
        <Skeleton className="h-10 w-28 rounded-2xl" />
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </div>

      {/* Prayer Schedule & Countdown Banner Skeleton */}
      <PrayerCardSkeleton />
    </div>
  );
}
