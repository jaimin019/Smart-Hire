import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Sparkles, ChevronDown } from 'lucide-react';
import type { JobListItem } from '@/types';

interface UploadPanelProps {
  onUpload: (file: File, jobId: string) => void;
  isLoading: boolean;
  jobs: JobListItem[];
  uploadedFile: File | null;
}

export default function UploadPanel({ onUpload, isLoading, jobs, uploadedFile }: UploadPanelProps) {
  const [selectedJob, setSelectedJob] = useState('senior_fullstack');
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading,
  });

  const handleSubmit = () => {
    if (file) {
      onUpload(file, selectedJob);
    }
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-display font-bold text-[var(--color-text-primary)] mb-0.5 tracking-wide">
          Upload Resume
        </h2>
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          Drop a PDF or DOCX to begin AI analysis
        </p>
      </div>

      {/* Dropzone — dashed amber border with grain texture */}
      <div
        {...getRootProps()}
        className={`
          upload-grain-hover
          relative group cursor-pointer rounded border-2 border-dashed p-7
          transition-all duration-300 ease-out
          flex flex-col items-center justify-center min-h-[180px]
          ${isDragActive
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 scale-[1.01]'
            : file
              ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/3'
              : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/60'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className={`
          w-12 h-12 rounded border flex items-center justify-center mb-3
          transition-all duration-300
          ${file
            ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10'
            : 'border-[var(--color-border)] bg-[var(--color-bg-card)] group-hover:border-[var(--color-accent)]/40'
          }
        `}>
          {file ? (
            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
          ) : (
            <Upload className={`w-5 h-5 transition-colors duration-300 ${isDragActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]'}`} />
          )}
        </div>

        {file ? (
          <div className="text-center">
            <p className="text-sm font-mono text-[var(--color-accent)] mb-0.5">
              {file.name}
            </p>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {(file.size / 1024).toFixed(1)} KB · Click to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-mono text-[var(--color-text-primary)] mb-0.5">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
              PDF or DOCX · Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Job Selector */}
      <div className="relative">
        <label className="block text-[9px] font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5">
          Match Against
        </label>
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="w-full flex items-center justify-between rounded
            bg-[var(--color-bg-tertiary)]
            text-sm font-mono text-[var(--color-text-primary)]
            hover:border-[var(--color-accent)]/40 transition-colors duration-200"
          style={{ padding: '10px 14px', border: '1px solid rgba(245, 166, 35, 0.3)' }}
        >
          <span>
            {selectedJobData
              ? `${selectedJobData.title} — ${selectedJobData.company}`
              : 'Select a job description'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => {
                  setSelectedJob(job.id);
                  setIsJobDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm font-mono transition-colors duration-150
                  ${selectedJob === job.id
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-accent)]'
                  }`}
              >
                <span className="font-medium">{job.title}</span>
                <span className="text-[var(--color-text-muted)] ml-2">— {job.company}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        id="upload-button"
        onClick={handleSubmit}
        disabled={!file || isLoading}
        className={`
          relative w-full rounded font-mono font-medium text-sm
          flex items-center justify-center gap-2
          transition-all duration-300 ease-out border
          ${!file || isLoading
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed'
            : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/60 active:scale-[0.99]'
          }
        `}
        style={{ padding: '14px' }}
      >
        {isLoading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Resume
          </>
        )}
      </button>
    </div>
  );
}
