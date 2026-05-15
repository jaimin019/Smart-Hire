import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { fetchTaxonomy } from '@/lib/api';
import type { CategoryOut } from '@/types';
import { SkillChip } from '@/components/ui/SkillChip';

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['taxonomy', debouncedQuery],
    queryFn: () =>
      fetchTaxonomy(debouncedQuery ? { q: debouncedQuery, limit: 30 } : undefined),
    staleTime: 60_000,
  });

  const isSearching = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-[var(--cyan)]" />
                <h2 className="text-base font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Skill Taxonomy Explorer
                </h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Browse or search normalized skills across industry categories.
              </p>
            </div>
            {data && !isLoading && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-2xl font-display font-bold text-[var(--text-primary)] leading-none">
                  {data.total.toLocaleString()}
                </span>
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Skills</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search skills e.g. react, python, machine learning..."
              className="w-full pl-11 pr-4 py-3 rounded-[var(--radius-md)] text-sm font-medium
                bg-[var(--bg-elevated)] border border-[var(--border)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)]
                focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-12 shadow-card flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[var(--text-muted)]">Loading taxonomy database...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-[var(--error-muted)] border border-[var(--error)]/20 rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-base font-bold text-[var(--error)] mb-2">Connection Error</p>
          <p className="text-sm text-[var(--error)]/80">Failed to load taxonomy. Is the FastAPI backend running?</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && data && isSearching && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-card min-h-[300px]">
          <p className="text-sm text-[var(--text-secondary)] mb-6 border-b border-[var(--border)] pb-4">
            Found <span className="text-[var(--text-primary)] font-bold">{data.total}</span> match{data.total !== 1 ? 'es' : ''} for "{debouncedQuery}"
          </p>
          <div className="space-y-6">
            {data.categories.map((cat) =>
              cat.subcategories.map((sub) => (
                <div key={`${cat.name}-${sub.name}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-[var(--violet)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      {cat.name} <span className="text-[var(--text-muted)] mx-1">›</span> {sub.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(sub.skills ?? []).map((skill, i) => (
                      <SkillChip key={skill} label={skill} variant="neutral" delayIndex={i} />
                    ))}
                  </div>
                </div>
              ))
            )}
            {data.categories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 opacity-70">
                <Search className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                <p className="text-base font-medium text-[var(--text-secondary)]">
                  No skills found matching "{debouncedQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Browse Mode — category accordion */}
      {!isLoading && data && !isSearching && (
        <div className="flex flex-col gap-4">
          {data.categories.map((cat: CategoryOut) => {
            const totalSkills = cat.subcategories.reduce((sum, s) => sum + s.skill_count, 0);
            const isExpanded = expandedCategory === cat.name;

            return (
              <div key={cat.name} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden transition-all duration-200">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                  className="w-full flex items-center justify-between p-5 hover:bg-[var(--bg-elevated)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-muted)] border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[var(--accent-bright)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-display font-bold text-[var(--text-primary)]">{cat.name}</p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                        {cat.subcategories.length} subcategories · {totalSkills.toLocaleString()} total skills
                      </p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-[var(--bg-elevated)]' : ''}`}>
                    {isExpanded
                      ? <ChevronDown className="w-5 h-5 text-[var(--text-primary)]" />
                      : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-base)] px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.name} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[var(--accent)]/30 transition-colors">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{sub.name}</span>
                          <span className="text-xs font-bold text-[var(--accent-bright)] bg-[var(--accent-muted)] px-2.5 py-1 rounded-full">
                            {sub.skill_count}
                          </span>
                        </div>
                      ))}
                    </div>
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
