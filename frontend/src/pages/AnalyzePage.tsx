import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileSearch, Zap, CheckCircle2 } from 'lucide-react';
import { parseResume, parseResumesBulk, fetchJobs } from '@/lib/api';
import type { ParseResponse, AgentNodeState } from '@/types';

import UploadPanel from '@/components/UploadPanel';
import ResultsPanel from '@/components/ResultsPanel';
import AgentFlow from '@/components/AgentFlow';
import PDFViewer from '@/components/PDFViewer';

export default function AnalyzePage() {
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentNodeState>({
    parser: 'idle', normalizer: 'idle', matcher: 'idle',
  });

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResults, setBulkResults] = useState<ParseResponse[]>([]);
  const [bulkDone, setBulkDone] = useState(false);
  const [selectedBulkIndex, setSelectedBulkIndex] = useState(0);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    initialData: [
      { id: 'senior_fullstack', title: 'Senior Full-Stack Engineer', company: 'TechCorp Inc.' },
      { id: 'ml_engineer', title: 'Machine Learning Engineer', company: 'AI Solutions Ltd.' },
      { id: 'frontend_developer', title: 'Senior Frontend Developer', company: 'DesignHub Co.' },
    ],
  });

  const animateAgents = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setAgentStates({ parser: 'idle', normalizer: 'idle', matcher: 'idle' });
    const t1 = setTimeout(() => setAgentStates({ parser: 'active', normalizer: 'idle', matcher: 'idle' }), 200);
    const t2 = setTimeout(() => setAgentStates({ parser: 'completed', normalizer: 'active', matcher: 'idle' }), 1500);
    const t3 = setTimeout(() => setAgentStates({ parser: 'completed', normalizer: 'completed', matcher: 'active' }), 3000);
    timeoutsRef.current = [t1, t2, t3];
  }, []);

  const completeAllAgents = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    setAgentStates({ parser: 'completed', normalizer: 'completed', matcher: 'completed' });
  }, []);

  const mutation = useMutation({
    mutationFn: ({ file, jobId }: { file: File; jobId: string }) => parseResume(file, jobId),
    onMutate: () => { setResult(null); setBulkDone(false); animateAgents(); },
    onSuccess: (data) => { completeAllAgents(); setResult(data); },
    onError: () => {
      timeoutsRef.current.forEach(clearTimeout);
      setAgentStates({ parser: 'error', normalizer: 'error', matcher: 'error' });
    },
  });

  const handleUpload = useCallback((file: File, jobId: string) => {
    setUploadedFile(file);
    mutation.mutate({ file, jobId });
  }, [mutation]);

  const handleBulkUpload = useCallback(async (files: File[], jobId: string) => {
    setIsBulkLoading(true);
    setBulkProgress({ done: 0, total: files.length });
    setBulkResults([]);
    setBulkDone(false);
    setResult(null);
    setSelectedBulkIndex(0);
    animateAgents();
    try {
      const results = await parseResumesBulk(files, jobId, (done, total) => {
        setBulkProgress({ done, total });
      });
      setBulkResults(results);
      setBulkDone(true);
      setSelectedBulkIndex(0);
      completeAllAgents();
      if (results.length > 0) setResult(results[0]);
    } catch {
      timeoutsRef.current.forEach(clearTimeout);
      setAgentStates({ parser: 'error', normalizer: 'error', matcher: 'error' });
    } finally {
      setIsBulkLoading(false);
    }
  }, [animateAgents, completeAllAgents]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40">
        <div className="max-w-[1700px] mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/20 flex items-center justify-center">
            <FileSearch className="w-4.5 h-4.5 text-[var(--color-accent-light)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Resume Analyzer</h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">Upload & analyze resumes with the 3-agent AI pipeline</p>
          </div>
          {(result || bulkDone) && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-success)]/20">
              <CheckCircle2 className="w-3 h-3" />
              {bulkDone ? `${bulkResults.length} resumes analyzed` : 'Analysis complete'}
            </span>
          )}
        </div>
      </div>

      {/* Agent pipeline */}
      <section className="max-w-[1700px] mx-auto w-full px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">Agent Pipeline</span>
          {isBulkLoading && bulkProgress && (
            <span className="ml-auto text-[11px] text-[var(--color-accent-light)] font-semibold">
              Processing {bulkProgress.done + 1} / {bulkProgress.total}
            </span>
          )}
          {bulkDone && (
            <span className="ml-auto text-[11px] text-[var(--color-success)] font-semibold">
              ✓ {bulkResults.length} resumes processed
            </span>
          )}
        </div>
        <AgentFlow agentStates={agentStates} />
      </section>

      {/* Main content */}
      <main className="max-w-[1700px] mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-md">Setup</span>
              <span className="text-xs text-[var(--color-text-muted)]">Upload & configure</span>
            </div>
            <div className="glass-card p-6">
              <UploadPanel
                onUpload={handleUpload}
                onBulkUpload={handleBulkUpload}
                isLoading={mutation.isPending}
                isBulkLoading={isBulkLoading}
                bulkProgress={bulkProgress}
                jobs={jobs}
                uploadedFile={uploadedFile}
              />
            </div>
            <div className="flex-1 min-h-[400px]">
              <PDFViewer file={uploadedFile} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-2.5 py-1 rounded-md">Results</span>
              <span className="text-xs text-[var(--color-text-muted)]">AI-powered analysis</span>
              {bulkDone && (
                <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-success)]/10 text-[var(--color-success)]">
                  {bulkResults.length} resumes analyzed
                </span>
              )}
            </div>

            {/* Bulk navigator */}
            {bulkDone && bulkResults.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                <button
                  onClick={() => { const idx = Math.max(0, selectedBulkIndex - 1); setSelectedBulkIndex(idx); setResult(bulkResults[idx]); }}
                  disabled={selectedBulkIndex === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 text-xs font-bold flex-shrink-0"
                >‹</button>
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-light)]">
                    Resume {selectedBulkIndex + 1} of {bulkResults.length}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                    {bulkResults[selectedBulkIndex]?.parsed_data?.name ?? 'Unnamed'}
                  </p>
                </div>
                <button
                  onClick={() => { const idx = Math.min(bulkResults.length - 1, selectedBulkIndex + 1); setSelectedBulkIndex(idx); setResult(bulkResults[idx]); }}
                  disabled={selectedBulkIndex === bulkResults.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 text-xs font-bold flex-shrink-0"
                >›</button>
              </div>
            )}

            {/* Candidate ID banner */}
            {result?.candidate_id && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-success)]">
                    {bulkDone ? `${bulkResults.length} Candidates Saved` : 'Candidate Saved'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">{result.candidate_id}</p>
                </div>
                <button
                  onClick={() => handleCopyId(result.candidate_id!)}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-success)]/20 text-[var(--color-success)] hover:bg-[var(--color-success)]/30 transition-colors duration-200 flex-shrink-0"
                >
                  {copiedId ? 'Copied!' : 'Copy ID'}
                </button>
              </div>
            )}

            {(mutation.isPending || isBulkLoading) ? (
              <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-[var(--color-violet)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {isBulkLoading ? 'Processing resumes...' : 'Agents are working...'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {isBulkLoading && bulkProgress ? `${bulkProgress.done} / ${bulkProgress.total} complete` : 'Parsing → Normalizing → Matching'}
                  </p>
                </div>
                {isBulkLoading && bulkProgress && (
                  <div className="w-48 h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] transition-all duration-300"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                )}
              </div>
            ) : mutation.isError ? (
              <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-error)]">Analysis Failed</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
                    {(mutation.error as Error)?.message || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
            ) : result ? (
              <ResultsPanel data={result} />
            ) : (
              <div className="glass-card p-12 flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-violet)]/10 flex items-center justify-center">
                    <Zap className="w-9 h-9 text-[var(--color-accent-light)]" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Ready to Analyze</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs leading-relaxed">
                    Upload one or multiple resumes, select a job description, and click
                    <span className="text-[var(--color-accent-light)] font-medium"> Analyze </span>
                    to see the magic happen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
