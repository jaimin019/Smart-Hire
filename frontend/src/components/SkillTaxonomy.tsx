import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronRight, Tag, Layers } from 'lucide-react';
import { fetchTaxonomy } from '@/lib/api';
import type { CategoryOut } from '@/types';

export default function SkillTaxonomy() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQuery(val), 350);
    setDebounceTimer(timer);
  };

  // When searching: fetch with q param (returns skill lists)
  // When browsing: fetch without q to get category/subcat structure
  const { data, isLoading, isError } = useQuery({
    queryKey: ['taxonomy', debouncedQuery],
    queryFn: () =>
      fetchTaxonomy(debouncedQuery ? { q: debouncedQuery, limit: 30 } : undefined),
    staleTime: 60_000,
  });

  const isSearching = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-lg font-display font-bold text-[var(--color-text-primary)] tracking-wide">
            Skill Taxonomy
          </h2>
          {data && (
            <span className="text-xs font-mono text-[var(--color-accent)]">
              {data.total.toLocaleString()} skills
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-[var(--color-text-muted)] mb-4">
          Browse or search canonical skills across industry categories.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search skills — python, kubernetes, figma…"
            className="w-full pl-9 pr-4 rounded text-sm font-mono
              bg-[var(--color-bg-tertiary)]
              text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)]/50
              transition-colors duration-200"
            style={{ padding: '10px 14px 10px 36px', border: '1px solid rgba(245, 166, 35, 0.3)' }}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="glass-card p-8 flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
          <span className="text-sm font-mono text-[var(--color-text-muted)]">Loading taxonomy…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm font-mono text-[var(--color-error)]">Failed to load taxonomy. Is the backend running?</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && data && isSearching && (
        <div className="glass-card p-5">
          <p className="text-xs font-mono text-[var(--color-text-muted)] mb-4">
            Found <span className="text-[var(--color-accent)] font-medium">{data.total}</span> skill{data.total !== 1 ? 's' : ''} matching "{debouncedQuery}"
          </p>
          <div className="space-y-4">
            {data.categories.map((cat) =>
              cat.subcategories.map((sub) => (
                <div key={`${cat.name}-${sub.name}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3 h-3 text-[var(--color-accent)]" />
                    <span className="text-[10px] font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                      {cat.name} › {sub.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap">
                    {(sub.skills ?? []).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 text-sm font-mono text-[var(--color-accent)] border-b border-[var(--color-accent)]/30 pb-0.5 mr-4 mb-2 hover:border-[var(--color-accent)] transition-colors duration-200"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
            {data.categories.length === 0 && (
              <p className="text-sm font-mono text-[var(--color-text-muted)] text-center py-4">
                No skills found for "{debouncedQuery}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Browse Mode — 2-column editorial list with large monospaced numbers */}
      {!isLoading && data && !isSearching && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {data.categories.map((cat: CategoryOut, idx: number) => {
            const totalSkills = cat.subcategories.reduce((sum, s) => sum + s.skill_count, 0);
            const isExpanded = expandedCategory === cat.name;
            const categoryNum = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={cat.name}
                className={`border-b border-[var(--color-border-subtle)] ${
                  idx % 2 === 0 ? 'lg:border-r lg:border-r-[var(--color-border-subtle)]' : ''
                }`}
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                  className="w-full flex items-center gap-4 px-5 py-4
                    hover:bg-[var(--color-bg-card)] transition-colors duration-200 group"
                >
                  {/* Large monospaced number */}
                  <span className="text-2xl font-mono font-medium text-[var(--color-border)] group-hover:text-[var(--color-accent)]/40 transition-colors duration-200 tabular-nums w-10 text-right flex-shrink-0">
                    {categoryNum}
                  </span>

                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-mono font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-200 truncate">
                      {cat.name}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {cat.subcategories.length} subcategories
                    </p>
                  </div>

                  <span className="text-xs font-mono text-[var(--color-accent)] tabular-nums flex-shrink-0">
                    {totalSkills.toLocaleString()}
                  </span>

                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border-subtle)] px-5 pb-4 pt-3 space-y-1 bg-[var(--color-bg-card)]">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.name} className="flex items-center justify-between
                        px-3 py-2 rounded hover:bg-[var(--color-bg-elevated)] transition-colors duration-150">
                        <span className="text-xs font-mono text-[var(--color-text-secondary)]">{sub.name}</span>
                        <span className="text-[10px] font-mono font-medium text-[var(--color-accent)] tabular-nums">
                          {sub.skill_count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
