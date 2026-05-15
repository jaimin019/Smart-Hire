import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { fetchCandidateById } from '@/lib/api';
import type { ParseResponse } from '@/types';

import { PageHeader } from '@/components/ui/PageHeader';
import ResultsPanel from '@/components/ResultsPanel';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => fetchCandidateById(id!),
    enabled: !!id,
  });

  const data = rawData as ParseResponse | undefined;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <PageHeader 
        title="Candidate Profile"
        subtitle={id ? `ID: ${id}` : 'Loading...'}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/candidates')}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
              Back
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-bold bg-[var(--accent)] text-white hover:brightness-110 shadow-accent transition-all active:scale-95"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          </div>
        }
      />

      <main className="max-w-[1400px] mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">Loading profile...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--error-muted)] border border-[var(--error)]/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-base font-bold text-[var(--error)]">Candidate Not Found</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">The requested candidate profile could not be retrieved.</p>
            <button onClick={() => navigate('/candidates')} className="mt-6 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--error)] text-white font-semibold hover:brightness-110 transition-all">
              View All Candidates
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <ResultsPanel data={data} />
          </div>
        )}
      </main>
    </div>
  );
}
