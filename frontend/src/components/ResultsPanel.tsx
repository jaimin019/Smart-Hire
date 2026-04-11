import { useMemo } from 'react';
import { User, Mail, Phone, Briefcase, GraduationCap, Award, Target, XCircle } from 'lucide-react';
import type { ParseResponse } from '@/types';
import MatchGauge from '@/components/MatchGauge';

interface ResultsPanelProps {
  data: ParseResponse;
}

/* ── Skill with amber underline (matched) or red strikethrough (missing) ──── */

function SkillTag({ skill, isMatched }: { skill: string; isMatched: boolean }) {
  if (isMatched) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors duration-200" style={{ border: '1px solid rgba(245, 166, 35, 0.25)', borderBottom: '2px solid rgba(245, 166, 35, 0.5)', marginRight: '8px', marginBottom: '6px' }}>
        {skill}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-mono text-[var(--color-text-muted)]" style={{ border: '1px solid var(--color-border)', marginRight: '8px', marginBottom: '6px' }}>
      {skill}
    </span>
  );
}

function MissingSkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-[var(--color-error)]/70 line-through" style={{ border: '1px solid rgba(199, 91, 74, 0.25)', marginRight: '8px', marginBottom: '6px' }}>
      <XCircle className="w-3 h-3 flex-shrink-0" style={{ textDecoration: 'none' }} />
      {skill}
    </span>
  );
}

export default function ResultsPanel({ data }: ResultsPanelProps) {
  const { personal_info, work_experience, education, skills, certifications, match_score, skill_overlap, job_description } = data;

  const matchedSkillsSet = useMemo(
    () => new Set(skill_overlap.matched.map(s => s.toLowerCase())),
    [skill_overlap.matched]
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* ── Header: Candidate Info + Gauge ────────────────────────────────── */}
      <div className="glass-card p-5 flex items-start gap-5">
        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-display font-bold text-[var(--color-text-primary)] truncate tracking-wide">
              {personal_info.name || 'Unknown Candidate'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            {personal_info.email && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
                <Mail className="w-3 h-3" /> {personal_info.email}
              </span>
            )}
            {personal_info.phone && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
                <Phone className="w-3 h-3" /> {personal_info.phone}
              </span>
            )}
          </div>

          {/* Job Description being matched */}
          <div className="mt-3 px-3 py-2 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Matched Against
            </span>
            <p className="text-sm font-mono text-[var(--color-accent)]">
              {job_description.title}
              <span className="text-[var(--color-text-muted)] font-normal ml-1.5">
                at {job_description.company}
              </span>
            </p>
          </div>
        </div>

        {/* Precision Gauge */}
        <div className="flex-shrink-0" style={{ margin: '16px' }}>
          <MatchGauge score={match_score} />
        </div>
      </div>

      {/* ── Technical Skills ── */}
      <div className="glass-card p-5" style={{ marginTop: '24px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
          <Target className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
            Technical Skills
          </h3>
          <span className="ml-auto text-xs font-mono text-[var(--color-accent)]">
            {skill_overlap.matched.length}/{job_description.required_skills.length}
          </span>
        </div>

        {/* Matched skills — amber underline */}
        <div className="flex flex-wrap" style={{ gap: '0px' }}>
          {skills.map(skill => (
            <SkillTag
              key={skill.raw}
              skill={skill.canonical || skill.raw}
              isMatched={matchedSkillsSet.has((skill.canonical || skill.raw).toLowerCase())}
            />
          ))}
        </div>

        {/* Missing Skills — muted red with strikethrough */}
        {skill_overlap.missing.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5" style={{ marginBottom: '12px' }}>
              <span className="text-[9px] font-mono font-medium text-[var(--color-error)] uppercase tracking-[0.15em]">
                Missing Skills
              </span>
            </div>
            <div className="flex flex-wrap" style={{ gap: '0px' }}>
              {skill_overlap.missing.map(skill => (
                <MissingSkillTag key={skill} skill={skill} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Experience ── */}
      {work_experience.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
              Experience
            </h3>
          </div>
          <div className="space-y-4">
            {work_experience.map((exp, i) => (
              <div
                key={i}
                className="relative pl-4 border-l border-[var(--color-accent)]/20
                  animate-slide-in-right"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <h4 className="text-sm font-mono font-medium text-[var(--color-text-primary)]">
                  {exp.role}
                </h4>
                <p className="text-xs font-mono text-[var(--color-accent)]">
                  {exp.company}
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-[var(--color-text-muted)] ml-2">· {exp.start_date} – {exp.end_date || 'Present'}</span>
                  )}
                </p>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.responsibilities.slice(0, 3).map((h, j) => (
                      <li key={j} className="text-xs font-mono text-[var(--color-text-secondary)] leading-relaxed">
                        — {h}
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
      {education.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
              Education
            </h3>
          </div>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]/50 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-mono text-[var(--color-text-primary)]">
                    {edu.degree}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">
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
      {certifications && certifications.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <h3 className="text-xs font-mono font-medium text-[var(--color-text-primary)] uppercase tracking-[0.15em]">
              Certifications
            </h3>
          </div>
          <div className="flex flex-wrap" style={{ gap: '0px' }}>
            {certifications.map(cert => (
              <span
                key={cert}
                className="inline-flex items-center px-2 py-1 text-xs font-mono text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]/30"
                style={{ border: '1px solid rgba(245, 166, 35, 0.2)', borderBottom: '2px solid rgba(245, 166, 35, 0.3)', marginRight: '8px', marginBottom: '6px' }}
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
