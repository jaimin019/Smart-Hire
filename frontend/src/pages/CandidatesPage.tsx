import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, ArrowRight, Mail, Calendar,
  User, RefreshCw, Upload, BarChart3, SortAsc, SortDesc,
} from 'lucide-react';
import { fetchCandidates } from '@/lib/api';
import type { StoredCandidate } from '@/types';

function CandidateCard({ candidate, index }: { candidate: StoredCandidate; index: number }) {
  const navigate = useNavigate();
  const initials = (candidate.name ?? '??')
    .split(' ')
    .map(w => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colors = [
    'var(--color-accent)', 'var(--color-cyan)', 'var(--color-violet)',
    'var(--color-emerald)', 'var(--color-warning)', 'var(--color-rose)',
  ];
  const color = colors[index % colors.length];

  const date = new Date(candidate.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <button
      onClick={() => navigate(`/candidates/${candidate.id}`)}
      className="glass-card p-5 text-left flex flex-col gap-4 hover:scale-[1.02] hover:border-[var(--color-accent)]/40 transition-all duration-200 animate-fade-in-up group"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: `${color}25`, border: `1px solid ${color}40`, color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
            {candidate.name ?? 'Unnamed Candidate'}
          </p>
          {candidate.email && (
            <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              {candidate.email}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-light)] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-0.5" />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
          <Calendar className="w-3 h-3" />
          {dateStr}
        </span>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          Saved
        </span>
      </div>

      {/* ID */}
      <p className="text-[10px] font-mono text-[var(--color-text-muted)] truncate bg-[var(--color-bg-tertiary)]/50 px-2 py-1 rounded-lg">
        {candidate.id}
      </p>
    </button>
  );
}

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

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40">
        <div className="max-w-[1700px] mx-auto px-6 py-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-cyan)]/15 border border-[var(--color-cyan)]/20 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-[var(--color-cyan)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Candidates</h1>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {isLoading ? 'Loading…' : `${candidates.length} candidates stored`}
              </p>
            </div>
          </div>

          {/* Search + sort + actions */}
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search name, email, ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150 w-56"
              />
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
              {(['name', 'date'] as SortField[]).map(f => (
                <button
                  key={f}
                  onClick={() => toggleSort(f)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150
                    ${sortField === f ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
                >
                  {sortField === f
                    ? (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)
                    : <BarChart3 className="w-3 h-3" />
                  }
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-all duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-glow)] hover:scale-[1.02] transition-all duration-200"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Resume
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1700px] mx-auto w-full px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Loading candidates…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-error)]/10 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-error)]">Failed to load candidates</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Make sure the backend is running at port 8000</p>
            </div>
            <button onClick={() => refetch()} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20 transition-colors">
              Retry
            </button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-violet)]/10 flex items-center justify-center">
              <User className="w-10 h-10 text-[var(--color-accent-light)]" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-base font-bold text-[var(--color-text-primary)] mb-2">No Candidates Yet</p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Head to the Analyze page to upload your first resume. Once processed, candidates appear here for review and comparison.
              </p>
            </div>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] text-white hover:scale-105 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              Upload First Resume
            </button>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6 px-5 py-3 rounded-xl bg-[var(--color-bg-card)]/50 border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Showing <span className="font-bold text-[var(--color-text-primary)]">{filtered.length}</span> of {candidates.length} candidates
                </span>
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-[10px] text-[var(--color-accent-light)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Clear search
                </button>
              )}
              <button
                onClick={() => navigate('/compare')}
                className="ml-auto flex items-center gap-1.5 text-xs text-[var(--color-accent-light)] hover:text-[var(--color-text-primary)] font-semibold transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Compare Candidates →
              </button>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-[var(--color-text-muted)]">No candidates match "{search}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((c, i) => (
                  <CandidateCard key={c.id} candidate={c} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
