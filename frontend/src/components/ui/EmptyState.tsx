import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-6 text-center", className)}>
      <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mb-6 text-[var(--text-muted)] shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
