'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base shimmering skeleton primitive.
 * Adapts automatically to light/dark themes with high-end emerald/stone styling.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded-xl bg-stone-200/70 dark:bg-stone-800/60 ${className}`}
      {...props}
    />
  );
}

/**
 * Standard page header skeleton with badge, title and subtitle placeholders.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      <Skeleton className="h-6 w-36 rounded-full" />
      <Skeleton className="h-10 w-72 sm:w-96 rounded-2xl" />
      <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for Salah Prayer Cards & Countdown Banner.
 */
export function PrayerCardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Next prayer countdown banner skeleton */}
      <div className="relative min-h-36 overflow-hidden rounded-2xl border border-[var(--app-line)] bg-stone-100/60 p-6 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-7 w-44 rounded-xl" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-9 w-20 rounded-xl" />
            <Skeleton className="ml-auto h-3 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* 5 Daily Prayers Skeleton List */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-[var(--app-line)] bg-stone-50/70 p-4 dark:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-6 w-6 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Quran Reader Mode Ayah cards.
 */
export function AyahReaderSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs"
        >
          {/* Card Top: verse badge & audio control skeleton */}
          <div className="flex items-center justify-between border-b border-[var(--app-line)] pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>

          {/* Arabic Verse Placeholder (RTL lines) */}
          <div className="my-6 space-y-3 text-right" dir="rtl">
            <Skeleton className="h-7 w-full rounded-xl" />
            <Skeleton className="h-7 w-11/12 rounded-xl" />
            <Skeleton className="h-7 w-4/5 rounded-xl" />
          </div>

          {/* Translation Lines */}
          <div className="space-y-2 pt-2 border-t border-[var(--app-line)]">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Mushaf Page View.
 */
export function MushafPageSkeleton() {
  return (
    <div className="mx-auto min-h-[min(72vh,58rem)] w-[min(100%,44rem)] rounded-[1.35rem] border border-[var(--app-line)] bg-stone-50/50 p-6 sm:p-12 dark:bg-[#17251f]/60 shadow-md">
      {/* Surah Header Banner placeholder */}
      <div className="mx-auto mb-8 flex h-14 max-w-sm items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-2 dark:bg-emerald-950/20">
        <Skeleton className="h-6 w-48 rounded-lg" />
      </div>

      {/* Rhythmic lines simulating Quran page calligraphy */}
      <div className="space-y-5 text-right" dir="rtl">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((line) => (
          <div key={line} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-5 rounded-full shrink-0" />
            <Skeleton
              className={`h-5 rounded-md ${
                line % 3 === 0
                  ? 'w-[94%]'
                  : line % 2 === 0
                    ? 'w-full'
                    : 'w-[88%]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Page bottom number */}
      <div className="mt-10 flex justify-center">
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Adhkar items.
 */
export function AdhkarCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-28 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-7 rounded-xl" />
          </div>

          <div className="my-5 rounded-2xl bg-black/5 dark:bg-white/5 p-5 space-y-2.5">
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-5/6 rounded-lg ml-auto" />
          </div>

          <div className="space-y-2 mb-4">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
          </div>

          <div className="pt-4 border-t border-[var(--app-line)] flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Halal Product Scanner result.
 */
export function HalalScannerSkeleton() {
  return (
    <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--app-line)]">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-7 w-64 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-2xl" />
      </div>

      <div className="my-6 space-y-3">
        <Skeleton className="h-4 w-36 rounded-md" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((tag) => (
            <Skeleton key={tag} className="h-8 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-[var(--app-line)]">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Sunnah Items & Cards.
 */
export function SunnahCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-xs"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          <div className="my-4 space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
          </div>

          <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-3.5 space-y-2">
            <Skeleton className="h-3.5 w-36 rounded-md" />
            <Skeleton className="h-3 w-full rounded-sm" />
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * General purpose stat card skeleton.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-7 w-24 rounded-lg" />
      <Skeleton className="mt-2 h-3 w-32 rounded-sm" />
    </div>
  );
}
