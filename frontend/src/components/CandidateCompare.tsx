import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GitCompare, Trophy, TrendingDown, Users, Sparkles, XCircle } from 'lucide-react';
import { fetchCandidates, fetchJobs, compareCandidates } from '@/lib/api';
import type { CompareResponse, StoredCandidate } from '@/types';

/* ── Animated Score Counter ──────────────────────────────────────────────── */

function AnimatedScore({ score, isWinner }: { score: number; isWinner: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <span
      className="text-5xl font-mono font-medium tabular-nums"
      style={{ color: isWinner ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
    >
      {display}
    </span>
  );
}

/* ── Score Bar (horizontal) ──────────────────────────────────────────────── */

function ScoreBar({ score, winner }: { score: number; winner: boolean }) {
  const color = winner ? 'var(--color-accent)' : 'var(--color-text-muted)';
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Skill display (inline, amber underline) ─────────────────────────────── */

function SkillInline({ skill, variant }: { skill: string; variant: 'unique' | 'shared' | 'missing' }) {
  if (variant === 'shared') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono text-[var(--color-text-primary)]" style={{ border: '1px solid rgba(245, 166, 35, 0.25)', borderBottom: '2px solid rgba(245, 166, 35, 0.5)', marginRight: '8px', marginBottom: '6px' }}>
        {skill}
      </span>
    );
  }
  if (variant === 'unique') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono text-[var(--color-accent)]" style={{ border: '1px solid rgba(245, 166, 35, 0.2)', borderBottom: '2px solid rgba(245, 166, 35, 0.3)', marginRight: '8px', marginBottom: '6px' }}>
        {skill}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-[var(--color-error)]/70 line-through" style={{ border: '1px solid rgba(199, 91, 74, 0.25)', marginRight: '8px', marginBottom: '6px' }}>
      <XCircle className="w-3 h-3 flex-shrink-0" style={{ textDecoration: 'none' }} />
      {skill}
    </span>
  );
}

/* ── Main Compare Component ──────────────────────────────────────────────── */

export default function CandidateCompare() {
  const [candidate1, setCandidate1] = useState('');
  const [candidate2, setCandidate2] = useState('');
  const [selectedJob, setSelectedJob] = useState('senior_fullstack');
  const [result, setResult] = useState<CompareResponse | null>(null);

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => fetchCandidates(100),
    staleTime: 30_000,
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

  const mutation = useMutation({
    mutationFn: () => compareCandidates(candidate1, candidate2, selectedJob),
    onSuccess: (data) => setResult(data),
  });

  const canCompare = candidate1 && candidate2 && candidate1 !== candidate2 && selectedJob;

  const winner = result?.comparison.winner;
  const c1 = result?.candidates[0];
  const c2 = result?.candidates[1];

  function candidateLabel(c: StoredCandidate) {
    return c.name ?? c.id.slice(0, 8) + '…';
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-lg font-display font-bold text-[var(--color-text-primary)] tracking-wide">
            Compare Candidates
          </h2>
        </div>
        <p className="text-xs font-mono text-[var(--color-text-muted)] mb-4">
          Head-to-head comparison against any job description.
        </p>

        {/* Candidate Selectors */}
        {loadingCandidates ? (
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] py-2">
            <div className="w-3 h-3 border border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
            Loading stored candidates…
          </div>
        ) : candidates.length < 2 ? (
          <div className="rounded bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 p-4 text-xs font-mono text-[var(--color-accent)]">
            <p className="font-medium mb-1">No candidates stored yet</p>
            <p className="text-[var(--color-text-muted)]">Upload & analyze at least 2 resumes first, or run <code className="font-mono bg-[var(--color-bg-tertiary)] px-1 rounded text-[var(--color-accent)]">python scripts/seed_demo.py</code> to seed demo data.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Candidate A */}
            <div>
              <label className="block text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-accent)] mb-1.5">
                Candidate A
              </label>
              <select
                value={candidate1}
                onChange={(e) => setCandidate1(e.target.value)}
                className="w-full rounded text-sm font-mono
                  bg-[var(--color-bg-tertiary)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-accent)]/50
                  transition-colors duration-200"
                style={{ padding: '10px 14px', border: '1px solid rgba(245, 166, 35, 0.3)' }}
              >
                <option value="">Select a candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === candidate2}>
                    {candidateLabel(c)} {c.email ? `· ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* VS divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              <span className="text-[9px] font-mono font-black text-[var(--color-accent)]/40 tracking-[0.3em]">VS</span>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            </div>

            {/* Candidate B */}
            <div>
              <label className="block text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-violet)] mb-1.5">
                Candidate B
              </label>
              <select
                value={candidate2}
                onChange={(e) => setCandidate2(e.target.value)}
                className="w-full rounded text-sm font-mono
                  bg-[var(--color-bg-tertiary)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-violet)]/50
                  transition-colors duration-200"
                style={{ padding: '10px 14px', border: '1px solid rgba(245, 166, 35, 0.3)' }}
              >
                <option value="">Select a candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === candidate1}>
                    {candidateLabel(c)} {c.email ? `· ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Job selector */}
            <div>
              <label className="block text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1.5">
                Job Description
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full rounded text-sm font-mono
                  bg-[var(--color-bg-tertiary)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-accent)]/50
                  transition-colors duration-200"
                style={{ padding: '10px 14px', border: '1px solid rgba(245, 166, 35, 0.3)' }}
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => mutation.mutate()}
              disabled={!canCompare || mutation.isPending}
              className={`
                relative w-full rounded font-mono font-medium text-sm
                flex items-center justify-center gap-2 mt-1 border
                transition-all duration-300
                ${!canCompare || mutation.isPending
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed'
                  : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/60 active:scale-[0.99]'
                }
              `}
              style={{ padding: '14px' }}
            
            >
              {mutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                  Comparing…
                </>
              ) : (
                <>
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare Candidates
                </>
              )}
            </button>

            {mutation.isError && (
              <p className="text-xs font-mono text-[var(--color-error)] text-center">
                {(mutation.error as Error)?.message || 'Comparison failed. Please try again.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Results — side-by-side with center divider */}
      {result && c1 && c2 && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          {/* Score Comparison — side by side */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
              <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
                Match Scores — {result.job_title}
              </h3>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr]">
              {/* Candidate 1 */}
              <div className="p-5 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3 h-3 text-[var(--color-accent)]" />
                  <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] truncate max-w-[140px]">{c1.name}</span>
                  {c1.candidate_id === winner && (
                    <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[var(--color-accent)]">
                      <Trophy className="w-2.5 h-2.5" /> WIN
                    </span>
                  )}
                </div>
                <AnimatedScore score={c1.overall_score} isWinner={c1.candidate_id === winner} />
                <ScoreBar score={c1.overall_score} winner={c1.candidate_id === winner} />
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-2">
                  {c1.experience_years}y exp · {c1.education}
                </p>
              </div>

              {/* Center divider */}
              <div className="w-px bg-[var(--color-border)] flex flex-col items-center justify-center relative">
                <div className="absolute bg-[var(--color-bg-card)] px-0.5 py-2">
                  <span className="text-[9px] font-mono font-bold text-[var(--color-text-muted)] tracking-widest writing-vertical">
                    VS
                  </span>
                </div>
              </div>

              {/* Candidate 2 */}
              <div className="p-5 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3 h-3 text-[var(--color-violet)]" />
                  <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] truncate max-w-[140px]">{c2.name}</span>
                  {c2.candidate_id === winner && (
                    <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[var(--color-accent)]">
                      <Trophy className="w-2.5 h-2.5" /> WIN
                    </span>
                  )}
                </div>
                <AnimatedScore score={c2.overall_score} isWinner={c2.candidate_id === winner} />
                <ScoreBar score={c2.overall_score} winner={c2.candidate_id === winner} />
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-2">
                  {c2.experience_years}y exp · {c2.education}
                </p>
              </div>
            </div>

            {/* Score diff */}
            <div className="px-5 py-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                Δ Score:
              </span>
              <span className="text-xs font-mono font-bold text-[var(--color-accent)] tabular-nums">
                {result.comparison.score_diff} pts
              </span>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-card p-5 border-l-2 border-l-[var(--color-accent)]">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-mono font-medium uppercase tracking-[0.2em] text-[var(--color-accent)] mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm font-mono text-[var(--color-text-secondary)] leading-relaxed">
                  {result.comparison.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="glass-card p-5" style={{ marginTop: '24px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <TrendingDown className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
                Skill Breakdown
              </h3>
            </div>

            <div className="space-y-4">
              {result.comparison.shared_skills.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-accent)] mb-2">
                    Shared Skills ({result.comparison.shared_skills.length})
                  </p>
                  <div className="flex flex-wrap">
                    {result.comparison.shared_skills.map((s) => (
                      <SkillInline key={s} skill={s} variant="shared" />
                    ))}
                  </div>
                </div>
              )}

              {result.comparison.skills_only_in_1.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-accent)] mb-2">
                    Only in {c1.name} ({result.comparison.skills_only_in_1.length})
                  </p>
                  <div className="flex flex-wrap">
                    {result.comparison.skills_only_in_1.map((s) => (
                      <SkillInline key={s} skill={s} variant="unique" />
                    ))}
                  </div>
                </div>
              )}

              {result.comparison.skills_only_in_2.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-violet)] mb-2">
                    Only in {c2.name} ({result.comparison.skills_only_in_2.length})
                  </p>
                  <div className="flex flex-wrap">
                    {result.comparison.skills_only_in_2.map((s) => (
                      <SkillInline key={s} skill={s} variant="unique" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Per-candidate matched/missing — side by side */}
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-[1fr_1px_1fr]">
              {[c1, c2].map((c, i) => (
                <div key={i} className="contents">
                  {/* Amber divider between candidates */}
                  {i === 1 && (
                    <div style={{ backgroundColor: 'rgba(245, 166, 35, 0.2)', width: '1px' }} />
                  )}
                  <div style={{ padding: '16px 20px' }}>
                    <p className="text-[9px] font-mono font-medium uppercase tracking-[0.15em]
                      text-[var(--color-text-muted)] truncate" style={{ marginBottom: '12px' }}>{c.name}</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-mono text-[var(--color-accent)] font-medium uppercase tracking-[0.1em]" style={{ marginBottom: '8px' }}>
                          Matched ({c.matched_skills.length})
                        </p>
                        <div className="flex flex-wrap">
                          {c.matched_skills.slice(0, 5).map((s) => (
                            <span key={s} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-accent)]" style={{ border: '1px solid rgba(245, 166, 35, 0.2)', marginRight: '6px', marginBottom: '4px' }}>{s}</span>
                          ))}
                          {c.matched_skills.length > 5 && (
                            <span className="text-[10px] font-mono text-[var(--color-text-muted)]" style={{ padding: '2px 0' }}>+{c.matched_skills.length - 5}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-[var(--color-error)] font-medium uppercase tracking-[0.1em]" style={{ marginBottom: '8px' }}>
                          Missing ({c.missing_skills.length})
                        </p>
                        <div className="flex flex-wrap">
                          {c.missing_skills.slice(0, 5).map((s) => (
                            <span key={s} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-error)]/60 line-through" style={{ border: '1px solid rgba(199, 91, 74, 0.2)', marginRight: '6px', marginBottom: '4px' }}>{s}</span>
                          ))}
                          {c.missing_skills.length > 5 && (
                            <span className="text-[10px] font-mono text-[var(--color-text-muted)]" style={{ padding: '2px 0' }}>+{c.missing_skills.length - 5}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
