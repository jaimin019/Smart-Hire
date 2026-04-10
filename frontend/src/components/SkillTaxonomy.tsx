import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, ChevronDown, ChevronRight, Tag, Layers } from 'lucide-react';
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
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-[var(--color-cyan)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            Skill Taxonomy
          </h2>
          {data && (
            <span className="ml-auto text-xs text-[var(--color-text-muted)]">
              {data.total.toLocaleString()} skills
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Browse or search 3,208 canonical skills across 14 industry categories.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search skills e.g. python, kubernetes, figma..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
              bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:border-[var(--color-accent)]
              transition-colors duration-200"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="glass-card p-8 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-text-muted)]">Loading taxonomy...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-[var(--color-error)]">Failed to load taxonomy. Is the backend running?</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && data && isSearching && (
        <div className="glass-card p-5">
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Found <span className="text-[var(--color-accent-light)] font-semibold">{data.total}</span> skill{data.total !== 1 ? 's' : ''} matching "{debouncedQuery}"
          </p>
          <div className="space-y-4">
            {data.categories.map((cat) =>
              cat.subcategories.map((sub) => (
                <div key={`${cat.name}-${sub.name}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3 h-3 text-[var(--color-violet)]" />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      {cat.name} › {sub.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(sub.skills ?? []).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                          bg-[var(--color-accent)]/10 text-[var(--color-accent-light)]
                          border border-[var(--color-accent)]/20"
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
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                No skills found for "{debouncedQuery}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Browse Mode — category accordion */}
      {!isLoading && data && !isSearching && (
        <div className="flex flex-col gap-3">
          {data.categories.map((cat: CategoryOut) => {
            const totalSkills = cat.subcategories.reduce((sum, s) => sum + s.skill_count, 0);
            const isExpanded = expandedCategory === cat.name;

            return (
              <div key={cat.name} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                  className="w-full flex items-center justify-between p-4
                    hover:bg-[var(--color-bg-elevated)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-violet)]/20
                      flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[var(--color-accent-light)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{cat.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {cat.subcategories.length} subcategories · {totalSkills.toLocaleString()} skills
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border-subtle)] px-4 pb-4 pt-3 space-y-3">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.name} className="flex items-center justify-between
                        px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <span className="text-xs text-[var(--color-text-secondary)]">{sub.name}</span>
                        <span className="text-[10px] font-semibold text-[var(--color-accent-light)]
                          bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">
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
