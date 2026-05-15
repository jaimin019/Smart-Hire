
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface SkillChipProps {
  label: string;
  variant?: 'matched' | 'missing' | 'neutral' | 'colored';
  color?: string; // Hex color if variant is 'colored'
  onRemove?: () => void;
  className?: string;
  delayIndex?: number; // for staggered entrance
}

export function SkillChip({ 
  label, 
  variant = 'neutral', 
  color,
  onRemove, 
  className,
  delayIndex
}: SkillChipProps) {
  
  const getStyles = () => {
    switch (variant) {
      case 'matched':
        return 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25';
      case 'missing':
        return 'bg-[var(--error)]/15 text-[var(--error)] border-[var(--error)]/25 opacity-80';
      case 'colored':
        return 'text-white border-transparent';
      default:
        return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'matched': return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />;
      case 'missing': return <XCircle className="w-3.5 h-3.5 mr-1.5" />;
      default: return null;
    }
  };

  const styleObj = variant === 'colored' && color 
    ? { backgroundColor: `${color}25`, borderColor: `${color}40`, color } 
    : {};
    
  if (delayIndex !== undefined) {
    // @ts-expect-error adding custom property
    styleObj['animationDelay'] = `${delayIndex * 0.05}s`;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
        delayIndex !== undefined && 'animate-fade-in-up opacity-0',
        getStyles(),
        className
      )}
      style={styleObj}
    >
      {getIcon()}
      {label}
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-2 hover:text-white transition-colors p-0.5 rounded-full hover:bg-black/20"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
