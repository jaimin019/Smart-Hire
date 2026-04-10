import axios from 'axios';
import type { ParseResponse, JobListItem } from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120_000, // 2 min for large resumes + model loading
});

export async function parseResume(file: File, jobId: string): Promise<ParseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_id', jobId);

  const { data } = await api.post<ParseResponse>('/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}

export async function fetchJobs(): Promise<JobListItem[]> {
  const { data } = await api.get<JobListItem[]>('/jobs');
  return data;
}
