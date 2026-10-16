import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function QadaLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 dark:bg-[#14211e]">
            <Skeleton className="h-4 w-16 rounded-md mb-2" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 dark:bg-[#14211e]">
        <Skeleton className="h-6 w-44 rounded-lg mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
