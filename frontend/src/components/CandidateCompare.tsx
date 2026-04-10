import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GitCompare, Trophy, TrendingUp, TrendingDown, Minus, Users, Sparkles } from 'lucide-react';
import { fetchCandidates, fetchJobs, compareCandidates } from '@/lib/api';
import type { CompareResponse, StoredCandidate } from '@/types';

function ScoreBar({ score, winner }: { score: number; winner: boolean }) {
  const color = winner ? 'var(--color-success)' : 'var(--color-accent)';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-12 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function SkillPill({ skill, variant }: { skill: string; variant: 'unique' | 'shared' | 'missing' }) {
  const styles = {
    unique: 'bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border-[var(--color-accent)]/20',
    shared: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    missing: 'bg-[var(--color-error)]/10 text-[var(--color-error)]/70 border-[var(--color-error)]/15',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[variant]}`}>
      {skill}
    </span>
  );
}

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
    return c.name ?? c.id.slice(0, 8) + '...';
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="w-4 h-4 text-[var(--color-violet)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            Candidate Compare
          </h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Compare two analyzed candidates head-to-head against any job description.
        </p>

        {/* Candidate Selectors */}
        {loadingCandidates ? (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] py-2">
            <div className="w-3 h-3 border border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
            Loading stored candidates...
          </div>
        ) : candidates.length < 2 ? (
          <div className="rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-4 text-xs text-[var(--color-warning)]">
            <p className="font-semibold mb-1">No candidates stored yet</p>
            <p>Upload & analyze at least 2 resumes first, or run <code className="font-mono bg-black/20 px-1 rounded">python scripts/seed_demo.py</code> to seed demo data.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Candidate A */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-1.5">
                Candidate A
              </label>
              <select
                value={candidate1}
                onChange={(e) => setCandidate1(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm
                  bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-accent)]
                  transition-colors duration-200"
              >
                <option value="">Select a candidate...</option>
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
              <span className="text-[10px] font-black text-[var(--color-text-muted)] tracking-widest">VS</span>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            </div>

            {/* Candidate B */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-violet)] mb-1.5">
                Candidate B
              </label>
              <select
                value={candidate2}
                onChange={(e) => setCandidate2(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm
                  bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-violet)]
                  transition-colors duration-200"
              >
                <option value="">Select a candidate...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === candidate1}>
                    {candidateLabel(c)} {c.email ? `· ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Job selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Job Description
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm
                  bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-accent)]
                  transition-colors duration-200"
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
                relative w-full py-3 rounded-xl font-semibold text-sm
                flex items-center justify-center gap-2 mt-1
                transition-all duration-300
                ${!canCompare || mutation.isPending
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-accent)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Compare Candidates
                </>
              )}
            </button>

            {mutation.isError && (
              <p className="text-xs text-[var(--color-error)] text-center">
                {(mutation.error as Error)?.message || 'Comparison failed. Please try again.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {result && c1 && c2 && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          {/* Scores */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Match Scores — {result.job_title}
              </h3>
            </div>
            <div className="space-y-4">
              {/* Candidate 1 */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="w-3 h-3 text-[var(--color-accent-light)]" />
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{c1.name}</span>
                  {c1.candidate_id === winner && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[var(--color-success)]
                      bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full">
                      <Trophy className="w-2.5 h-2.5" /> WINNER
                    </span>
                  )}
                </div>
                <ScoreBar score={c1.overall_score} winner={c1.candidate_id === winner} />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  {c1.experience_years}y exp · {c1.education}
                </p>
              </div>

              {/* Candidate 2 */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="w-3 h-3 text-[var(--color-violet)]" />
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{c2.name}</span>
                  {c2.candidate_id === winner && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[var(--color-success)]
                      bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full">
                      <Trophy className="w-2.5 h-2.5" /> WINNER
                    </span>
                  )}
                </div>
                <ScoreBar score={c2.overall_score} winner={c2.candidate_id === winner} />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  {c2.experience_years}y exp · {c2.education}
                </p>
              </div>

              {/* Score diff */}
              <div className="mt-2 pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
                <Minus className="w-3 h-3 text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Score difference:
                </span>
                <span className="text-xs font-bold text-[var(--color-accent-light)]">
                  {result.comparison.score_diff} pts
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-card p-5 border border-[var(--color-accent)]/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-violet)]/20
                flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {result.comparison.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Skill Diff */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-[var(--color-cyan)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Skill Breakdown
              </h3>
            </div>

            <div className="space-y-4">
              {result.comparison.shared_skills.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)] mb-2">
                    Shared Skills ({result.comparison.shared_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.comparison.shared_skills.map((s) => (
                      <SkillPill key={s} skill={s} variant="shared" />
                    ))}
                  </div>
                </div>
              )}

              {result.comparison.skills_only_in_1.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] mb-2">
                    Only in {c1.name} ({result.comparison.skills_only_in_1.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.comparison.skills_only_in_1.map((s) => (
                      <SkillPill key={s} skill={s} variant="unique" />
                    ))}
                  </div>
                </div>
              )}

              {result.comparison.skills_only_in_2.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-violet)] mb-2">
                    Only in {c2.name} ({result.comparison.skills_only_in_2.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.comparison.skills_only_in_2.map((s) => (
                      <SkillPill key={s} skill={s} variant="unique" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Matched vs Missing per candidate */}
          <div className="grid grid-cols-2 gap-4">
            {[c1, c2].map((c, i) => (
              <div key={i} className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest
                  text-[var(--color-text-muted)] mb-3 truncate">{c.name}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-[var(--color-success)] font-semibold mb-1">
                      Matched ({c.matched_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.matched_skills.slice(0, 5).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded
                          bg-[var(--color-success)]/10 text-[var(--color-success)]">{s}</span>
                      ))}
                      {c.matched_skills.length > 5 && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">+{c.matched_skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-error)] font-semibold mb-1">
                      Missing ({c.missing_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.missing_skills.slice(0, 5).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded
                          bg-[var(--color-error)]/10 text-[var(--color-error)]/70">{s}</span>
                      ))}
                      {c.missing_skills.length > 5 && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">+{c.missing_skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
