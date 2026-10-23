import { Skeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function RamadanLoading() {
  return (
    <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
      <PageHeaderSkeleton />
      <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 mb-6">
        <Skeleton className="h-6 w-52 rounded-lg mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
