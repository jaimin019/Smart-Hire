import { GitCompare } from 'lucide-react';
import CandidateCompare from '@/components/CandidateCompare';

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40">
        <div className="max-w-[1700px] mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-violet)]/15 border border-[var(--color-violet)]/20 flex items-center justify-center">
            <GitCompare className="w-4.5 h-4.5 text-[var(--color-violet)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Compare Candidates</h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">1-vs-1 head-to-head or multi-candidate leaderboard ranking</p>
          </div>
        </div>
      </div>

      <main className="max-w-[1700px] mx-auto w-full px-6 py-8">
        <CandidateCompare hideHeader />
      </main>
    </div>
  );
}
