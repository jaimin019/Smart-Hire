import { type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { initials, colorFor, scoreColor } from "@/lib/ui";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "amber" | "danger" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[13px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed px-5 h-10";
  const styles =
    variant === "primary"
      ? "bg-gradient-primary text-white hover:-translate-y-[1px] hover:shadow-glow-purple"
      : variant === "amber"
      ? "bg-gradient-amber text-white hover:-translate-y-[1px] animate-glow-pulse"
      : variant === "danger"
      ? "bg-red text-white hover:-translate-y-[1px]"
      : variant === "ghost"
      ? "text-text-secondary hover:bg-elevated hover:text-text-primary"
      : "border border-border-default bg-transparent text-text-primary hover:bg-elevated";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  className = "",
  hover = false,
  children,
  delay = 0,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean; delay?: number }) {
  return (
    <div
      className={`rounded-[14px] border border-border-subtle bg-card shadow-card animate-fade-in-up ${hover ? "transition-all hover:bg-card-hover hover:border-border-default hover:-translate-y-[3px]" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer rounded-[10px] ${className}`} />;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted ${className}`}>{children}</div>
  );
}

export function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const bg = colorFor(name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

export function Chip({
  variant = "purple",
  children,
  className = "",
}: {
  variant?: "green" | "red" | "purple" | "cyan" | "amber" | "muted";
  children: ReactNode;
  className?: string;
}) {
  const map = {
    green: "bg-[rgba(16,185,129,0.12)] text-green border border-[rgba(16,185,129,0.35)]",
    red: "bg-[rgba(239,68,68,0.12)] text-red border border-[rgba(239,68,68,0.35)]",
    purple: "bg-[rgba(124,58,237,0.15)] text-primary border border-[rgba(124,58,237,0.4)]",
    cyan: "bg-[rgba(6,182,212,0.12)] text-secondary border border-[rgba(6,182,212,0.35)]",
    amber: "bg-[rgba(245,158,11,0.12)] text-amber border border-[rgba(245,158,11,0.35)]",
    muted: "bg-elevated text-text-secondary border border-border-subtle",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium ${map[variant]} ${className}`}>{children}</span>;
}

export function ScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div
      className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-bold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {Math.round(score)}
    </div>
  );
}

export function ScoreGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const c = scoreColor(pct);
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(124,58,237,0.15)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={c.text} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[28px] font-bold" style={{ color: c.text }}>{pct.toFixed(1)}</div>
        </div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">Match</div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, color = "purple" }: { icon: ReactNode; title: string; subtitle?: string; color?: "purple" | "amber" | "cyan" }) {
  const map = { purple: "bg-[rgba(124,58,237,0.12)] text-primary", amber: "bg-[rgba(245,158,11,0.12)] text-amber", cyan: "bg-[rgba(6,182,212,0.12)] text-secondary" } as const;
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${map[color]}`}>{icon}</div>
      <div className="mt-4 text-[16px] font-semibold text-text-primary">{title}</div>
      {subtitle && <div className="mt-2 max-w-sm text-[13px] text-text-secondary">{subtitle}</div>}
    </div>
  );
}

export function PillToggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-full border border-border-subtle bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all cursor-pointer ${
            value === o.value ? "bg-primary text-white shadow-glow-purple" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
