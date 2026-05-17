import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, GitCompareArrows, Zap, Trophy, ChevronDown } from "lucide-react";
import { api } from "@/utils/api";
export type Candidate = { id: string; name?: string; email?: string; created_at?: string; skills?: string[]; experience_years?: number };
export type Job = { id: string; title: string; company: string; description?: string; required_skills?: string[] };
import { Avatar, Button, Card, Chip, EmptyState, Label, PillToggle, ScoreBadge, Skeleton } from "@/components/sh/primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Candidates — Smart Hire" },
      { name: "description", content: "Rank and compare candidates side-by-side using semantic skill matching." },
      { property: "og:title", content: "Compare Candidates — Smart Hire" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [mode, setMode] = useState<"multi" | "1v1">("multi");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [jobId, setJobId] = useState("");
  const [threshold, setThreshold] = useState(0);
  const [topK, setTopK] = useState(0);
  const [ranking, setRanking] = useState<any[] | null>(null);
  const [loadingRank, setLoadingRank] = useState(false);

  useEffect(() => {
    api.get('/api/v1/candidates').then((res) => setCandidates(Array.isArray(res.candidates) ? res.candidates : [])).catch(() => setCandidates([]));
    api.get('/api/v1/job-descriptions').then(setJobs).catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    if (!candidates) return [];
    const lc = q.toLowerCase();
    return candidates.filter((c) => !q || c.name?.toLowerCase().includes(lc) || c.email?.toLowerCase().includes(lc));
  }, [candidates, q]);

  const toggle = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else {
      if (mode === "1v1" && n.size >= 2) return;
      n.add(id);
    }
    setSelected(n);
  };

  const selectAll = () => {
    if (mode === "1v1") return;
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const total = candidates?.length ?? 0;
  const maxK = selected.size || total;

  const rank = async () => {
    if (selected.size < 2) return;
    setLoadingRank(true);
    try {
      const job = jobs.find(j => j.id === jobId);
      const res = await api.post('/api/v1/match', {
        candidate_ids: Array.from(selected),
        job_description: job?.description || job?.title || "Required Role",
        threshold: threshold / 100,
        top_k: topK || 0
      });
      const resultsMapped = (res?.results || []).map((r: any) => ({
        id: r.candidate_id,
        name: r.name,
        email: r.current_title,
        score: r.overall_score,
        matched_skills: r.matched_skills,
        missing_skills: r.missing_skills,
        recommendation: r.recommendation
      }));
      setRanking(resultsMapped);
    } catch (e: any) {
      toast.error(e.message || "Failed to rank candidates");
    } finally { setLoadingRank(false); }
  };

  return (
    <div className="grid min-h-[calc(100vh-56px-56px)] grid-cols-1 lg:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="border-r border-border-subtle p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-bold text-text-primary">Compare Candidates</h2>
            <p className="mt-1 text-[13px] text-text-secondary">Select candidates and rank them</p>
          </div>
          <PillToggle value={mode} onChange={(v) => { setMode(v); setSelected(new Set()); }} options={[{ value: "multi", label: `Multi (${selected.size})` }, { value: "1v1", label: "1 vs 1" }]} />
        </div>

        <div className="mt-5 space-y-3">
          <Label>Select Candidates ({mode === "1v1" ? "2" : "2–50"})</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-full rounded-[10px] border border-border-subtle bg-card pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
          </div>
          {mode === "multi" && (
            <button onClick={selectAll} className="text-[12px] font-semibold text-primary hover:underline cursor-pointer">{selected.size === filtered.length && filtered.length ? "Clear All" : "Select All"}</button>
          )}
          <div className="max-h-[40vh] overflow-y-auto rounded-[10px] border border-border-subtle bg-card">
            {candidates === null ? (
              <div className="space-y-2 p-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-text-muted">No candidates</div>
            ) : filtered.map((c) => (
              <label key={c.id} className="flex h-11 cursor-pointer items-center gap-3 border-b border-border-subtle px-3 last:border-0 hover:bg-card-hover">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-primary cursor-pointer" />
                <Avatar name={c.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-text-primary">{c.name ?? "Unnamed"}</div>
                  <div className="truncate text-[11px] text-text-muted">{c.email ?? "—"}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="text-[12px] text-text-muted">{selected.size} selected of {total}</div>

          <div>
            <Label className="mb-2">Job Description</Label>
            <div className="relative">
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-9 w-full appearance-none rounded-[10px] border border-border-subtle bg-card px-3 pr-9 text-[13px] outline-none focus:border-primary">
                <option value="">Select a job…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Label>Result Filters</Label>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-text-secondary">Match Threshold</span>
            <span className="font-semibold text-text-primary">{threshold === 0 ? "Off" : `${threshold}%`}</span>
          </div>
          <input type="range" min={0} max={100} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="h-1 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-primary" />
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-text-secondary">Top K Candidates</span>
            <input
              type="number" min={0} max={maxK} value={topK || ""} placeholder={String(maxK || 0)}
              onChange={(e) => setTopK(Math.min(maxK, Math.max(0, +e.target.value || 0)))}
              className="h-8 w-16 rounded-[8px] border border-border-subtle bg-card text-center text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div className="text-right text-[11px] text-text-muted">{topK === 0 || topK >= maxK ? "All" : `Top ${topK}`}</div>
        </div>

        <Button variant="primary" className="mt-6 h-[42px] w-full" disabled={selected.size < 2 || loadingRank} onClick={rank}>
          <Zap className="h-4 w-4" /> {loadingRank ? "Ranking…" : "Rank Candidates"}
        </Button>
      </aside>

      {/* Right panel */}
      <section className="p-10">
        {!ranking ? (
          <Card className="p-2">
            <EmptyState icon={<GitCompareArrows className="h-6 w-6" />} title="Ready to Compare" subtitle="Select 2 or more candidates and a job, then click Rank to see the leaderboard." />
          </Card>
        ) : ranking.length === 0 ? (
          <Card className="p-2"><EmptyState icon={<GitCompareArrows className="h-6 w-6" />} title="No results above threshold" subtitle="Lower the match threshold or pick different candidates." /></Card>
        ) : (
          <div className="space-y-4">
            <Label>Leaderboard · {ranking.length} candidates</Label>
            {ranking.map((r: any, i: number) => (
              <Card key={r.id ?? i} delay={i * 50} className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${i === 0 ? "bg-amber text-white" : i === 1 ? "bg-text-muted text-white" : i === 2 ? "bg-[#cd7f32] text-white" : "bg-elevated text-text-secondary"}`}>
                    {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                  </div>
                  <Avatar name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-text-primary">{r.name ?? "—"}</div>
                    <div className="text-[12px] text-text-muted">{r.email ?? r.summary ?? "—"}</div>
                  </div>
                  <ScoreBadge score={r.score ?? r.match_score ?? 0} />
                </div>
                {(r.matched_skills?.length || r.missing_skills?.length) && (
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
                    <div>
                      <Label className="mb-2">Matched</Label>
                      <div className="flex flex-wrap gap-1.5">{(r.matched_skills ?? []).slice(0, 8).map((s: string) => <Chip key={s} variant="green">{s}</Chip>)}</div>
                    </div>
                    <div>
                      <Label className="mb-2">Missing</Label>
                      <div className="flex flex-wrap gap-1.5">{(r.missing_skills ?? []).slice(0, 8).map((s: string) => <Chip key={s} variant="red">{s}</Chip>)}</div>
                    </div>
                  </div>
                )}
                {r.recommendation && (
                  <div className="mt-4 rounded-[10px] border border-border-subtle bg-bg/50 p-3">
                    <Label className="mb-1">AI Recommendation</Label>
                    <div className="text-[13px] text-text-secondary">{r.recommendation}</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
