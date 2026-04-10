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
import { FileSearch, Brain, Target } from 'lucide-react';
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
    ring: 'border-[var(--color-border)]',
    bg: 'bg-[var(--color-bg-card)]',
    glow: '',
    text: 'text-[var(--color-text-muted)]',
  },
  active: {
    ring: 'border-[var(--color-accent)]',
    bg: 'bg-[var(--color-accent-dark)]',
    glow: 'animate-pulse-glow',
    text: 'text-[var(--color-accent-light)]',
  },
  completed: {
    ring: 'border-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/20',
    glow: 'glow-success',
    text: 'text-[var(--color-success)]',
  },
  error: {
    ring: 'border-[var(--color-error)]',
    bg: 'bg-[var(--color-error)]/20',
    glow: '',
    text: 'text-[var(--color-error)]',
  },
};

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const Icon = ICONS[data.icon];
  const style = STATUS_STYLES[data.status];

  return (
    <div
      className={`
        relative px-5 py-4 rounded-2xl border-2 min-w-[180px]
        transition-all duration-500 ease-out
        ${style.ring} ${style.bg} ${style.glow}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-[var(--color-border)] !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--color-border)] !w-2 !h-2" />

      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          transition-all duration-500
          ${data.status === 'active'
            ? 'bg-[var(--color-accent)] shadow-lg shadow-[var(--color-accent-glow)]'
            : data.status === 'completed'
              ? 'bg-[var(--color-success)] shadow-lg shadow-[var(--color-success-glow)]'
              : 'bg-[var(--color-bg-elevated)]'
          }
        `}>
          <Icon className={`w-5 h-5 ${data.status === 'idle' ? 'text-[var(--color-text-muted)]' : 'text-white'}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>
            {data.label}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 max-w-[120px]">
            {data.description}
          </p>
        </div>
      </div>

      {data.status === 'active' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-accent)] animate-ping" />
      )}
      {data.status === 'completed' && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white text-[10px] font-bold">
          ✓
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
          ? 'var(--color-success)'
          : agentStates.parser === 'active' || agentStates.normalizer === 'active'
            ? 'var(--color-accent)'
            : 'var(--color-border)',
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
          ? 'var(--color-success)'
          : agentStates.normalizer === 'active' || agentStates.matcher === 'active'
            ? 'var(--color-accent)'
            : 'var(--color-border)',
        strokeWidth: 2,
      },
    },
  ], [agentStates]);

  return (
    <div className="w-full h-[220px] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border-subtle)" />
      </ReactFlow>
    </div>
  );
}
