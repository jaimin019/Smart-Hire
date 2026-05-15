import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Mail, Calendar, Upload, BarChart3, RefreshCw, ChevronRight
} from 'lucide-react';
import { fetchCandidates } from '@/lib/api';
import type { StoredCandidate } from '@/types';

import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

type SortField = 'name' | 'date';
type SortDir = 'asc' | 'desc';

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: candidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => fetchCandidates(200),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = candidates.filter(c =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sortField === 'name') {
        const diff = (a.name ?? '').localeCompare(b.name ?? '');
        return sortDir === 'asc' ? diff : -diff;
      } else {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
    });
    return list;
  }, [candidates, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const columns: Column<StoredCandidate>[] = [
    {
      key: 'name',
      label: 'Candidate',
      render: (c) => {
        const initials = (c.name ?? '??')
          .split(' ')
          .map(w => w[0] ?? '')
          .slice(0, 2)
          .join('')
          .toUpperCase();
          
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shadow-inner">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[var(--text-primary)] truncate">{c.name ?? 'Unnamed Candidate'}</span>
              {c.email && (
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="w-3 h-3" /> {c.email}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'id',
      label: 'ID',
      render: (c) => (
        <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border)]">
          {c.id.substring(0, 8)}...
        </span>
      )
    },
    {
      key: 'date',
      label: 'Saved On',
      render: (c) => {
        const dateStr = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return (
          <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            {dateStr}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Analyzed</Badge>
    },
    {
      key: 'action',
      label: '',
      render: () => (
        <div className="flex justify-end pr-2">
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-bright)] group-hover:translate-x-1 transition-all" />
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <PageHeader 
        title="Candidates Database"
        subtitle={isLoading ? 'Loading candidates...' : `${candidates.length} candidate profiles stored.`}
        icon={<Users className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-[var(--accent-bright)]" />
              Compare
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-bold bg-[var(--accent)] text-white hover:brightness-110 shadow-accent transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </button>
          </div>
        }
      />

      <main className="max-w-[1400px] mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">Loading candidates database...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--error-muted)] border border-[var(--error)]/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-base font-bold text-[var(--error)]">Failed to load candidates</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Ensure the backend server is running and accessible.</p>
            <button onClick={() => refetch()} className="mt-6 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--error)] text-white font-semibold hover:brightness-110 transition-all">
              Try Again
            </button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center min-h-[400px]">
            <EmptyState 
              icon={<Users className="w-8 h-8" />}
              title="No Candidates Found"
              description="Your database is currently empty. Head over to the Analyze page to upload and process your first candidate resume."
              action={
                <button
                  onClick={() => navigate('/analyze')}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-bold bg-[var(--accent)] text-white hover:brightness-110 shadow-accent transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Analyze a Resume
                </button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-2 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 px-2">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mr-2">Sort by</span>
                <button
                  onClick={() => toggleSort('date')}
                  className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold transition-colors ${sortField === 'date' ? 'bg-[var(--accent-muted)] text-[var(--accent-bright)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('name')}
                  className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold transition-colors ${sortField === 'name' ? 'bg-[var(--accent-muted)] text-[var(--accent-bright)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            {/* Data Table */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[var(--text-muted)]">No candidates match your search query "{search}".</p>
                <button onClick={() => setSearch('')} className="mt-4 text-[var(--accent-bright)] font-semibold hover:underline">Clear Search</button>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={filtered} 
                onRowClick={(row) => navigate(`/candidates/${row.id}`)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
