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
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg-primary)]/80 border-b border-[var(--color-border-subtle)]">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-violet)] flex items-center justify-center shadow-lg shadow-[var(--color-accent-glow)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text leading-tight">TalentGraph</h1>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight -mt-0.5">
                Multi-Agent Resume Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
              <Zap className="w-3 h-3 text-[var(--color-accent-light)]" />
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Powered by LangGraph + GPT-4o-mini
              </span>
            </div>
            <a
              href="https://github.com/jaimin019/Smart-Hire"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center
                bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                hover:border-[var(--color-accent)] transition-colors duration-200"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-1 pb-0 border-t border-[var(--color-border-subtle)]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold
                border-b-2 transition-all duration-200
                ${activeTab === id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent-light)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'analyze' && result && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] ml-0.5" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── ANALYZE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'analyze' && (
        <>
          {/* Agent Flow */}
          <section className="max-w-[1600px] mx-auto w-full px-6 pt-6 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                Agent Pipeline
              </h2>
            </div>
            <AgentFlow agentStates={agentStates} />
          </section>

          {/* Main Content */}
          <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* LEFT: Setup */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-md">
                    Setup
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Upload & configure your resume analysis
                  </span>
                </div>

                <div className="glass-card p-6">
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
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-2.5 py-1 rounded-md">
                    Results
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    AI-powered analysis results
                  </span>
                </div>

                {/* Candidate ID banner — shown after successful parse */}
                {result?.candidate_id && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                    bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)]">
                        Candidate Saved
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                        {result.candidate_id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyId(result.candidate_id!)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg
                        bg-[var(--color-success)]/20 text-[var(--color-success)]
                        hover:bg-[var(--color-success)]/30 transition-colors duration-200 flex-shrink-0"
                    >
                      {copiedId ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                )}

                {mutation.isPending ? (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-[var(--color-violet)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Agents are working...</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Parsing → Normalizing → Matching</p>
                    </div>
                  </div>
                ) : mutation.isError ? (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-error)]">Analysis Failed</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
                        {(mutation.error as Error)?.message || 'An unexpected error occurred.'}
                      </p>
                    </div>
                  </div>
                ) : result ? (
                  <ResultsPanel data={result} />
                ) : (
                  <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-violet)]/10 flex items-center justify-center">
                        <Cpu className="w-9 h-9 text-[var(--color-accent-light)]" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] flex items-center justify-center">
                        <Zap className="w-3 h-3 text-[var(--color-accent-light)]" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Ready to Analyze</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs leading-relaxed">
                        Upload a resume on the left, select a job description, and click
                        <span className="text-[var(--color-accent-light)] font-medium"> Analyze Resume </span>
                        to see the magic happen.
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
        <main className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6">
          <CandidateCompare />
        </main>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border-subtle)] py-4">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Built with LangGraph · FastAPI · React · Sentence-Transformers
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            TalentGraph © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
