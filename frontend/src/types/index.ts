/* ── Types for the TalentGraph application ─────────────────────────────────── */

export interface WorkExperience {
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  duration_months: number | null;
  responsibilities: string[];
}

export interface EducationItem {
  degree: string | null;
  institution: string | null;
  year: string | null;
}

export interface NormalizedSkill {
  raw: string;
  canonical: string;
  category: string;
  proficiency: string;
  is_emerging: boolean;
}

export interface PersonalInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
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

export interface Project {
  title: string;
  description: string | null;
  technologies: string[];
}

export interface ParseResponse {
  candidate_id?: string | null;
  personal_info: PersonalInfo;
  work_experience: WorkExperience[];
  education: EducationItem[];
  skills: NormalizedSkill[];
  certifications: string[];
  projects: Project[];
  publications: string[];
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

/* ── Taxonomy Types ──────────────────────────────────────── */

export interface SubcategoryOut {
  name: string;
  skill_count: number;
  skills?: string[];
}

export interface CategoryOut {
  name: string;
  subcategories: SubcategoryOut[];
}

export interface TaxonomyResponse {
  total: number;
  categories: CategoryOut[];
}

export interface SkillDetailResponse {
  canonical: string;
  category: string;
  subcategory: string;
  synonyms: string[];
  related_skills: string[];
}

/* ── Comparison Types ────────────────────────────────────── */

export interface CandidateSummary {
  candidate_id: string;
  name: string;
  overall_score: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_years: number;
  education: string;
}

export interface ComparisonResult {
  winner: string;
  score_diff: number;
  skills_only_in_1: string[];
  skills_only_in_2: string[];
  shared_skills: string[];
  recommendation: string;
}

export interface CompareResponse {
  job_title: string;
  candidates: CandidateSummary[];
  comparison: ComparisonResult;
}

export interface StoredCandidate {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}
