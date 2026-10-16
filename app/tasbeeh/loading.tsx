import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function TasbeehLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />

      {/* Main Tasbeeh Counter Circle Placeholder */}
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-8 text-center dark:bg-[#14211e]">
        <Skeleton className="mb-4 h-6 w-36 rounded-full" />
        <Skeleton className="my-6 h-60 w-60 rounded-full" />
        <div className="flex items-center gap-3 mt-4">
          <Skeleton className="h-10 w-24 rounded-2xl" />
          <Skeleton className="h-10 w-24 rounded-2xl" />
          <Skeleton className="h-10 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
