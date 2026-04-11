import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, GitCompare, User, Mail, Phone, Briefcase,
  GraduationCap, Award, Target, CheckCircle2, XCircle, Copy, Check,
} from 'lucide-react';
import { fetchCandidateById } from '@/lib/api';
import type { ParseResponse } from '@/types';
import { useMemo, useState } from 'react';

/* ── Score Ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Match</span>
      </div>
    </div>
  );
}

/* ── Skill badge ───────────────────────────────────────────────────── */
function SkillBadge({ skill, matched }: { skill: string; matched: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105
      ${matched
        ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/25'
        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
      }`}>
      {matched && <CheckCircle2 className="w-3 h-3" />}
      {skill}
    </span>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => fetchCandidateById(id!),
    enabled: !!id,
  });

  // The API returns the full ParseResponse stored dict
  const data = rawData as ParseResponse | undefined;

  const matchedSet = useMemo(
    () => new Set((data?.skill_overlap?.matched ?? []).map(s => s.toLowerCase())),
    [data?.skill_overlap?.matched]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(id!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading candidate…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-error)]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-base font-bold text-[var(--color-error)] mb-2">Candidate Not Found</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">
            Could not retrieve data for ID: <span className="font-mono">{id}</span>
          </p>
          <button
            onClick={() => navigate('/candidates')}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  const pd = data.parsed_data;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Candidates
          </button>
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            <span className="text-xs font-mono text-[var(--color-text-muted)]">{id?.slice(0, 16)}…</span>
            <button onClick={handleCopy} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)] transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate('/compare')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-accent)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] transition-all duration-200"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Candidates
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col gap-5 animate-fade-in-up">

          {/* ── Header card ── */}
          <div className="glass-card p-6 flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-[var(--color-accent-light)]" />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] truncate">
                  {pd?.name || 'Unknown Candidate'}
                </h1>
              </div>
              {pd?.summary && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed line-clamp-2">{pd.summary}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {pd?.email && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Mail className="w-3.5 h-3.5" />{pd.email}
                  </span>
                )}
                {pd?.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Phone className="w-3.5 h-3.5" />{pd.phone}
                  </span>
                )}
              </div>
              {data.job_description && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] inline-block">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Matched Against</span>
                  <p className="text-sm font-medium text-[var(--color-accent-light)]">
                    {data.job_description.title}
                    <span className="text-[var(--color-text-muted)] font-normal ml-1.5">at {data.job_description.company}</span>
                  </p>
                </div>
              )}
            </div>
            {data.match_score !== undefined && <ScoreRing score={data.match_score} />}
          </div>

          {/* ── Skills ── */}
          {(pd?.technical_skills?.length ?? 0) > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[var(--color-cyan)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">Technical Skills</h2>
                <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                  {data.skill_overlap?.matched?.length ?? 0}/{data.job_description?.required_skills?.length ?? 0} matched
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pd.technical_skills.map(s => (
                  <SkillBadge key={s} skill={s} matched={matchedSet.has(s.toLowerCase())} />
                ))}
              </div>
              {(data.skill_overlap?.missing?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
                    <span className="text-xs font-medium text-[var(--color-error)]">Missing Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.skill_overlap.missing.map(s => (
                      <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-error)]/10 text-[var(--color-error)]/70 border border-[var(--color-error)]/15">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── Experience ── */}
            {(pd?.experience?.length ?? 0) > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-[var(--color-violet)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">Experience</h2>
                </div>
                <div className="space-y-4">
                  {pd.experience.map((exp, i) => (
                    <div key={i} className="relative pl-4 border-l-2 border-[var(--color-border)] animate-slide-in-right" style={{ animationDelay: `${i * 0.1}s` }}>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{exp.title}</h3>
                      <p className="text-xs text-[var(--color-accent-light)]">
                        {exp.company}
                        {exp.duration && <span className="text-[var(--color-text-muted)] ml-2">· {exp.duration}</span>}
                      </p>
                      {exp.highlights.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {exp.highlights.slice(0, 3).map((h, j) => (
                            <li key={j} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">• {h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* ── Education ── */}
              {(pd?.education?.length ?? 0) > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4 text-[var(--color-emerald)]" />
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">Education</h2>
                  </div>
                  <div className="space-y-3">
                    {pd.education.map((edu, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-emerald)] mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.degree}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {edu.institution}{edu.year && <span> · {edu.year}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Certifications ── */}
              {(pd?.certifications?.length ?? 0) > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-[var(--color-warning)]" />
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">Certifications</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pd.certifications.map(cert => (
                      <span key={cert} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">{cert}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
