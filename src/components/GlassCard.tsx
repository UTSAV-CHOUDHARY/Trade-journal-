import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { HTMLMotionProps, motion } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard = ({ children, className, delay = 0, ...props }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      {...props}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        rotateX: 4,
        rotateY: -4,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        transition: { 
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay 
      }}
      className={cn(
        "bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-colors duration-500",
        className
      )}
      style={{ perspective: 1000 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
};
