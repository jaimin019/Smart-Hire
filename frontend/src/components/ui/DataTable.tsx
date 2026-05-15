import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  hoverable?: boolean;
  className?: string;
}

export function DataTable<T>({ columns, data, onRowClick, hoverable = true, className }: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-card", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--border-strong)] bg-[var(--bg-base)]">
            {columns.map((col, i) => (
              <th 
                key={col.key} 
                className={cn(
                  "px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]",
                  i === 0 && "pl-5",
                  i === columns.length - 1 && "pr-5",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {data.map((row, rowIndex) => (
            <tr 
              // @ts-expect-error fallback key
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors duration-150 group animate-fade-in-up",
                hoverable && onRowClick && "cursor-pointer hover:bg-[var(--bg-overlay)]",
                hoverable && !onRowClick && "hover:bg-[var(--bg-elevated)]"
              )}
              style={{ animationDelay: `${rowIndex * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              {columns.map((col, colIndex) => (
                <td 
                  key={col.key} 
                  className={cn(
                    "px-4 py-3.5 text-sm align-middle",
                    colIndex === 0 && "pl-5",
                    colIndex === columns.length - 1 && "pr-5",
                    col.className
                  )}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
