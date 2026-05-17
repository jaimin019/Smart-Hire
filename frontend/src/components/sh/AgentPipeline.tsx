import { FileText, Sparkles, Target, Check } from "lucide-react";

export type AgentState = "idle" | "active" | "complete";

const agents = [
  { key: "parser", label: "Parser", desc: "PDF/DOCX → Raw text", color: "secondary", Icon: FileText },
  { key: "normaliser", label: "Normaliser", desc: "Skill extraction & cleanup", color: "primary", Icon: Sparkles },
  { key: "matcher", label: "Matcher", desc: "Semantic scoring", color: "green", Icon: Target },
] as const;

const stateBorder = {
  idle: "border-border-subtle",
  active: "border-amber shadow-glow-amber",
  complete: "border-green",
} as const;

const colorMap = {
  primary: { bg: "rgba(124,58,237,0.15)", color: "#7c3aed" },
  secondary: { bg: "rgba(6,182,212,0.15)", color: "#06b6d4" },
  green: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
} as const;

export function AgentPipeline({ states = ["idle", "idle", "idle"] as AgentState[], compact = false }: { states?: AgentState[]; compact?: boolean }) {
  return (
    <div className={`flex items-stretch gap-3 ${compact ? "" : "p-2"}`}>
      {agents.map((a, i) => {
        const Icon = a.Icon;
        const st = states[i] ?? "idle";
        const c = colorMap[a.color];
        const isLast = i === agents.length - 1;
        const lineComplete = (states[i] === "complete") && (states[i + 1] !== "idle");
        return (
          <div key={a.key} className="flex flex-1 items-center gap-3">
            <div className={`relative flex flex-1 items-center gap-3 rounded-[14px] border bg-card px-4 py-3 transition-all ${stateBorder[st]}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: c.bg, color: c.color }}>
                {st === "complete" ? <Check className="h-4 w-4 text-green" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text-primary">{a.label}</div>
                <div className="truncate text-[11px] text-text-muted">{a.desc}</div>
              </div>
              {st === "active" && (
                <div className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-amber" />
              )}
            </div>
            {!isLast && (
              <div className="relative h-[2px] w-12 overflow-hidden rounded-full bg-elevated">
                <div className={`absolute inset-y-0 left-0 transition-all duration-500 ${lineComplete ? "w-full bg-green" : "w-0"}`} />
                {!lineComplete && (
                  <div className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary animate-flow-dot" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
