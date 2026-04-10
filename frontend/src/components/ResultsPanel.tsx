import { useMemo } from 'react';
import { User, Mail, Phone, Briefcase, GraduationCap, Award, Target, CheckCircle2, XCircle } from 'lucide-react';
import type { ParseResponse } from '@/types';

interface ResultsPanelProps {
  data: ParseResponse;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  const color = score >= 75
    ? 'var(--color-success)'
    : score >= 50
      ? 'var(--color-warning)'
      : 'var(--color-error)';

  const glowColor = score >= 75
    ? 'var(--color-success-glow)'
    : score >= 50
      ? 'var(--color-warning-glow)'
      : 'var(--color-error-glow)';

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Match</span>
      </div>
    </div>
  );
}

function SkillBadge({ skill, isMatched }: { skill: string; isMatched: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200 hover:scale-105
        ${isMatched
          ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/25'
          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
        }
      `}
    >
      {isMatched && <CheckCircle2 className="w-3 h-3" />}
      {skill}
    </span>
  );
}

export default function ResultsPanel({ data }: ResultsPanelProps) {
  const { parsed_data, match_score, skill_overlap, job_description } = data;

  const matchedSkillsSet = useMemo(
    () => new Set(skill_overlap.matched.map(s => s.toLowerCase())),
    [skill_overlap.matched]
  );

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* ── Header: Candidate Info + Score ───────────────────────────────── */}
      <div className="glass-card p-6 flex items-start gap-6">
        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[var(--color-accent-light)]" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
              {parsed_data.name || 'Unknown Candidate'}
            </h2>
          </div>

          {parsed_data.summary && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed line-clamp-2">
              {parsed_data.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mt-3">
            {parsed_data.email && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Mail className="w-3.5 h-3.5" /> {parsed_data.email}
              </span>
            )}
            {parsed_data.phone && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Phone className="w-3.5 h-3.5" /> {parsed_data.phone}
              </span>
            )}
          </div>

          {/* Job Description being matched */}
          <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
              Matched Against
            </span>
            <p className="text-sm font-medium text-[var(--color-accent-light)]">
              {job_description.title}
              <span className="text-[var(--color-text-muted)] font-normal ml-1.5">
                at {job_description.company}
              </span>
            </p>
          </div>
        </div>

        {/* Score Ring */}
        <ScoreRing score={match_score} />
      </div>

      {/* ── Skills ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-[var(--color-cyan)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            Technical Skills
          </h3>
          <span className="ml-auto text-xs text-[var(--color-text-muted)]">
            {skill_overlap.matched.length}/{job_description.required_skills.length} matched
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {parsed_data.technical_skills.map(skill => (
            <SkillBadge
              key={skill}
              skill={skill}
              isMatched={matchedSkillsSet.has(skill.toLowerCase())}
            />
          ))}
        </div>

        {/* Missing Skills */}
        {skill_overlap.missing.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
              <span className="text-xs font-medium text-[var(--color-error)]">Missing Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skill_overlap.missing.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-[var(--color-error)]/10 text-[var(--color-error)]/70
                    border border-[var(--color-error)]/15"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Experience ── */}
      {parsed_data.experience.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-[var(--color-violet)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Experience
            </h3>
          </div>
          <div className="space-y-4">
            {parsed_data.experience.map((exp, i) => (
              <div
                key={i}
                className="relative pl-4 border-l-2 border-[var(--color-border)]
                  animate-slide-in-right"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {exp.title}
                </h4>
                <p className="text-xs text-[var(--color-accent-light)]">
                  {exp.company}
                  {exp.duration && (
                    <span className="text-[var(--color-text-muted)] ml-2">· {exp.duration}</span>
                  )}
                </p>
                {exp.highlights.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.highlights.slice(0, 3).map((h, j) => (
                      <li key={j} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        • {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {parsed_data.education.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[var(--color-emerald)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Education
            </h3>
          </div>
          <div className="space-y-3">
            {parsed_data.education.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-emerald)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {edu.degree}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {edu.institution}
                    {edu.year && <span> · {edu.year}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ── */}
      {parsed_data.certifications && parsed_data.certifications.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[var(--color-warning)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Certifications
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsed_data.certifications.map(cert => (
              <span
                key={cert}
                className="px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-[var(--color-warning)]/10 text-[var(--color-warning)]
                  border border-[var(--color-warning)]/20"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
