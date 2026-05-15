import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function ScoreRing({ score, size = 120, className }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Small delay to ensure the animation triggers after mount
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeWidth = Math.max(4, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate offset based on animated score
  const progress = (animatedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  let color = 'var(--success)';
  let glowColor = 'var(--success-muted)';
  if (score < 40) {
    color = 'var(--error)';
    glowColor = 'var(--error-muted)';
  } else if (score <= 70) {
    color = 'var(--warning)';
    glowColor = 'var(--warning-muted)';
  }

  return (
    <div className={cn("relative flex-shrink-0 flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 transform origin-center" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 800ms ease-out',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-medium leading-none" style={{ color, fontSize: size * 0.25 }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">Match</span>
      </div>
    </div>
  );
}
