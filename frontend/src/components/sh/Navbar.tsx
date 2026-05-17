import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FileSearch, Users, GitCompareArrows, BookOpen, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/analyze", label: "Analyze", icon: FileSearch },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/taxonomy", label: "Taxonomy", icon: BookOpen },
] as const;

export function Navbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealthy(res.status === 'healthy');
      } catch {
        setHealthy(false);
      }
    };
    checkHealth();
    const timer = setInterval(checkHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 h-14 border-b border-border-subtle backdrop-blur-xl"
      style={{ background: "rgba(8,8,15,0.7)" }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-[10px] bg-gradient-primary shadow-glow-purple" />
          <div className="leading-tight">
            <div className="text-[16px] font-bold text-text-primary">Smart Hire</div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-text-muted">Multi-Agent Resume Intelligence</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface/80 p-1">
          {links.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow-glow-purple"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-elevated px-3 py-1.5">
          {healthy === null ? (
            <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse" />
          ) : healthy ? (
            <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {healthy === null ? "Connecting…" : healthy ? "Pipeline Active" : "Pipeline Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
