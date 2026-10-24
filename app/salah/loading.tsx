import { Skeleton, PageHeaderSkeleton, PrayerCardSkeleton } from '@/components/Skeleton';

export default function SalahLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 pt-5 pb-10 sm:px-4 sm:pt-8 lg:px-4 space-y-6">
      <PageHeaderSkeleton />

      {/* Tabs Row Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="h-10 w-28 rounded-2xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-2xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-2xl shrink-0" />
      </div>

      {/* Prayer Schedule & Countdown Banner Skeleton */}
      <PrayerCardSkeleton />
    </div>
  );
}
