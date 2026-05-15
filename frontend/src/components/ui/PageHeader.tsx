import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-[var(--border-subtle)] bg-[var(--bg-base)]", className)}>
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-bright)] shadow-inner flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <div className="text-sm text-[var(--text-muted)] mt-1 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        
        {action && (
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
