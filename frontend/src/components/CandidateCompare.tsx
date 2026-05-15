import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GitCompare, Trophy, TrendingUp, Users, Sparkles,
  ChevronDown, ChevronUp, Medal, Crown, Star, BarChart3,
  CheckCircle2, XCircle, Zap, Search
} from 'lucide-react';
import { fetchCandidates, fetchJobs, compareCandidates, compareCandidatesMulti } from '@/lib/api';
import type {
  CompareResponse, MultiCompareResponse, StoredCandidate, RankedCandidate,
} from '@/types';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SkillChip } from '@/components/ui/SkillChip';
import { ProgressBar } from '@/components/ui/ProgressBar';

/* ── Sub-components ──────────────────────────────────────────────────────── */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-lg bg-[var(--warning-muted)] border border-[var(--warning)]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_var(--warning-muted)]">
      <Crown className="w-4 h-4 text-[var(--warning)]" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--text-muted)]/30 flex items-center justify-center flex-shrink-0">
      <Medal className="w-4 h-4 text-[#C0C0C0]" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-lg bg-[#CD7F32]/10 border border-[#CD7F32]/20 flex items-center justify-center flex-shrink-0">
      <Medal className="w-4 h-4 text-[#CD7F32]" />
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-[var(--text-muted)]">#{rank}</span>
    </div>
  );
}

/* ── Candidate Row (expandable) ─────────────────────────────────────────── */
function CandidateRow({
  c, jobTitle, isWinner,
}: { c: RankedCandidate; jobTitle: string; isWinner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = c.overall_score >= 70 ? 'var(--success)' : c.overall_score >= 45 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className={`rounded-[var(--radius-lg)] border transition-all duration-200 overflow-hidden shadow-sm
      ${isWinner
        ? 'border-[var(--success)]/40 bg-[var(--success-muted)]'
        : 'border-[var(--border)] bg-[var(--bg-surface)]'
      }`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[var(--bg-elevated)] transition-colors duration-150"
      >
        <RankBadge rank={c.rank} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--text-primary)] truncate">{c.name}</span>
            {isWinner && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-0.5 rounded-full flex-shrink-0">
                <Trophy className="w-3 h-3" /> Top Pick
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate font-mono">
            {c.experience_years}y exp · {c.education}
          </p>
        </div>

        {/* Score ring */}
        <div className="hidden sm:block flex-shrink-0">
          <ScoreRing score={Math.round(c.overall_score)} size={48} />
        </div>

        {/* Score text on mobile */}
        <span className="sm:hidden text-lg font-bold flex-shrink-0" style={{ color: scoreColor }}>
          {Math.round(c.overall_score)}
        </span>

        {/* Match & Missing pills */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--success)]">
            <CheckCircle2 className="w-4 h-4" /> {c.matched_skills.length}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--error)]">
            <XCircle className="w-4 h-4" /> {c.missing_skills.length}
          </span>
        </div>

        <div className="flex-shrink-0 text-[var(--text-muted)] ml-2">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-[var(--border)] bg-[var(--bg-surface)] space-y-4 animate-fade-in-up">
          {/* Score bar */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Match Score — {jobTitle}
            </p>
            <ProgressBar 
              value={c.overall_score} 
              color={isWinner ? 'var(--success)' : undefined}
              showValue
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {c.matched_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--success)] mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Matched ({c.matched_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.matched_skills.slice(0, 8).map((s, i) => <SkillChip key={s} label={s} variant="matched" delayIndex={i} />)}
                  {c.matched_skills.length > 8 && (
                    <span className="text-xs font-medium text-[var(--text-muted)] self-center ml-1">+{c.matched_skills.length - 8} more</span>
                  )}
                </div>
              </div>
            )}

            {c.missing_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--error)] mb-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Missing ({c.missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.missing_skills.slice(0, 6).map((s, i) => <SkillChip key={s} label={s} variant="missing" delayIndex={i} />)}
                  {c.missing_skills.length > 6 && (
                    <span className="text-xs font-medium text-[var(--text-muted)] self-center ml-1">+{c.missing_skills.length - 6} more</span>
                  )}
                </div>
              </div>
            )}

            {c.unique_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--warning)] mb-2 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Unique Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.unique_skills.map((s, i) => <SkillChip key={s} label={s} variant="neutral" delayIndex={i} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Candidate multi-select checkbox list ───────────────────────────────── */
function CandidateSelector({
  candidates,
  selected,
  onToggle,
}: {
  candidates: StoredCandidate[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => candidates.filter(c =>
      (c.name ?? c.id).toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [candidates, search]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search candidates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-md)] text-sm
            bg-[var(--bg-elevated)] border border-[var(--border)]
            text-[var(--text-primary)] placeholder-[var(--text-muted)]
            focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
        />
      </div>

      {/* Candidate list */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filtered.map(c => {
          const isSelected = selected.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left
                transition-all duration-150 border
                ${isSelected
                  ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
            >
              {/* Checkbox */}
              <div className={`w-4 h-4 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 border transition-colors
                ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--text-muted)] bg-[var(--bg-elevated)]'}`}>
                {isSelected && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-sm font-semibold truncate text-[var(--text-primary)]">{c.name ?? 'Unnamed Candidate'}</span>
                {c.email && <span className="text-xs text-[var(--text-muted)] font-mono truncate">{c.email}</span>}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No candidates match your search</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-1">
        <span className="font-semibold">{selected.size} selected <span className="font-normal opacity-70">out of {candidates.length}</span></span>
        {selected.size > 0 && (
          <button
            onClick={() => candidates.forEach(c => selected.has(c.id) && onToggle(c.id))}
            className="text-[var(--error)] hover:underline font-medium transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function CandidateCompare({ hideHeader = false }: { hideHeader?: boolean }) {
  const [mode, setMode] = useState<'multi' | 'duo'>('multi');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [candidate1, setCandidate1] = useState('');
  const [candidate2, setCandidate2] = useState('');
  const [selectedJob, setSelectedJob] = useState('senior_fullstack');
  const [duoResult, setDuoResult] = useState<CompareResponse | null>(null);
  const [multiResult, setMultiResult] = useState<MultiCompareResponse | null>(null);

  const {
    data: candidates = [],
    isLoading: loadingCandidates,
    isError: candidatesError,
    refetch: refetchCandidates,
  } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => fetchCandidates(100),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    initialData: [
      { id: 'senior_fullstack', title: 'Senior Full-Stack Engineer', company: 'TechCorp Inc.' },
      { id: 'ml_engineer', title: 'Machine Learning Engineer', company: 'AI Solutions Ltd.' },
      { id: 'frontend_developer', title: 'Senior Frontend Developer', company: 'DesignHub Co.' },
    ],
    staleTime: 60_000,
  });

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const duoMutation = useMutation({
    mutationFn: () => compareCandidates(candidate1, candidate2, selectedJob),
    onSuccess: data => { setDuoResult(data); setMultiResult(null); },
  });

  const multiMutation = useMutation({
    mutationFn: () => compareCandidatesMulti(Array.from(selectedIds), selectedJob),
    onSuccess: data => { setMultiResult(data); setDuoResult(null); },
  });

  const canDuo = candidate1 && candidate2 && candidate1 !== candidate2 && selectedJob;
  const canMulti = selectedIds.size >= 2 && selectedJob;

  function candidateLabel(c: StoredCandidate) {
    return c.name ?? c.id.slice(0, 8) + '...';
  }

  const activeResult = mode === 'multi' ? multiResult : duoResult;
  const isPending = mode === 'multi' ? multiMutation.isPending : duoMutation.isPending;
  const isError = mode === 'multi' ? multiMutation.isError : duoMutation.isError;
  const error = mode === 'multi' ? multiMutation.error : duoMutation.error;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full">

      {/* Mode toggle shown in page header area when hideHeader is true */}
      {hideHeader && (
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm">
            {(['multi', 'duo'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                  ${mode === m
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
              >
                {m === 'multi' ? 'Leaderboard (N)' : 'Head-to-Head (1v1)'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT: Config Panel (35%) ── */}
        <div className="lg:col-span-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card flex flex-col gap-6 sticky top-24">
          
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-muted)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent-bright)]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-[var(--text-primary)]">Configuration</h2>
              <p className="text-xs text-[var(--text-secondary)]">Setup your comparison</p>
            </div>
          </div>

          {loadingCandidates ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="text-sm font-medium text-[var(--text-muted)]">Loading candidates...</span>
            </div>
          ) : candidatesError ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--error-muted)] border border-[var(--error)]/20 p-4">
              <p className="text-sm font-bold text-[var(--error)] mb-1">Backend unreachable</p>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Could not connect to the API. Make sure the FastAPI server is running.
              </p>
              <button
                onClick={() => refetchCandidates()}
                className="w-full py-2 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--error)] text-white hover:brightness-110 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : candidates.length < 2 ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--warning-muted)] border border-[var(--warning)]/20 p-4">
              <p className="text-sm font-bold text-[var(--warning)] mb-2">Not enough candidates</p>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                You need at least 2 candidates to run a comparison. Head over to the Analyze page to process more resumes.
              </p>
              <button
                onClick={() => refetchCandidates()}
                className="w-full py-2 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--warning)] text-white hover:brightness-110 transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Candidate selection */}
              {mode === 'multi' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                    Select Candidates <span className="lowercase font-normal opacity-70">(2-50)</span>
                  </label>
                  <CandidateSelector
                    candidates={candidates}
                    selected={selectedIds}
                    onToggle={toggleCandidate}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent-bright)] mb-2">
                      Candidate A
                    </label>
                    <select
                      value={candidate1}
                      onChange={e => setCandidate1(e.target.value)}
                      className="w-full px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium
                        bg-[var(--bg-elevated)] border border-[var(--border)]
                        text-[var(--text-primary)]
                        focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                        transition-colors duration-200"
                    >
                      <option value="">Select a candidate...</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id} disabled={c.id === candidate2}>
                          {candidateLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 opacity-50">
                    <div className="flex-1 h-px bg-[var(--border-strong)]" />
                    <span className="text-xs font-black text-[var(--text-muted)]">VS</span>
                    <div className="flex-1 h-px bg-[var(--border-strong)]" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--violet)] mb-2">
                      Candidate B
                    </label>
                    <select
                      value={candidate2}
                      onChange={e => setCandidate2(e.target.value)}
                      className="w-full px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium
                        bg-[var(--bg-elevated)] border border-[var(--border)]
                        text-[var(--text-primary)]
                        focus:outline-none focus:border-[var(--violet)] focus:ring-1 focus:ring-[var(--violet)]
                        transition-colors duration-200"
                    >
                      <option value="">Select a candidate...</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id} disabled={c.id === candidate1}>
                          {candidateLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Job selector */}
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Target Role
                </label>
                <select
                  value={selectedJob}
                  onChange={e => setSelectedJob(e.target.value)}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium
                    bg-[var(--bg-elevated)] border border-[var(--border)]
                    text-[var(--text-primary)]
                    focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                    transition-colors duration-200"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                  ))}
                </select>
              </div>

              {/* Compare Button */}
              <button
                onClick={() => mode === 'multi' ? multiMutation.mutate() : duoMutation.mutate()}
                disabled={mode === 'multi' ? (!canMulti || isPending) : (!canDuo || isPending)}
                className={`
                  w-full py-3.5 rounded-[var(--radius-md)] font-bold text-sm
                  flex items-center justify-center gap-2 mt-2
                  transition-all duration-200 shadow-sm
                  ${(mode === 'multi' ? !canMulti : !canDuo) || isPending
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
                    : 'bg-[var(--accent)] text-white hover:brightness-110 shadow-accent active:scale-[0.98]'
                  }
                `}
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4" />
                    {mode === 'multi'
                      ? `Rank ${selectedIds.size > 0 ? selectedIds.size : ''} Candidates`
                      : 'Run 1v1 Comparison'
                    }
                  </>
                )}
              </button>

              {isError && (
                <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--error-muted)] border border-[var(--error)]/20">
                  <p className="text-xs text-[var(--error)] font-medium text-center">
                    {(error as Error)?.message || 'Comparison failed. Please try again.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Results (65%) ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* MULTI results */}
          {multiResult && mode === 'multi' && (
            <div className="flex flex-col gap-6 animate-fade-in-up">

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Candidates Analyzed', value: multiResult.ranked_candidates.length, icon: Users, color: 'var(--accent-bright)' },
                  { label: 'Highest Match Score', value: `${Math.round(multiResult.ranked_candidates[0]?.overall_score ?? 0)}%`, icon: Trophy, color: 'var(--success)' },
                  { label: 'Average Skill Coverage', value: `${multiResult.comparison.skill_coverage_avg}%`, icon: BarChart3, color: 'var(--warning)' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold text-[var(--text-primary)] leading-none mb-1">{value}</p>
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className="bg-[var(--bg-surface)] border border-[var(--accent)]/30 rounded-[var(--radius-lg)] p-6 shadow-[0_0_15px_var(--accent-muted)]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[var(--accent-bright)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-[var(--accent-bright)] uppercase tracking-wider mb-2">
                      AI Recommendation Analysis
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                      {multiResult.comparison.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[var(--warning)]" />
                    <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Ranked Leaderboard
                    </h3>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">Click rows to expand details</span>
                </div>

                <div className="p-4 space-y-3 bg-[var(--bg-elevated)]">
                  {multiResult.ranked_candidates.map(c => (
                    <CandidateRow
                      key={c.candidate_id}
                      c={c}
                      jobTitle={multiResult.job_title}
                      isWinner={c.candidate_id === multiResult.comparison.winner_id}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DUO results */}
          {duoResult && mode === 'duo' && (() => {
            const c1 = duoResult.candidates[0];
            const c2 = duoResult.candidates[1];
            const winner = duoResult.comparison.winner;
            return (
              <div className="flex flex-col gap-6 animate-fade-in-up">

                {/* Score comparison */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Head-to-Head Match Scores
                    </h3>
                    <div className="ml-auto flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                      <span>Target:</span>
                      <span className="px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border)]">{duoResult.job_title}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    {/* VS Divider for desktop */}
                    <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border-strong)] items-center justify-center text-[10px] font-black text-[var(--text-muted)] z-10">
                      VS
                    </div>

                    {[c1, c2].map((c, i) => (
                      <div key={i} className={`p-5 rounded-[var(--radius-md)] border ${c.candidate_id === winner ? 'bg-[var(--success-muted)] border-[var(--success)]/30' : 'bg-[var(--bg-elevated)] border-[var(--border)]'}`}>
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h4 className="text-lg font-bold text-[var(--text-primary)]">{c.name}</h4>
                            <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">{c.experience_years}y exp · {c.education}</p>
                            {c.candidate_id === winner && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-full">
                                <Trophy className="w-3 h-3" /> Winner
                              </span>
                            )}
                          </div>
                          <ScoreRing score={Math.round(c.overall_score)} size={64} />
                        </div>
                        <ProgressBar value={Math.round(c.overall_score)} color={c.candidate_id === winner ? 'var(--success)' : 'var(--accent)'} />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4 text-[var(--warning)]" />
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Match score difference:</span>
                    <span className="text-sm font-bold px-3 py-1 bg-[var(--warning-muted)] text-[var(--warning)] rounded-full">
                      {duoResult.comparison.score_diff} pts
                    </span>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-[var(--bg-surface)] border border-[var(--accent)]/30 rounded-[var(--radius-lg)] p-6 shadow-[0_0_15px_var(--accent-muted)]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-muted)] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-[var(--accent-bright)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold text-[var(--accent-bright)] uppercase tracking-wider mb-2">
                        AI Verdict
                      </h3>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                        {duoResult.comparison.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skill Diff */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
                  <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider mb-5 border-b border-[var(--border)] pb-3">
                    Skill Comparison Breakdown
                  </h3>
                  
                  <div className="space-y-6">
                    {duoResult.comparison.shared_skills.length > 0 && (
                      <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--success)] mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> 
                          Shared Skills ({duoResult.comparison.shared_skills.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {duoResult.comparison.shared_skills.map((s, i) => <SkillChip key={s} label={s} variant="matched" delayIndex={i} />)}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {duoResult.comparison.skills_only_in_1.length > 0 && (
                        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-bright)] mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Unique to {c1.name.split(' ')[0]} ({duoResult.comparison.skills_only_in_1.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {duoResult.comparison.skills_only_in_1.map((s, i) => <SkillChip key={s} label={s} variant="neutral" delayIndex={i} />)}
                          </div>
                        </div>
                      )}
                      
                      {duoResult.comparison.skills_only_in_2.length > 0 && (
                        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--violet)] mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Unique to {c2.name.split(' ')[0]} ({duoResult.comparison.skills_only_in_2.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {duoResult.comparison.skills_only_in_2.map((s, i) => <SkillChip key={s} label={s} variant="neutral" delayIndex={i} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Empty state */}
          {!activeResult && !isPending && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-12 shadow-card flex flex-col items-center justify-center gap-4 flex-1 min-h-[400px]">
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-inner flex items-center justify-center mb-2">
                <GitCompare className="w-10 h-10 text-[var(--accent-bright)]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">Ready to Compare</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm text-center leading-relaxed">
                {mode === 'multi'
                  ? 'Select 2 to 50 candidates from the list, choose a target role, and click Rank to see the leaderboard.'
                  : 'Select exactly two candidates and a target role to run a detailed head-to-head comparison.'
                }
              </p>
            </div>
          )}

          {/* Loading state */}
          {isPending && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-12 shadow-card flex flex-col items-center justify-center gap-5 flex-1 min-h-[400px]">
              <div className="relative mb-2">
                <div className="w-20 h-20 rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-b-[var(--violet)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--text-primary)]">Ranking candidates...</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">Running semantic scoring algorithms across all skills and experience.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
