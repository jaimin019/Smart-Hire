import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  showValue?: boolean;
  className?: string;
  color?: string;
}

export function ProgressBar({ value, max = 100, showValue = true, className, color }: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min(100, Math.max(0, (animatedValue / max) * 100));

  let colorClass = 'bg-[var(--success)]';
  if (color) {
    colorClass = '';
  } else if (value < 40) {
    colorClass = 'bg-[var(--error)]';
  } else if (value <= 70) {
    colorClass = 'bg-[var(--warning)]';
  }

  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden shadow-inner relative">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-mono font-medium text-[var(--text-secondary)] w-9 text-right flex-shrink-0">
          {value}%
        </span>
      )}
    </div>
  );
}
