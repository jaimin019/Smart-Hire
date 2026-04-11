import axios from 'axios';
import type {
  ParseResponse,
  JobListItem,
  TaxonomyResponse,
  CompareResponse,
  MultiCompareResponse,
  StoredCandidate,
} from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120_000,
});

// ── Parse ─────────────────────────────────────────────────────────────────────

export async function parseResume(file: File, jobId: string): Promise<ParseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_id', jobId);
  const { data } = await api.post<ParseResponse>('/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function fetchJobs(): Promise<JobListItem[]> {
  const { data } = await api.get<JobListItem[]>('/jobs');
  return data;
}

// ── Skill Taxonomy ────────────────────────────────────────────────────────────

export async function fetchTaxonomy(params?: {
  q?: string;
  category?: string;
  subcategory?: string;
  limit?: number;
}): Promise<TaxonomyResponse> {
  const { data } = await api.get<TaxonomyResponse>('/skills/taxonomy', { params });
  return data;
}

// ── Candidates ────────────────────────────────────────────────────────────────

export async function fetchCandidates(limit = 50): Promise<StoredCandidate[]> {
  const { data } = await api.get<{ candidates: StoredCandidate[]; count: number }>(
    '/candidates',
    { params: { limit } }
  );
  return data.candidates;
}

export async function fetchCandidateById(id: string): Promise<ParseResponse> {
  const { data } = await api.get<ParseResponse>(`/candidates/${id}`);
  return data;
}

// ── Compare ───────────────────────────────────────────────────────────────────

export async function compareCandidates(
  candidateId1: string,
  candidateId2: string,
  jobId: string
): Promise<CompareResponse> {
  const { data } = await api.post<CompareResponse>('/compare', {
    candidate_id_1: candidateId1,
    candidate_id_2: candidateId2,
    job_id: jobId,
  });
  return data;
}

export async function compareCandidatesMulti(
  candidateIds: string[],
  jobId: string
): Promise<MultiCompareResponse> {
  const { data } = await api.post<MultiCompareResponse>('/compare/multi', {
    candidate_ids: candidateIds,
    job_id: jobId,
  });
  return data;
}

export async function parseResumesBulk(
  files: File[],
  jobId: string,
  onProgress?: (done: number, total: number) => void
): Promise<ParseResponse[]> {
  const results: ParseResponse[] = [];
  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('file', files[i]);
    formData.append('job_id', jobId);
    const { data } = await api.post<ParseResponse>('/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    results.push(data);
    onProgress?.(i + 1, files.length);
  }
  return results;
}
