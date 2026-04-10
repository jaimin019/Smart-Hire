/* ── Types for the TalentGraph application ─────────────────────────────────── */

export interface ExperienceItem {
  title: string | null;
  company: string | null;
  duration: string | null;
  highlights: string[];
}

export interface EducationItem {
  degree: string | null;
  institution: string | null;
  year: string | null;
}

export interface ParsedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  technical_skills: string[];
  certifications: string[];
}

export interface SkillOverlap {
  matched: string[];
  missing: string[];
}

export interface JobDescription {
  title: string;
  company: string;
  description: string;
  required_skills: string[];
}

export interface AgentTraceItem {
  agent: string;
  status: string;
  chars_extracted?: number;
  skills_found?: number;
  cosine_similarity?: number;
  match_score?: number;
}

export interface ParseResponse {
  parsed_data: ParsedData;
  match_score: number;
  job_description: JobDescription;
  skill_overlap: SkillOverlap;
  agent_trace: AgentTraceItem[];
}

export interface JobListItem {
  id: string;
  title: string;
  company: string;
}

export type AgentStatus = 'idle' | 'active' | 'completed' | 'error';

export interface AgentNodeState {
  parser: AgentStatus;
  normalizer: AgentStatus;
  matcher: AgentStatus;
}
