import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Sparkles, ChevronDown,
  CheckCircle2, XCircle, Loader2, X, Files,
  LayoutList,
} from 'lucide-react';
import type { JobListItem } from '@/types';

interface UploadPanelProps {
  onUpload: (file: File, jobId: string) => void;
  onBulkUpload?: (files: File[], jobId: string) => void;
  isLoading: boolean;
  isBulkLoading?: boolean;
  bulkProgress?: { done: number; total: number } | null;
  jobs: JobListItem[];
  uploadedFile: File | null;
  uploadedFiles?: File[];
}

type FileStatus = 'queued' | 'processing' | 'done' | 'error';

interface FileEntry {
  file: File;
  status: FileStatus;
}

export default function UploadPanel({
  onUpload,
  onBulkUpload,
  isLoading,
  isBulkLoading,
  bulkProgress,
  jobs,
  uploadedFile,
}: UploadPanelProps) {
  const [selectedJob, setSelectedJob] = useState('senior_fullstack');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [bulkFiles, setBulkFiles] = useState<FileEntry[]>([]);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  const isBusy = mode === 'single' ? isLoading : (isBulkLoading ?? false);

  /* ── Single dropzone ── */
  const onDropSingle = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps: getSingleRootProps, getInputProps: getSingleInputProps, isDragActive: isSingleDragActive } = useDropzone({
    onDrop: onDropSingle,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isBusy,
  });

  /* ── Bulk dropzone ── */
  const onDropBulk = useCallback((accepted: File[]) => {
    setBulkFiles(prev => {
      const existingNames = new Set(prev.map(e => e.file.name));
      const newEntries: FileEntry[] = accepted
        .filter(f => !existingNames.has(f.name))
        .map(f => ({ file: f, status: 'queued' }));
      return [...prev, ...newEntries];
    });
  }, []);

  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({
    onDrop: onDropBulk,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 50,
    maxSize: 10 * 1024 * 1024,
    disabled: isBusy,
  });

  const removeBulkFile = (name: string) => {
    if (isBusy) return;
    setBulkFiles(prev => prev.filter(e => e.file.name !== name));
  };

  const handleSubmit = () => {
    if (mode === 'single' && file) {
      onUpload(file, selectedJob);
    } else if (mode === 'bulk' && bulkFiles.length >= 1) {
      onBulkUpload?.(bulkFiles.map(e => e.file), selectedJob);
    }
  };

  const getFileStatus = (index: number): FileStatus => {
    if (!bulkProgress) return 'queued';
    if (index < bulkProgress.done) return 'done';
    if (index === bulkProgress.done) return 'processing';
    return 'queued';
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
          Upload Resumes
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {mode === 'bulk' ? 'Upload up to 50 resumes for batch analysis' : 'Drop a PDF or DOCX file to begin AI analysis'}
        </p>
      </div>

      {/* ── Big Mode Selector Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Single Card */}
        <button
          onClick={() => setMode('single')}
          disabled={isBusy}
          className={`
            relative flex flex-col items-center justify-center gap-2.5
            py-5 px-4 rounded-2xl border-2 font-semibold
            transition-all duration-250 ease-out
            ${mode === 'single'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] shadow-lg shadow-[var(--color-accent)]/10'
              : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
            }
            ${isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
            ${mode === 'single' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}
          `}>
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-sm">Single</span>
          <span className="text-[10px] font-normal opacity-70">1 resume at a time</span>
          {mode === 'single' && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
          )}
        </button>

        {/* Bulk Card */}
        <button
          onClick={() => setMode('bulk')}
          disabled={isBusy}
          className={`
            relative flex flex-col items-center justify-center gap-2.5
            py-5 px-4 rounded-2xl border-2 font-semibold
            transition-all duration-250 ease-out
            ${mode === 'bulk'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] shadow-lg shadow-[var(--color-accent)]/10'
              : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
            }
            ${isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
            ${mode === 'bulk' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}
          `}>
            <Files className="w-5 h-5" />
          </div>
          <span className="text-sm">Bulk</span>
          <span className="text-[10px] font-normal opacity-70">Up to 50 resumes</span>
          {mode === 'bulk' && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
          )}
        </button>
      </div>

      {/* ── Single Mode Dropzone ── */}
      {mode === 'single' && (
        <div
          {...getSingleRootProps()}
          className={`
            relative group cursor-pointer rounded-2xl border-2 border-dashed p-8
            transition-all duration-300 ease-out
            flex flex-col items-center justify-center min-h-[210px]
            ${isSingleDragActive
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] scale-[1.02]'
              : file
                ? 'border-[var(--color-success)] bg-[var(--color-success-glow)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-elevated)]'
            }
            ${isBusy ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getSingleInputProps()} />

          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4
            transition-all duration-300
            ${file ? 'bg-[var(--color-success)]' : 'bg-[var(--color-bg-card)] group-hover:bg-[var(--color-accent-dark)]'}
          `}>
            {file
              ? <FileText className="w-7 h-7 text-white" />
              : <Upload className={`w-7 h-7 transition-colors duration-300 ${isSingleDragActive ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text-muted)] group-hover:text-white'}`} />
            }
          </div>

          {file ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                {isSingleDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">PDF or DOCX · Max 10 MB</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Mode ── */}
      {mode === 'bulk' && (
        <div className="flex flex-col gap-3">
          {/* Bulk dropzone */}
          <div
            {...getBulkRootProps()}
            className={`
              relative group cursor-pointer rounded-2xl border-2 border-dashed p-8
              transition-all duration-300 ease-out
              flex flex-col items-center justify-center min-h-[160px]
              ${isBulkDragActive
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] scale-[1.02]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-elevated)]'
              }
              ${isBusy ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getBulkInputProps()} />
            <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-card)] group-hover:bg-[var(--color-accent-dark)] flex items-center justify-center mb-3 transition-all duration-300">
              <Files className={`w-6 h-6 transition-colors duration-300 ${isBulkDragActive ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text-muted)] group-hover:text-white'}`} />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              {isBulkDragActive ? 'Drop all resumes here' : 'Drop multiple resumes'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">PDF or DOCX · Up to 50 files · Max 10 MB each</p>
          </div>

          {/* File list */}
          {bulkFiles.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} queued
                  </span>
                </div>
                {bulkProgress && (
                  <span className="text-xs text-[var(--color-accent-light)] font-semibold">
                    {bulkProgress.done}/{bulkProgress.total} processed
                  </span>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-[var(--color-border-subtle)]/60">
                {bulkFiles.map((entry, idx) => {
                  const status = isBulkLoading ? getFileStatus(idx) : entry.status;
                  return (
                    <div key={entry.file.name} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-shrink-0">
                        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />}
                        {status === 'processing' && <Loader2 className="w-4 h-4 text-[var(--color-accent-light)] animate-spin" />}
                        {status === 'error' && <XCircle className="w-4 h-4 text-[var(--color-error)]" />}
                        {status === 'queued' && <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{entry.file.name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{(entry.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0
                        ${status === 'done' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : ''}
                        ${status === 'processing' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-light)]' : ''}
                        ${status === 'error' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : ''}
                        ${status === 'queued' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]' : ''}
                      `}>
                        {status}
                      </span>
                      {!isBusy && (
                        <button
                          onClick={() => removeBulkFile(entry.file.name)}
                          className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors duration-150"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {bulkProgress && isBulkLoading && (
                <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
                  <div className="h-1.5 rounded-full bg-[var(--color-bg-card)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] transition-all duration-300"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Job Selector ── */}
      <div className="relative">
        <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Match Against
        </label>
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl
            bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
            text-sm text-[var(--color-text-primary)]
            hover:border-[var(--color-accent)] transition-colors duration-200"
        >
          <span>
            {selectedJobData ? `${selectedJobData.title} — ${selectedJobData.company}` : 'Select a job description'}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => { setSelectedJob(job.id); setIsJobDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150
                  ${selectedJob === job.id
                    ? 'bg-[var(--color-accent-dark)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
                  }`}
              >
                <span className="font-medium">{job.title}</span>
                <span className="text-[var(--color-text-muted)] ml-2">— {job.company}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Submit Button ── */}
      <button
        id="upload-button"
        onClick={handleSubmit}
        disabled={mode === 'single' ? (!file || isBusy) : (bulkFiles.length < 1 || isBusy)}
        className={`
          relative w-full py-4 rounded-2xl font-bold text-base
          flex items-center justify-center gap-2.5
          transition-all duration-300 ease-out tracking-wide
          ${(mode === 'single' ? !file : bulkFiles.length < 1) || isBusy
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] text-white hover:shadow-xl hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {isBusy ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {mode === 'bulk' && bulkProgress
              ? `Processing ${bulkProgress.done + 1} / ${bulkProgress.total}...`
              : 'Processing...'
            }
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {mode === 'bulk'
              ? `Analyze ${bulkFiles.length > 0 ? bulkFiles.length : ''} Resume${bulkFiles.length !== 1 ? 's' : ''}`
              : 'Analyze Resume'
            }
          </>
        )}
      </button>
    </div>
  );
}
