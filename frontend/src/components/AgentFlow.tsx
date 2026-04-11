import { FileSearch, Brain, Target } from 'lucide-react';
import type { AgentNodeState, AgentStatus } from '@/types';

/* ── Agent Pipeline Ticker ─────────────────────────────────────────────────── */

interface AgentFlowProps {
  agentStates: AgentNodeState;
}

const AGENTS: {
  key: keyof AgentNodeState;
  label: string;
  description: string;
  icon: typeof FileSearch;
}[] = [
  { key: 'parser', label: 'Parser', description: 'PDF/DOCX extraction', icon: FileSearch },
  { key: 'normalizer', label: 'Normalizer', description: 'LLM skill extraction', icon: Brain },
  { key: 'matcher', label: 'Matcher', description: 'Semantic matching', icon: Target },
];

function AgentDot({ status }: { status: AgentStatus }) {
  const base = 'w-2.5 h-2.5 rounded-full transition-all duration-500 flex-shrink-0';

  if (status === 'completed') {
    return <div className={`${base} bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent-glow)]`} />;
  }
  if (status === 'active') {
    return <div className={`${base} bg-[var(--color-accent)] animate-amber-dot`} />;
  }
  if (status === 'error') {
    return <div className={`${base} bg-[var(--color-error)]`} />;
  }
  return <div className={`${base} bg-[var(--color-border)]`} />;
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex-1 h-px relative" style={{ minWidth: '40px', margin: '0 12px' }}>
      <div className="absolute inset-0" style={{ backgroundColor: active ? 'rgba(245, 166, 35, 0.5)' : 'var(--color-border)', height: '1px', boxShadow: active ? '0 0 6px var(--color-accent-glow)' : 'none', transition: 'all 0.5s ease' }} />
    </div>
  );
}

export default function AgentFlow({ agentStates }: AgentFlowProps) {
  return (
    <div className="flex items-center w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded" style={{ padding: '12px 20px' }}>
      {AGENTS.map((agent, i) => {
        const status = agentStates[agent.key];
        const Icon = agent.icon;
        const isLit = status === 'active' || status === 'completed';

        return (
          <div key={agent.key} className="contents">
            {/* Connector before (except first) */}
            {i > 0 && (
              <Connector active={
                agentStates[AGENTS[i - 1].key] === 'completed' ||
                agentStates[AGENTS[i - 1].key] === 'active'
              } />
            )}

            {/* Agent node */}
            <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: '180px', padding: '4px 16px 4px 0' }}>
              <AgentDot status={status} />
              <Icon className={`w-4 h-4 transition-colors duration-300 ${
                isLit ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`} />
              <div className="flex flex-col gap-0.5">
                <span className={`text-[12px] font-mono font-medium tracking-wide transition-colors duration-300 leading-none ${
                  isLit ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {agent.label}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] leading-none" style={{ opacity: 0.6 }}>
                  {agent.description}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
