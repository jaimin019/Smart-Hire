import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
  Handle,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileSearch, Brain, Target, Check } from 'lucide-react';
import type { AgentNodeState, AgentStatus } from '@/types';

/* ── Agent Node Component ─────────────────────────────────────────────────── */

interface AgentNodeData {
  label: string;
  description: string;
  icon: 'parser' | 'normalizer' | 'matcher';
  status: AgentStatus;
  [key: string]: unknown;
}

const ICONS = {
  parser: FileSearch,
  normalizer: Brain,
  matcher: Target,
};

const STATUS_STYLES: Record<AgentStatus, { ring: string; bg: string; glow: string; text: string }> = {
  idle: {
    ring: 'border-[var(--border)]',
    bg: 'bg-[var(--bg-surface)]',
    glow: '',
    text: 'text-[var(--text-muted)]',
  },
  active: {
    ring: 'border-[var(--accent)]',
    bg: 'bg-[var(--accent-muted)]',
    glow: 'shadow-[0_0_15px_var(--accent-muted)]',
    text: 'text-[var(--text-primary)]',
  },
  completed: {
    ring: 'border-[var(--success)]',
    bg: 'bg-[var(--success-muted)]',
    glow: 'shadow-[0_0_10px_var(--success-muted)]',
    text: 'text-[var(--text-primary)]',
  },
  error: {
    ring: 'border-[var(--error)]',
    bg: 'bg-[var(--error-muted)]',
    glow: '',
    text: 'text-[var(--error)]',
  },
};

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const Icon = ICONS[data.icon];
  const style = STATUS_STYLES[data.status];

  return (
    <div
      className={`
        relative px-5 py-4 rounded-[var(--radius-lg)] border-2 min-w-[190px]
        transition-all duration-500 ease-out shadow-sm
        ${style.ring} ${style.bg} ${style.glow}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-[var(--border-strong)] !w-2 !h-2 !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--border-strong)] !w-2 !h-2 !border-none" />

      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center
          transition-all duration-500
          ${data.status === 'active'
            ? 'bg-[var(--accent)] text-white shadow-accent'
            : data.status === 'completed'
              ? 'bg-[var(--success)] text-white shadow-[0_0_10px_var(--success)]'
              : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-sm font-display font-bold ${style.text}`}>
            {data.label}
          </p>
          <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5 max-w-[120px]">
            {data.description}
          </p>
        </div>
      </div>

      {data.status === 'active' && (
        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--accent)] border-2 border-[var(--bg-base)]"></span>
        </div>
      )}
      {data.status === 'completed' && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--success)] border-2 border-[var(--bg-base)] flex items-center justify-center text-white">
          <Check className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}

/* ── Main Flow Component ──────────────────────────────────────────────────── */

interface AgentFlowProps {
  agentStates: AgentNodeState;
}

const nodeTypes = { agent: AgentNode };

export default function AgentFlow({ agentStates }: AgentFlowProps) {
  const nodes: Node<AgentNodeData>[] = useMemo(() => [
    {
      id: 'parser',
      type: 'agent',
      position: { x: 50, y: 80 },
      data: {
        label: 'Parser Agent',
        description: 'Extract text from PDF',
        icon: 'parser' as const,
        status: agentStates.parser,
      },
    },
    {
      id: 'normalizer',
      type: 'agent',
      position: { x: 320, y: 80 },
      data: {
        label: 'Normalizer Agent',
        description: 'LLM-powered extraction',
        icon: 'normalizer' as const,
        status: agentStates.normalizer,
      },
    },
    {
      id: 'matcher',
      type: 'agent',
      position: { x: 590, y: 80 },
      data: {
        label: 'Matcher Agent',
        description: 'Semantic similarity',
        icon: 'matcher' as const,
        status: agentStates.matcher,
      },
    },
  ], [agentStates]);

  const edges: Edge[] = useMemo(() => [
    {
      id: 'e-parser-normalizer',
      source: 'parser',
      target: 'normalizer',
      animated: agentStates.parser === 'active' || agentStates.normalizer === 'active',
      style: {
        stroke: agentStates.normalizer === 'completed' || agentStates.matcher === 'completed'
          ? 'var(--success)'
          : agentStates.parser === 'active' || agentStates.normalizer === 'active'
            ? 'var(--accent)'
            : 'var(--border-strong)',
        strokeWidth: 2,
      },
    },
    {
      id: 'e-normalizer-matcher',
      source: 'normalizer',
      target: 'matcher',
      animated: agentStates.normalizer === 'active' || agentStates.matcher === 'active',
      style: {
        stroke: agentStates.matcher === 'completed'
          ? 'var(--success)'
          : agentStates.normalizer === 'active' || agentStates.matcher === 'active'
            ? 'var(--accent)'
            : 'var(--border-strong)',
        strokeWidth: 2,
      },
    },
  ], [agentStates]);

  return (
    <div className="w-full h-[220px] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--bg-base)] shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-strong)" />
      </ReactFlow>
    </div>
  );
}
