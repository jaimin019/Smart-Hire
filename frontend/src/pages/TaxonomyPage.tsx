import { BookOpen } from 'lucide-react';
import SkillTaxonomy from '@/components/SkillTaxonomy';

export default function TaxonomyPage() {
  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40">
        <div className="max-w-[1700px] mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-emerald)]/15 border border-[var(--color-emerald)]/20 flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-[var(--color-emerald)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Skill Taxonomy</h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">Browse and search thousands of normalized technical skills</p>
          </div>
        </div>
      </div>

      <main className="max-w-[1700px] mx-auto w-full px-6 py-8">
        <SkillTaxonomy />
      </main>
    </div>
  );
}
