import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function QiblaLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-8 text-center dark:bg-[#14211e]">
        <Skeleton className="mb-6 h-64 w-64 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-md mb-2" />
        <Skeleton className="h-4 w-48 rounded-sm" />
      </div>
    </div>
  );
}
