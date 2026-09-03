import React from 'react';
import { motion } from 'framer-motion';

export function ProgressBar({ value, max = 100, variant = 'primary', className = '', showLabel = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    primary: 'bg-blue-600 dark:bg-blue-500',
    secondary: 'bg-emerald-500 dark:bg-emerald-400',
    danger: 'bg-red-500 dark:bg-red-400',
    amber: 'bg-amber-500 dark:bg-amber-400'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
          <span>Progress</span>
          <span>{value} / {max} Points</span>
        </div>
      )}
      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[variant] || colors.primary}`}
        />
      </div>
    </div>
  );
}
