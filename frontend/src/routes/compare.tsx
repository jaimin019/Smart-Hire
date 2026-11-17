import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, GitCompareArrows, Zap, Trophy, ChevronDown, X, Download, FileText, Edit3 } from "lucide-react";
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
  const [jdMode, setJdMode] = useState<"preset" | "custom">("preset");
  const [customJd, setCustomJd] = useState("");
  const [threshold, setThreshold] = useState(0);
  const [topK, setTopK] = useState(0);
  const [ranking, setRanking] = useState<any[] | null>(null);
  const [loadingRank, setLoadingRank] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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

    // Determine the job description text to send
    let jobDescriptionText = "";
    if (jdMode === "custom") {
      if (!customJd.trim()) {
        toast.error("Please enter a custom job description.");
        return;
      }
      jobDescriptionText = customJd.trim();
    } else {
      const job = jobs.find(j => j.id === jobId);
      jobDescriptionText = job?.description || job?.title || "Required Role";
    }

    setLoadingRank(true);
    try {
      const res = await api.post('/api/v1/match', {
        candidate_ids: Array.from(selected),
        job_description: jobDescriptionText,
        threshold: threshold / 100,
        top_k: topK || 0
      });
      const resultsMapped = (res?.results || []).map((r: any) => ({
        id: r.candidate_id,
        name: r.name,
        email: r.email,
        current_title: r.current_title,
        score: r.overall_score,
        matched_skills: r.matched_skills,
        missing_skills: r.missing_skills,
        recommendation: r.recommendation,
        experience_years: r.experience_years,
        education: r.education,
        skills: r.skills
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

          {/* Job Description Section with Preset/Custom toggle */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Job Description</Label>
              <div className="flex rounded-[8px] border border-border-subtle overflow-hidden">
                <button
                  onClick={() => setJdMode("preset")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${jdMode === "preset" ? "bg-primary text-white" : "text-text-muted hover:text-text-secondary"}`}
                >
                  <FileText className="h-3 w-3" />
                  Preset
                </button>
                <button
                  onClick={() => setJdMode("custom")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${jdMode === "custom" ? "bg-primary text-white" : "text-text-muted hover:text-text-secondary"}`}
                >
                  <Edit3 className="h-3 w-3" />
                  Custom
                </button>
              </div>
            </div>

            {jdMode === "preset" ? (
              <div className="relative">
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-9 w-full appearance-none rounded-[10px] border border-border-subtle bg-card px-3 pr-9 text-[13px] outline-none focus:border-primary">
                  <option value="">Select a job…</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={customJd}
                  onChange={(e) => setCustomJd(e.target.value)}
                  placeholder="Paste or type a job description here…&#10;&#10;e.g. Looking for a Senior Backend Developer with 3+ years of experience in Python, FastAPI, PostgreSQL, Docker, and AWS. Must have experience with microservices architecture and CI/CD pipelines."
                  className="h-32 w-full resize-none rounded-[10px] border border-border-subtle bg-card p-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                />
                <div className="text-right text-[11px] text-text-muted">{customJd.length} characters</div>
              </div>
            )}
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
              <Card
                key={r.id ?? i}
                delay={i * 50}
                hover
                className="p-5 cursor-pointer transition-all hover:border-primary/50"
                onClick={() => setOpenId(r.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${i === 0 ? "bg-amber text-white" : i === 1 ? "bg-text-muted text-white" : i === 2 ? "bg-[#cd7f32] text-white" : "bg-elevated text-text-secondary"}`}>
                    {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                  </div>
                  <Avatar name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-text-primary">{r.name ?? "—"}</div>
                    <div className="text-[12px] text-text-muted">{r.current_title || r.email || "—"}</div>
                  </div>
                  <ScoreBadge score={r.score ?? r.match_score ?? 0} />
                </div>
                {(r.matched_skills?.length > 0 || r.missing_skills?.length > 0) && (
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

      {/* Profile modal — reused pattern from candidates page */}
      {openId && <ProfileModal candidateId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

/* ── Profile Modal (same pattern as candidates.tsx) ────────────────────────── */
function ProfileModal({ candidateId, onClose }: { candidateId: string; onClose: () => void }) {
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "experience" | "skills" | "projects">("overview");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/candidates/${candidateId}`);
        const pd = res.parsed_data || res;
        const mapped = {
          id: candidateId,
          name: pd.personal_info?.name || pd.name || "Candidate",
          email: pd.personal_info?.email || pd.email || "—",
          skills: (pd.skills || pd.technical_skills || []).map((s: any) => typeof s === 'string' ? s : s.canonical),
          experience_years: pd.experience_years || pd.personal_info?.experience_years || 0,
          experience: (pd.work_experience || pd.experience || []).map((e: any) => ({
            title: e.role || e.title,
            company: e.company,
            duration: e.start_date && e.end_date ? `${e.start_date} - ${e.end_date}` : `${e.duration_months || 0} months`,
            description: Array.isArray(e.responsibilities) ? e.responsibilities.join(". ") : ""
          })),
          projects: (pd.projects || []).map((p: any) => ({
            name: p.title || p.name,
            description: p.description
          })),
          certifications: pd.certifications || []
        };
        setCandidate(mapped);
      } catch (e: any) {
        toast.error("Failed to load candidate profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[800px] overflow-hidden rounded-[20px] border border-border-default bg-card shadow-card p-6 flex justify-center items-center min-h-[300px]">
          <div className="text-[14px] text-text-secondary animate-pulse">Loading Candidate Profile…</div>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const skills: string[] = candidate.skills ?? [];
  const exp: any[] = candidate.experience ?? [];
  const projects: any[] = candidate.projects ?? [];
  const certs: any[] = candidate.certifications ?? [];

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(candidate, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${candidate.name ?? candidate.id}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[800px] overflow-hidden rounded-[20px] border border-border-default bg-card shadow-card animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle p-6">
          <div className="flex items-center gap-4">
            <Avatar name={candidate.name} size={56} />
            <div>
              <div className="text-[18px] font-bold text-text-primary">{candidate.name ?? "—"}</div>
              <div className="text-[13px] text-text-secondary">{candidate.email ?? "—"}</div>
              <div className="mt-1 font-mono text-[11px] text-text-muted">{candidate.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-6 border-b border-border-subtle px-6">
          {([
            ["overview", "Overview"],
            ["experience", "Experience"],
            ["skills", "Skills"],
            ["projects", "Projects & Certs"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`relative py-3 text-[12px] font-semibold uppercase tracking-wider cursor-pointer ${tab === k ? "text-primary" : "text-text-muted hover:text-text-secondary"}`}>
              {l}
              {tab === k && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { l: "Skills", v: skills.length },
                  { l: "Experience", v: `${candidate.experience_years ?? 0}y` },
                  { l: "Projects", v: projects.length },
                  { l: "Certs", v: certs.length },
                ].map((s, i) => (
                  <div key={i} className="rounded-[10px] border border-border-subtle bg-bg/50 p-3 text-center">
                    <div className="text-[20px] font-bold text-gradient">{s.v}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.l}</div>
                  </div>
                ))}
              </div>
              {skills.length > 0 && (
                <div>
                  <Label className="mb-2">Skills</Label>
                  <div className="flex flex-wrap gap-2">{skills.slice(0, 30).map((s) => <Chip key={s} variant="purple">{s}</Chip>)}</div>
                </div>
              )}
            </div>
          )}
          {tab === "experience" && (
            <div className="space-y-3 border-l-2 border-primary pl-4">
              {exp.length ? exp.map((e: any, i: number) => (
                <div key={i} className="rounded-[10px] border border-border-subtle bg-bg/50 p-4">
                  <div className="text-[14px] font-semibold text-text-primary">{e.title ?? e.role}</div>
                  <div className="text-[12px] text-text-secondary">{e.company} · {e.duration}</div>
                  {e.description && <div className="mt-2 text-[13px] text-text-secondary">{e.description}</div>}
                </div>
              )) : <EmptyState icon={<X className="h-5 w-5" />} title="No experience data" />}
            </div>
          )}
          {tab === "skills" && (
            <div className="flex flex-wrap gap-2">
              {skills.length ? skills.map((s) => <Chip key={s} variant="purple">{s}</Chip>) : <EmptyState icon={<X className="h-5 w-5" />} title="No skills" />}
            </div>
          )}
          {tab === "projects" && (
            <div className="space-y-3">
              {projects.map((p: any, i: number) => (
                <div key={i} className="rounded-[10px] border border-border-subtle bg-bg/50 p-4">
                  <div className="text-[14px] font-semibold text-text-primary">{p.name}</div>
                  {p.description && <div className="mt-1 text-[13px] text-text-secondary">{p.description}</div>}
                </div>
              ))}
              {certs.length > 0 && (
                <div>
                  <Label className="mb-2">Certifications</Label>
                  <ul className="space-y-1 text-[13px] text-text-secondary">
                    {certs.map((c: any, i: number) => <li key={i}>· {typeof c === "string" ? c : c.name}</li>)}
                  </ul>
                </div>
              )}
              {!projects.length && !certs.length && <EmptyState icon={<X className="h-5 w-5" />} title="Nothing here yet" />}
              <Button variant="secondary" onClick={downloadJson}><Download className="h-4 w-4" /> Download JSON</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
