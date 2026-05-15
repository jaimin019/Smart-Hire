import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const variants = {
    success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25',
    warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/25',
    error: 'bg-[var(--error)]/15 text-[var(--error)] border-[var(--error)]/25',
    info: 'bg-[var(--accent)]/15 text-[var(--accent-bright)] border-[var(--accent)]/25',
    neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] uppercase tracking-widest',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold border rounded-md whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
