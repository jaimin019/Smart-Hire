import { GitCompare } from 'lucide-react';
import CandidateCompare from '@/components/CandidateCompare';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <PageHeader 
        title="Compare Candidates"
        subtitle="1-vs-1 head-to-head or multi-candidate leaderboard ranking"
        icon={<GitCompare className="w-5 h-5" />}
      />

      <main className="max-w-[1400px] mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        <CandidateCompare hideHeader />
      </main>
    </div>
  );
}
