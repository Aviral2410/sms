import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export const Skeleton = ({ className, ...props }: HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
      className={`bg-white/5 border border-white/5 rounded-xl ${className}`}
      {...props}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in">
    <div className="space-y-2">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-96 w-full lg:col-span-2" />
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);
