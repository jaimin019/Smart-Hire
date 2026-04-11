import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Navbar from '@/components/Navbar';
import LandingPage from '@/pages/LandingPage';
import AnalyzePage from '@/pages/AnalyzePage';
import CandidatesPage from '@/pages/CandidatesPage';
import CandidateDetailPage from '@/pages/CandidateDetailPage';
import ComparePage from '@/pages/ComparePage';
import TaxonomyPage from '@/pages/TaxonomyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] py-5 mt-auto">
      <div className="max-w-[1700px] mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Built with LangGraph · FastAPI · React · Sentence-Transformers
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Smart Hire © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:id" element={<CandidateDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/taxonomy" element={<TaxonomyPage />} />
              {/* Catch-all → landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
