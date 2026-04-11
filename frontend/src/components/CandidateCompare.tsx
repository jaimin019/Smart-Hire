import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GitCompare, Trophy, TrendingUp, Users, Sparkles,
  ChevronDown, ChevronUp, Medal, Crown, Star, BarChart3,
  CheckCircle2, XCircle, Zap,
} from 'lucide-react';
import { fetchCandidates, fetchJobs, compareCandidates, compareCandidatesMulti } from '@/lib/api';
import type {
  CompareResponse, MultiCompareResponse, StoredCandidate, RankedCandidate,
} from '@/types';

/* ── Sub-components ──────────────────────────────────────────────────────── */

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? 'var(--color-success)' : score >= 45 ? 'var(--color-warning)' : 'var(--color-error)';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={4} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%', fill: color, fontSize: size < 50 ? 9 : 11, fontWeight: 700, fontFamily: 'inherit' }}
      >
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ score, winner }: { score: number; winner: boolean }) {
  const color = winner ? 'var(--color-success)' : 'var(--color-accent)';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function SkillPill({ skill, variant }: { skill: string; variant: 'unique' | 'shared' | 'missing' | 'star' }) {
  const styles = {
    unique: 'bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border-[var(--color-accent)]/20',
    shared: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    missing: 'bg-[var(--color-error)]/8 text-[var(--color-error)]/60 border-[var(--color-error)]/12',
    star: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${styles[variant]}`}>
      {skill}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 flex items-center justify-center flex-shrink-0">
      <Crown className="w-3.5 h-3.5 text-[#FFD700]" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
      <Medal className="w-3.5 h-3.5 text-[#C0C0C0]" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-7 h-7 rounded-lg bg-[#CD7F32]/10 border border-[#CD7F32]/20 flex items-center justify-center flex-shrink-0">
      <Medal className="w-3.5 h-3.5 text-[#CD7F32]" />
    </div>
  );
  return (
    <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-[var(--color-text-muted)]">#{rank}</span>
    </div>
  );
}

/* ── Candidate Row (expandable) ─────────────────────────────────────────── */
function CandidateRow({
  c, jobTitle, isWinner,
}: { c: RankedCandidate; jobTitle: string; isWinner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = c.overall_score >= 70 ? 'var(--color-success)' : c.overall_score >= 45 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${isWinner
        ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/4'
        : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/40'
      }`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors duration-150"
      >
        <RankBadge rank={c.rank} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{c.name}</span>
            {isWinner && (
              <span className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <Trophy className="w-2.5 h-2.5" /> Top Pick
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">
            {c.experience_years}y exp · {c.education}
          </p>
        </div>

        {/* Score ring */}
        <div className="hidden sm:block flex-shrink-0">
          <ScoreRing score={Math.round(c.overall_score)} size={44} />
        </div>

        {/* Score text on mobile */}
        <span className="sm:hidden text-sm font-bold flex-shrink-0" style={{ color: scoreColor }}>
          {Math.round(c.overall_score)}
        </span>

        {/* Match & Missing pills */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-success)]">
            <CheckCircle2 className="w-3 h-3" /> {c.matched_skills.length}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-error)]/70">
            <XCircle className="w-3 h-3" /> {c.missing_skills.length}
          </span>
        </div>

        <div className="flex-shrink-0 text-[var(--color-text-muted)]">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border-subtle)] space-y-3 animate-fade-in-up">
          {/* Score bar */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
              Match Score — {jobTitle}
            </p>
            <ScoreBar score={Math.round(c.overall_score)} winner={isWinner} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {c.matched_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)] mb-1.5">
                  Matched ({c.matched_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.matched_skills.slice(0, 8).map(s => <SkillPill key={s} skill={s} variant="shared" />)}
                  {c.matched_skills.length > 8 && (
                    <span className="text-[10px] text-[var(--color-text-muted)] self-center">+{c.matched_skills.length - 8}</span>
                  )}
                </div>
              </div>
            )}

            {c.missing_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-error)]/70 mb-1.5">
                  Missing ({c.missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.missing_skills.slice(0, 6).map(s => <SkillPill key={s} skill={s} variant="missing" />)}
                  {c.missing_skills.length > 6 && (
                    <span className="text-[10px] text-[var(--color-text-muted)] self-center">+{c.missing_skills.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {c.unique_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-warning)] mb-1.5">
                  Unique Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.unique_skills.map(s => <SkillPill key={s} skill={s} variant="star" />)}
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
    <div className="flex flex-col gap-2">
      {/* Search */}
      <input
        type="text"
        placeholder="Search candidates..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs
          bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
          text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150"
      />

      {/* Candidate list */}
      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {filtered.map(c => {
          const isSelected = selected.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
                transition-all duration-150 border
                ${isSelected
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
                }`}
            >
              {/* Checkbox */}
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border
                ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                {isSelected && <span className="text-white text-[9px] font-black">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.name ?? 'Unnamed'}</p>
                {c.email && <p className="text-[10px] text-[var(--color-text-muted)] truncate">{c.email}</p>}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-3">No candidates match</p>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{selected.size} selected of {candidates.length}</span>
        {selected.size > 0 && (
          <button
            onClick={() => candidates.forEach(c => selected.has(c.id) && onToggle(c.id))}
            className="text-[var(--color-error)]/60 hover:text-[var(--color-error)] transition-colors"
          >
            Clear all
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
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto w-full">

      {/* ── Header (hideable when embedded in a page that has its own header) ── */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-violet)]/20 to-[var(--color-accent)]/20 border border-[var(--color-violet)]/20 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-[var(--color-violet)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Candidate Comparison
              </h2>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Rank up to 50 candidates against any job
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            {(['multi', 'duo'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${mode === m
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
              >
                {m === 'multi' ? 'Multi (N)' : '1 vs 1'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode toggle shown in page header area when hideHeader is true */}
      {hideHeader && (
        <div className="flex justify-end">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            {(['multi', 'duo'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${mode === m
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
              >
                {m === 'multi' ? 'Multi (N)' : '1 vs 1'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">

        {/* ── LEFT: Config Panel ── */}
        <div className="glass-card p-5 flex flex-col gap-4 h-fit">

          {loadingCandidates ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-4 justify-center">
              <div className="w-3 h-3 border border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
              Loading candidates...
            </div>
          ) : candidatesError ? (
            <div className="rounded-xl bg-[var(--color-error)]/8 border border-[var(--color-error)]/20 p-4 text-xs text-[var(--color-error)]">
              <p className="font-semibold mb-1">Backend unreachable</p>
              <p className="text-[var(--color-text-muted)] mb-3">
                Could not connect to the API. Make sure the FastAPI server is running:
              </p>
              <code className="block font-mono bg-black/30 px-2 py-1.5 rounded text-[10px] text-[var(--color-text-secondary)] mb-3">
                python backend/main.py
              </code>
              <button
                onClick={() => refetchCandidates()}
                className="w-full py-2 rounded-lg text-xs font-semibold
                  bg-[var(--color-error)]/10 text-[var(--color-error)]
                  hover:bg-[var(--color-error)]/20 transition-colors duration-150"
              >
                Retry Connection
              </button>
            </div>
          ) : candidates.length < 2 ? (
            <div className="rounded-xl bg-[var(--color-warning)]/8 border border-[var(--color-warning)]/20 p-4 text-xs text-[var(--color-warning)]">
              <p className="font-semibold mb-2">No candidates yet</p>
              <div className="space-y-1.5 text-[var(--color-text-muted)]">
                <p className="flex items-start gap-1.5">
                  <span className="text-[var(--color-accent-light)] font-bold flex-shrink-0">1.</span>
                  Go to the <span className="text-[var(--color-accent-light)] font-semibold mx-1">Analyze</span> tab
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-[var(--color-accent-light)] font-bold flex-shrink-0">2.</span>
                  Upload 2+ resumes (use Bulk mode for many at once)
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-[var(--color-accent-light)] font-bold flex-shrink-0">3.</span>
                  Click <span className="text-[var(--color-accent-light)] font-semibold mx-1">Analyze Resume</span> for each
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-warning)]/15">
                <p className="text-[var(--color-text-muted)] mb-1.5">Or seed demo data instantly:</p>
                <code className="block font-mono bg-black/30 px-2 py-1.5 rounded text-[10px] text-[var(--color-text-secondary)] mb-2">
                  python scripts/seed_demo.py
                </code>
                <button
                  onClick={() => refetchCandidates()}
                  className="w-full py-1.5 rounded-lg text-[10px] font-semibold
                    bg-[var(--color-warning)]/10 text-[var(--color-warning)]
                    hover:bg-[var(--color-warning)]/20 transition-colors duration-150"
                >
                  Refresh Candidates
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Candidate selection */}
              {mode === 'multi' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-2">
                    Select Candidates
                    <span className="ml-2 text-[var(--color-text-muted)] normal-case font-normal tracking-normal">
                      (2–50)
                    </span>
                  </label>
                  <CandidateSelector
                    candidates={candidates}
                    selected={selectedIds}
                    onToggle={toggleCandidate}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-1.5">
                      Candidate A
                    </label>
                    <select
                      value={candidate1}
                      onChange={e => setCandidate1(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm
                        bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                        text-[var(--color-text-primary)]
                        focus:outline-none focus:border-[var(--color-accent)]
                        transition-colors duration-200"
                    >
                      <option value="">Select a candidate...</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id} disabled={c.id === candidate2}>
                          {candidateLabel(c)}{c.email ? ` · ${c.email}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                    <span className="text-[10px] font-black text-[var(--color-text-muted)] tracking-widest">VS</span>
                    <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-violet)] mb-1.5">
                      Candidate B
                    </label>
                    <select
                      value={candidate2}
                      onChange={e => setCandidate2(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm
                        bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                        text-[var(--color-text-primary)]
                        focus:outline-none focus:border-[var(--color-violet)]
                        transition-colors duration-200"
                    >
                      <option value="">Select a candidate...</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id} disabled={c.id === candidate1}>
                          {candidateLabel(c)}{c.email ? ` · ${c.email}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Job selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                  Job Description
                </label>
                <select
                  value={selectedJob}
                  onChange={e => setSelectedJob(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm
                    bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                    text-[var(--color-text-primary)]
                    focus:outline-none focus:border-[var(--color-accent)]
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
                  relative w-full py-3 rounded-xl font-semibold text-sm
                  flex items-center justify-center gap-2
                  transition-all duration-300
                  ${(mode === 'multi' ? !canMulti : !canDuo) || isPending
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-accent)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]'
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
                      : 'Compare Candidates'
                    }
                  </>
                )}
              </button>

              {isError && (
                <p className="text-xs text-[var(--color-error)] text-center">
                  {(error as Error)?.message || 'Comparison failed. Please try again.'}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="flex flex-col gap-4">

          {/* MULTI results */}
          {multiResult && mode === 'multi' && (
            <div className="flex flex-col gap-4 animate-fade-in-up">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Candidates', value: multiResult.ranked_candidates.length, icon: Users, color: 'var(--color-accent-light)' },
                  { label: 'Top Score', value: `${Math.round(multiResult.ranked_candidates[0]?.overall_score ?? 0)}`, icon: Star, color: 'var(--color-success)' },
                  { label: 'Avg Coverage', value: `${multiResult.comparison.skill_coverage_avg}%`, icon: BarChart3, color: 'var(--color-cyan)' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="glass-card p-3 text-center">
                    <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{value}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className="glass-card p-4 border border-[var(--color-accent)]/15">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-violet)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-1">
                      AI Recommendation · {multiResult.job_title}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {multiResult.comparison.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[#FFD700]" />
                  <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                    Leaderboard
                  </h3>
                  <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">
                    Click to expand details
                  </span>
                </div>

                <div className="space-y-2">
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
              <div className="flex flex-col gap-4 animate-fade-in-up">

                {/* Score comparison */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                    <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Match Scores — {duoResult.job_title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {[c1, c2].map((c, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-2">
                          <ScoreRing score={Math.round(c.overall_score)} size={52} />
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{c.name}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">{c.experience_years}y exp</p>
                            {c.candidate_id === winner && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-[var(--color-success)] mt-0.5">
                                <Trophy className="w-2.5 h-2.5" /> WINNER
                              </span>
                            )}
                          </div>
                        </div>
                        <ScoreBar score={Math.round(c.overall_score)} winner={c.candidate_id === winner} />
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 truncate">{c.education}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
                    <Zap className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">Score difference:</span>
                    <span className="text-xs font-bold text-[var(--color-accent-light)]">
                      {duoResult.comparison.score_diff} pts
                    </span>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="glass-card p-5 border border-[var(--color-accent)]/15">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-violet)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-1">AI Recommendation</p>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {duoResult.comparison.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skill Diff */}
                <div className="glass-card p-5">
                  <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">Skill Breakdown</h3>
                  <div className="space-y-3">
                    {duoResult.comparison.shared_skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)] mb-2">
                          Shared ({duoResult.comparison.shared_skills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {duoResult.comparison.shared_skills.map(s => <SkillPill key={s} skill={s} variant="shared" />)}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {duoResult.comparison.skills_only_in_1.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-2">
                            Only {c1.name.split(' ')[0]} ({duoResult.comparison.skills_only_in_1.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {duoResult.comparison.skills_only_in_1.map(s => <SkillPill key={s} skill={s} variant="unique" />)}
                          </div>
                        </div>
                      )}
                      {duoResult.comparison.skills_only_in_2.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-violet)] mb-2">
                            Only {c2.name.split(' ')[0]} ({duoResult.comparison.skills_only_in_2.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {duoResult.comparison.skills_only_in_2.map(s => <SkillPill key={s} skill={s} variant="unique" />)}
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
            <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-violet)]/10 to-[var(--color-accent)]/10 flex items-center justify-center">
                <GitCompare className="w-9 h-9 text-[var(--color-violet)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Ready to Compare</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs leading-relaxed">
                  {mode === 'multi'
                    ? 'Select 2 or more candidates from the list, pick a job, and click Rank.'
                    : 'Select two candidates and a job to run a head-to-head comparison.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isPending && (
            <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-[var(--color-violet)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Ranking candidates...</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Semantic scoring in progress</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
