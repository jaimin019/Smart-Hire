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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
          Upload Resume
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Drop a PDF or DOCX file to begin AI analysis
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed p-8
          transition-all duration-300 ease-out
          flex flex-col items-center justify-center min-h-[200px]
          ${isDragActive
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] scale-[1.02]'
            : file
              ? 'border-[var(--color-success)] bg-[var(--color-success-glow)]'
              : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-elevated)]'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-4
          transition-all duration-300
          ${file
            ? 'bg-[var(--color-success)]'
            : 'bg-[var(--color-bg-card)] group-hover:bg-[var(--color-accent-dark)]'
          }
        `}>
          {file ? (
            <FileText className="w-7 h-7 text-white" />
          ) : (
            <Upload className={`w-7 h-7 transition-colors duration-300 ${isDragActive ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text-muted)] group-hover:text-white'}`} />
          )}
        </div>

        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {file.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {(file.size / 1024).toFixed(1)} KB · Click to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              PDF or DOCX · Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Job Selector */}
      <div className="relative">
        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Match Against
        </label>
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl
            bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
            text-sm text-[var(--color-text-primary)]
            hover:border-[var(--color-accent)] transition-colors duration-200"
        >
          <span>
            {selectedJobData
              ? `${selectedJobData.title} — ${selectedJobData.company}`
              : 'Select a job description'}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => {
                  setSelectedJob(job.id);
                  setIsJobDropdownOpen(false);
                }}
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

      {/* Submit Button */}
      <button
        id="upload-button"
        onClick={handleSubmit}
        disabled={!file || isLoading}
        className={`
          relative w-full py-3.5 rounded-xl font-semibold text-sm
          flex items-center justify-center gap-2
          transition-all duration-300 ease-out
          ${!file || isLoading
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyze Resume
          </>
        )}
      </button>
    </div>
  );
}
