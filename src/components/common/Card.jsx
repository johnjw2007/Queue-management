import React from 'react';
import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
