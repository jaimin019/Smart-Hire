import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Cpu, Zap, ExternalLink, BookOpen, GitCompare, FileSearch } from 'lucide-react';
import { parseResume, fetchJobs } from '@/lib/api';
import type { ParseResponse, AgentNodeState } from '@/types';

import UploadPanel from '@/components/UploadPanel';
import ResultsPanel from '@/components/ResultsPanel';
import AgentFlow from '@/components/AgentFlow';
import PDFViewer from '@/components/PDFViewer';
import SkillTaxonomy from '@/components/SkillTaxonomy';
import CandidateCompare from '@/components/CandidateCompare';

type Tab = 'analyze' | 'taxonomy' | 'compare';

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'analyze', label: 'Analyze', icon: FileSearch },
  { id: 'taxonomy', label: 'Skill Taxonomy', icon: BookOpen },
  { id: 'compare', label: 'Compare', icon: GitCompare },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentNodeState>({
    parser: 'idle',
    normalizer: 'idle',
    matcher: 'idle',
  });

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch available jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    initialData: [
      { id: 'senior_fullstack', title: 'Senior Full-Stack Engineer', company: 'TechCorp Inc.' },
      { id: 'ml_engineer', title: 'Machine Learning Engineer', company: 'AI Solutions Ltd.' },
      { id: 'frontend_developer', title: 'Senior Frontend Developer', company: 'DesignHub Co.' },
    ],
  });

  // Simulate agent progression for visual effect
  const animateAgents = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setAgentStates({ parser: 'idle', normalizer: 'idle', matcher: 'idle' });

    const t1 = setTimeout(() => {
      setAgentStates({ parser: 'active', normalizer: 'idle', matcher: 'idle' });
    }, 200);
    const t2 = setTimeout(() => {
      setAgentStates({ parser: 'completed', normalizer: 'active', matcher: 'idle' });
    }, 1500);
    const t3 = setTimeout(() => {
      setAgentStates({ parser: 'completed', normalizer: 'completed', matcher: 'active' });
    }, 3000);

    timeoutsRef.current = [t1, t2, t3];
  }, []);

  const completeAllAgents = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setAgentStates({ parser: 'completed', normalizer: 'completed', matcher: 'completed' });
  }, []);

  const mutation = useMutation({
    mutationFn: ({ file, jobId }: { file: File; jobId: string }) => parseResume(file, jobId),
    onMutate: () => {
      setResult(null);
      animateAgents();
    },
    onSuccess: (data) => {
      completeAllAgents();
      setResult(data);
    },
    onError: () => {
      timeoutsRef.current.forEach(clearTimeout);
      setAgentStates({ parser: 'error', normalizer: 'error', matcher: 'error' });
    },
  });

  const handleUpload = useCallback((file: File, jobId: string) => {
    setUploadedFile(file);
    mutation.mutate({ file, jobId });
  }, [mutation]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm border-b border-[var(--color-border-subtle)]">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-[var(--color-text-primary)] leading-tight tracking-wide">
                TalentGraph
              </h1>
              <p className="text-[9px] font-mono text-[var(--color-text-muted)] leading-tight tracking-widest uppercase">
                Multi-Agent Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 border border-[var(--color-border-subtle)] rounded">
              <Zap className="w-3 h-3 text-[var(--color-accent)]" />
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] tracking-wider">
                LangGraph + GPT-4o-mini
              </span>
            </div>
            <a
              href="https://github.com/jaimin019/Smart-Hire"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded flex items-center justify-center
                border border-[var(--color-border)]
                text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                hover:border-[var(--color-accent)]/40 transition-colors duration-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ── Tab Bar — minimal underline style ── */}
        <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-5 py-2.5 text-xs font-mono tracking-wider uppercase
                border-b transition-all duration-200 relative
                ${activeTab === id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }
              `}
            >
              <Icon className="w-3 h-3" />
              {label}
              {id === 'analyze' && result && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] ml-1" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── ANALYZE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'analyze' && (
        <>
          {/* Agent Pipeline Ticker */}
          <section className="max-w-[1600px] mx-auto w-full px-6 pt-5 pb-1">
            <AgentFlow agentStates={agentStates} />
          </section>

          {/* Main Content */}
          <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full" style={{ gap: '24px' }}>
              {/* LEFT: Setup */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-accent)] border-b border-[var(--color-accent)]/30 pb-0.5">
                    Setup
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    Upload & configure analysis
                  </span>
                </div>

                <div className="glass-card p-5">
                  <UploadPanel
                    onUpload={handleUpload}
                    isLoading={mutation.isPending}
                    jobs={jobs}
                    uploadedFile={uploadedFile}
                  />
                </div>

                <div className="flex-1 min-h-[400px]">
                  <PDFViewer file={uploadedFile} />
                </div>
              </div>

              {/* RIGHT: Results */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-emerald)] border-b border-[var(--color-emerald)]/30 pb-0.5">
                    Results
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    AI-powered analysis
                  </span>
                </div>

                {/* Candidate ID banner — shown after successful parse */}
                {result?.candidate_id && (
                  <div className="flex items-center gap-3 rounded
                    bg-[var(--color-success)]/8 border border-[var(--color-success)]/20" style={{ padding: '10px 16px' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-success)]">
                        Candidate Saved
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                        {result.candidate_id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyId(result.candidate_id!)}
                      className="text-[10px] font-mono font-medium px-2.5 py-1 rounded
                        bg-[var(--color-success)]/15 text-[var(--color-success)]
                        hover:bg-[var(--color-success)]/25 transition-colors duration-200 flex-shrink-0"
                    >
                      {copiedId ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                )}

                {mutation.isPending ? (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-mono text-[var(--color-text-primary)]">Agents processing…</p>
                      <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">Parser → Normalizer → Matcher</p>
                    </div>
                  </div>
                ) : mutation.isError ? (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 flex items-center justify-center">
                      <span className="text-lg">⚠</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-mono text-[var(--color-error)]">Analysis Failed</p>
                      <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1 max-w-xs">
                        {(mutation.error as Error)?.message || 'An unexpected error occurred.'}
                      </p>
                    </div>
                  </div>
                ) : result ? (
                  <ResultsPanel data={result} />
                ) : (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                      <Cpu className="w-7 h-7 text-[var(--color-accent)]/50" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-mono text-[var(--color-text-primary)]">Ready to Analyze</p>
                      <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1.5 max-w-xs leading-relaxed">
                        Upload a resume, select a job description, and press
                        <span className="text-[var(--color-accent)] font-medium"> Analyze Resume </span>
                        to begin.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {/* ── TAXONOMY TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'taxonomy' && (
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
          <SkillTaxonomy />
        </main>
      )}

      {/* ── COMPARE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'compare' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-6">
          <CandidateCompare />
        </main>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border-subtle)] py-4 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <p className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">
            Built with LangGraph · FastAPI · React · Sentence-Transformers
          </p>
          <p className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">
            TalentGraph © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
