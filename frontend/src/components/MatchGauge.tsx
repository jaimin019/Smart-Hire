import { useEffect, useState, useMemo } from 'react';

interface MatchGaugeProps {
  score: number;
}

export default function MatchGauge({ score }: MatchGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [needleAngle, setNeedleAngle] = useState(225);

  const cx = 120, cy = 120, r = 88;
  const startAngle = 225;
  const sweepAngle = 270;

  useEffect(() => {
    const duration = 1800;
    const startTime = performance.now();
    const startVal = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (score - startVal) * eased);
      setDisplayScore(current);
      setNeedleAngle(startAngle - (current / 100) * sweepAngle);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  const getPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i <= 100; i += 2) {
      const angle = startAngle - (i / 100) * sweepAngle;
      const isMajor = i % 25 === 0;
      const isMid = i % 10 === 0 && !isMajor;
      const outerR = r + 2;
      const innerR = isMajor ? r - 14 : isMid ? r - 9 : r - 5;
      const outer = getPoint(angle, outerR);
      const inner = getPoint(angle, innerR);
      result.push({ i, isMajor, isMid, outer, inner, angle });
    }
    return result;
  }, []);

  const labels = useMemo(() => {
    return [0, 25, 50, 75, 100].map(val => {
      const angle = startAngle - (val / 100) * sweepAngle;
      const pos = getPoint(angle, r - 22);
      return { val, ...pos };
    });
  }, []);

  // Background arc
  const arcStart = getPoint(startAngle, r);
  const arcEnd = getPoint(startAngle - sweepAngle, r);

  // Progress arc
  const scoreArcAngle = startAngle - (displayScore / 100) * sweepAngle;
  const scoreArcEnd = getPoint(scoreArcAngle, r);
  const largeArc = (displayScore / 100) * sweepAngle > 180 ? 1 : 0;

  // Needle
  const needlePoint = getPoint(needleAngle, r - 6);
  const needleBase1 = getPoint(needleAngle + 90, 3);
  const needleBase2 = getPoint(needleAngle - 90, 3);

  const scoreColor =
    displayScore >= 75 ? '#7CB342' :
    displayScore >= 50 ? '#F5A623' :
    '#C75B4A';

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 240 165" className="w-[220px] h-[155px]">
        <defs>
          <filter id="amber-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needle-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gauge-progress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C75B4A" />
            <stop offset="40%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#7CB342" />
          </linearGradient>
        </defs>

        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#1E1B17" strokeWidth="1" />

        {/* Background arc track */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#1E1B17"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {displayScore > 0 && (
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${scoreArcEnd.x} ${scoreArcEnd.y}`}
            fill="none"
            stroke={scoreColor}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
            filter="url(#amber-glow)"
          />
        )}

        {/* Tick marks */}
        {ticks.map(({ i, isMajor, isMid, outer, inner }) => (
          <line
            key={i}
            x1={outer.x} y1={outer.y}
            x2={inner.x} y2={inner.y}
            stroke={
              i <= displayScore
                ? (isMajor ? '#F0EDE6' : isMid ? '#B5AFA3' : '#6B6560')
                : (isMajor ? '#3A352E' : '#2E2A22')
            }
            strokeWidth={isMajor ? 2 : isMid ? 1.2 : 0.6}
            strokeLinecap="round"
          />
        ))}

        {/* Labels */}
        {labels.map(({ val, x, y }) => (
          <text
            key={val}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-mono"
            fill={val <= displayScore ? '#B5AFA3' : '#3A352E'}
            fontSize="9"
            fontFamily="'DM Mono', monospace"
          >
            {val}
          </text>
        ))}

        {/* Needle */}
        <polygon
          points={`${needlePoint.x},${needlePoint.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={scoreColor}
          filter="url(#needle-glow)"
        />

        {/* Center dot — watch crown */}
        <circle cx={cx} cy={cy} r="6" fill="#1A1814" stroke="#2E2A22" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="2.5" fill={scoreColor} />

        {/* Digital readout */}
        <text
          x={cx} y={cy + 30}
          textAnchor="middle"
          fill={scoreColor}
          fontSize="32"
          fontFamily="'DM Mono', monospace"
          fontWeight="500"
        >
          {displayScore}
        </text>
        <text
          x={cx} y={cy + 45}
          textAnchor="middle"
          fill="#6B6560"
          fontSize="7"
          fontFamily="'DM Mono', monospace"
          letterSpacing="3"
        >
          MATCH SCORE
        </text>
      </svg>
    </div>
  );
}
