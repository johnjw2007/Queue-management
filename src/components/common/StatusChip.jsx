import React from 'react';
import { motion } from 'framer-motion';

export function StatusChip({ status, label, className = '' }) {
  const isViolation = status === 'Violation Detected' || status === 'Violation' || status === 'Warning';
  const isExcellent = status === 'Proper Queue' || status === 'Excellent' || status === 'Normal';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
        isViolation
          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          : isExcellent
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <motion.span
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className={`absolute inline-flex h-full w-full rounded-full ${
            isViolation ? 'bg-red-500' : isExcellent ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isViolation ? 'bg-red-500' : isExcellent ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </span>
      <span>{label || status}</span>
    </div>
  );
}
