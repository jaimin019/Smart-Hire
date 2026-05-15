import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Sparkles, ChevronDown,
  CheckCircle2, XCircle, Loader2, X, Files,
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
    <div className="flex flex-col gap-6">
      
      {/* ── Header & Mode Toggle ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Upload Resumes</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'bulk' ? 'Batch analyze up to 50 resumes' : 'Analyze a single candidate'}
          </p>
        </div>
        
        {/* Pill Toggle */}
        <div className="flex items-center p-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]">
          <button
            onClick={() => setMode('single')}
            disabled={isBusy}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              mode === 'single' 
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card border border-[var(--border)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setMode('bulk')}
            disabled={isBusy}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              mode === 'bulk' 
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card border border-[var(--border)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent'
            }`}
          >
            Bulk
          </button>
        </div>
      </div>

      {/* ── Dropzone Area ── */}
      {mode === 'single' ? (
        <div className="flex flex-col gap-4">
          <div
            {...getSingleRootProps()}
            className={`
              relative flex flex-col items-center justify-center p-10 min-h-[220px] cursor-pointer
              border-2 border-dashed rounded-[var(--radius-lg)] transition-all duration-300 ease-out
              ${isSingleDragActive 
                ? 'border-[var(--accent)] bg-[var(--accent-muted)]' 
                : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]'
              }
              ${isBusy ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getSingleInputProps()} />
            <Upload className={`w-10 h-10 mb-4 transition-colors ${isSingleDragActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
            <p className="text-base font-bold text-[var(--text-primary)] mb-1">
              {isSingleDragActive ? 'Drop resume here' : 'Drop your resume here'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">PDF or DOCX · Max 10MB</p>
          </div>

          {/* Single File Preview Chip */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] animate-fade-in-up">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[var(--accent-bright)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {!isBusy && (
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            {...getBulkRootProps()}
            className={`
              relative flex flex-col items-center justify-center p-8 min-h-[160px] cursor-pointer
              border-2 border-dashed rounded-[var(--radius-lg)] transition-all duration-300 ease-out
              ${isBulkDragActive 
                ? 'border-[var(--accent)] bg-[var(--accent-muted)]' 
                : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]'
              }
              ${isBusy ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getBulkInputProps()} />
            <Files className={`w-8 h-8 mb-3 transition-colors ${isBulkDragActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
              {isBulkDragActive ? 'Drop all resumes here' : 'Drop multiple resumes here'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">PDF or DOCX · Up to 50 files</p>
          </div>

          {/* Bulk File List */}
          {bulkFiles.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)]">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} queued
                </span>
                {bulkProgress && (
                  <span className="text-xs font-bold text-[var(--accent-bright)]">
                    {bulkProgress.done}/{bulkProgress.total} processed
                  </span>
                )}
              </div>
              
              <div className="max-h-[200px] overflow-y-auto divide-y divide-[var(--border)]">
                {bulkFiles.map((entry, idx) => {
                  const status = isBulkLoading ? getFileStatus(idx) : entry.status;
                  return (
                    <div key={entry.file.name} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-shrink-0">
                        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
                        {status === 'processing' && <Loader2 className="w-4 h-4 text-[var(--accent-bright)] animate-spin" />}
                        {status === 'error' && <XCircle className="w-4 h-4 text-[var(--error)]" />}
                        {status === 'queued' && <FileText className="w-4 h-4 text-[var(--text-muted)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{entry.file.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 border
                        ${status === 'done' ? 'bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/20' : ''}
                        ${status === 'processing' ? 'bg-[var(--accent-muted)] text-[var(--accent-bright)] border-[var(--accent)]/20' : ''}
                        ${status === 'error' ? 'bg-[var(--error-muted)] text-[var(--error)] border-[var(--error)]/20' : ''}
                        ${status === 'queued' ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]' : ''}
                      `}>
                        {status}
                      </span>
                      {!isBusy && (
                        <button
                          onClick={() => removeBulkFile(entry.file.name)}
                          className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {bulkProgress && isBulkLoading && (
                <div className="h-1 bg-[var(--bg-surface)] w-full">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Job Selector ── */}
      <div className="relative mt-2">
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Target Role
        </label>
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)]
            bg-[var(--bg-elevated)] border border-[var(--border)]
            text-sm text-[var(--text-primary)] font-medium
            hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-colors duration-200"
        >
          <span>
            {selectedJobData ? `${selectedJobData.title} — ${selectedJobData.company}` : 'Select a role'}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] shadow-card overflow-hidden">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => { setSelectedJob(job.id); setIsJobDropdownOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-150 border-b border-[var(--border)] last:border-0
                  ${selectedJob === job.id
                    ? 'bg-[var(--accent-muted)] text-[var(--accent-bright)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  }`}
              >
                <span className="font-semibold">{job.title}</span>
                <span className="text-xs text-[var(--text-muted)]">{job.company}</span>
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
          w-full py-3.5 rounded-[var(--radius-md)] font-bold text-sm
          flex items-center justify-center gap-2 mt-2
          transition-all duration-200
          ${(mode === 'single' ? !file : bulkFiles.length < 1) || isBusy
            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
            : 'bg-[var(--accent)] text-white hover:brightness-110 shadow-accent active:scale-[0.98]'
          }
        `}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {mode === 'bulk' && bulkProgress
              ? `Processing ${bulkProgress.done + 1} / ${bulkProgress.total}...`
              : 'Analyzing...'
            }
          </>
        ) : (
          <>
            {mode === 'bulk' ? <Files className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            Analyze {mode === 'bulk' && bulkFiles.length > 0 ? `${bulkFiles.length} ` : ''}Resume{mode === 'bulk' && bulkFiles.length !== 1 ? 's' : ''}
          </>
        )}
      </button>

    </div>
  );
}
