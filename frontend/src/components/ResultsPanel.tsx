import { useState, useMemo } from 'react';
import { 
  Mail, Phone, Briefcase, GraduationCap, Award,
  Target, Copy, Check, Search, Activity, ChevronDown
} from 'lucide-react';
import type { ParseResponse } from '@/types';
import { ScoreRing } from './ui/ScoreRing';
import { SkillChip } from './ui/SkillChip';
import { EmptyState } from './ui/EmptyState';

interface ResultsPanelProps {
  data: ParseResponse | null;
}

export default function ResultsPanel({ data }: ResultsPanelProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);

  if (!data) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8" />}
        title="No results yet"
        description="Upload and analyze a resume to see candidate insights, skill match scores, and AI agent traces here."
      />
    );
  }

  const { parsed_data, match_score, skill_overlap, job_description, candidate_id, agent_trace } = data;

  const matchedSkillsSet = useMemo(
    () => new Set(skill_overlap.matched.map(s => s.toLowerCase())),
    [skill_overlap.matched]
  );

  const handleCopyId = () => {
    if (candidate_id) {
      navigator.clipboard.writeText(candidate_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Generate initials for avatar
  const initials = parsed_data.name
    ? parsed_data.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* ── Candidate Header Card ───────────────────────────────── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card flex items-start gap-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-xl font-display font-bold text-[var(--text-primary)] shadow-inner">
          {initials}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center h-16">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-display font-bold text-[var(--text-primary)] truncate">
              {parsed_data.name || 'Unknown Candidate'}
            </h2>
            {candidate_id && (
              <button 
                onClick={handleCopyId}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Copy Candidate ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            {parsed_data.email && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {parsed_data.email}
              </span>
            )}
            {parsed_data.phone && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {parsed_data.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 pl-4 border-l border-[var(--border-strong)]">
          <ScoreRing score={match_score} size={80} />
        </div>
      </div>

      {/* ── Summary & Target Role ── */}
      {(parsed_data.summary || job_description) && (
        <div className="grid md:grid-cols-2 gap-4">
          {parsed_data.summary && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Professional Summary</span>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                {parsed_data.summary}
              </p>
            </div>
          )}
          
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Matched Against Role</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-[var(--accent-bright)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {job_description.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {job_description.company}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Skill Overlap Section ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Skill Analysis
          </h3>
          <div className="flex gap-3 text-xs font-medium">
            <span className="text-[var(--success)]">{skill_overlap.matched.length} Matched</span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="text-[var(--error)]">{skill_overlap.missing.length} Missing</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              Candidate possesses
            </div>
            <div className="flex flex-wrap gap-2">
              {parsed_data.technical_skills.map((skill, i) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  variant={matchedSkillsSet.has(skill.toLowerCase()) ? 'matched' : 'neutral'}
                  delayIndex={i}
                />
              ))}
              {parsed_data.technical_skills.length === 0 && (
                <span className="text-sm text-[var(--text-muted)] italic">No technical skills detected</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--error)]" />
              Missing from resume
            </div>
            <div className="flex flex-wrap gap-2">
              {skill_overlap.missing.map((skill, i) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  variant="missing"
                  delayIndex={i + parsed_data.technical_skills.length}
                />
              ))}
              {skill_overlap.missing.length === 0 && (
                <span className="text-sm text-[var(--text-muted)] italic text-[var(--success)]">All required skills present!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Experience Timeline ── */}
      {parsed_data.experience.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-bright)]">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Experience History
            </h3>
          </div>
          
          <div className="space-y-6 ml-4 border-l border-[var(--border-strong)] relative">
            {parsed_data.experience.map((exp, i) => (
              <div
                key={i}
                className="relative pl-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Timeline Dot */}
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
                
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {exp.company}
                </h4>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-[var(--accent-bright)] font-medium">{exp.title}</span>
                  {exp.duration && (
                    <>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span className="font-mono text-[var(--text-secondary)]">{exp.duration}</span>
                    </>
                  )}
                </div>
                
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3 relative">
                        <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education & Certs grid ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Education */}
        {parsed_data.education.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Education
              </h3>
            </div>
            <div className="space-y-4">
              {parsed_data.education.map((edu, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{edu.degree}</p>
                  <p className="text-xs font-mono text-[var(--text-secondary)]">
                    {edu.institution}
                    {edu.year && <span> · {edu.year}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {parsed_data.certifications && parsed_data.certifications.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--warning)]">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Certifications
              </h3>
            </div>
            <ul className="space-y-2">
              {parsed_data.certifications.map((cert, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] mt-1.5 flex-shrink-0" />
                  <span className="leading-tight">{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Agent Trace (Collapsible) ── */}
      {agent_trace && agent_trace.length > 0 && (
        <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-card overflow-hidden">
          <button 
            onClick={() => setTraceOpen(!traceOpen)}
            className="w-full px-6 py-4 flex items-center justify-between bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Agent Execution Trace</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${traceOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {traceOpen && (
            <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)]">
                      <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Agent</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Key Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {agent_trace.map((trace, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] capitalize">{trace.agent}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                            ${trace.status === 'completed' || trace.status === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'}
                          `}>
                            {trace.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-[var(--text-secondary)]">
                          {trace.agent === 'parser' && trace.chars_extracted && `${trace.chars_extracted} chars`}
                          {trace.agent === 'normalizer' && trace.skills_found && `${trace.skills_found} skills`}
                          {trace.agent === 'matcher' && trace.match_score && `${trace.match_score}% match`}
                          {!trace.chars_extracted && !trace.skills_found && !trace.match_score && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
