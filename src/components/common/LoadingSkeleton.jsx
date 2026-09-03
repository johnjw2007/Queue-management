import React from 'react';

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-6 w-6 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-20 mb-2" />
      <LoadingSkeleton className="h-3 w-36" />
    </div>
  );
}
