import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, X, Cpu, ChevronLeft, ChevronRight, Copy, Check, Sparkles, Download, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AgentPipeline, type AgentState } from "@/components/sh/AgentPipeline";
import { Button, Card, Chip, EmptyState, Label, PillToggle, ScoreGauge, Avatar } from "@/components/sh/primitives";
import { api } from "@/utils/api";
export type Job = { id: string; title: string; company: string; description?: string; required_skills?: string[] };
import { fmtBytes } from "@/lib/ui";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Resumes — Smart Hire" },
      { name: "description", content: "Upload resumes and run them through the 3-agent AI pipeline for semantic skill matching." },
      { property: "og:title", content: "Analyze Resumes — Smart Hire" },
    ],
  }),
  component: AnalyzePage,
});

type QueueItem = { file: File; status: "queued" | "processing" | "done" | "error" };

function AnalyzePage() {
  const [mode, setMode] = useState<"single" | "multiple">("multiple");
  const [files, setFiles] = useState<QueueItem[]>([]);
  const [matchMode, setMatchMode] = useState<"job" | "custom">("job");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [customJD, setCustomJD] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pipeline, setPipeline] = useState<AgentState[]>(["idle", "idle", "idle"]);
  const [results, setResults] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tab, setTab] = useState<"overview" | "experience" | "skills" | "projects">("overview");
  const [insights, setInsights] = useState<any[] | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/api/v1/job-descriptions').then(setJobs).catch(() => setJobs([]));
  }, []);

  const onFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => /\.(pdf|docx)$/i.test(f.name));
    if (!arr.length) { toast.error("Please upload PDF or DOCX files"); return; }
    const limited = mode === "single" ? arr.slice(0, 1) : arr.slice(0, 50);
    setFiles((prev) => {
      const mapped = limited.map((file) => ({ file, status: "queued" as const }));
      return mode === "single" ? mapped : [...prev, ...mapped].slice(0, 50);
    });
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const runAnalysis = async () => {
    if (!files.length) { toast.error("Add resumes first"); return; }
    setAnalyzing(true);
    setPipeline(["active", "idle", "idle"]);
    setProgress(0);
    let tick: any = null;
    try {
      setFiles((p) => p.map((f) => ({ ...f, status: "processing" })));
      tick = setInterval(() => setProgress((p) => Math.min(95, p + 5)), 200);
      setTimeout(() => setPipeline(["complete", "active", "idle"]), 600);
      setTimeout(() => setPipeline(["complete", "complete", "active"]), 1400);

      let targetJobId = jobId;
      if (matchMode === "custom") {
        if (!customJD.trim()) {
          toast.error("Please provide custom job description text");
          clearInterval(tick);
          setAnalyzing(false);
          return;
        }
        try {
          const newJd = await api.post('/api/v1/job-descriptions', {
            title: `Custom JD (${new Date().toLocaleDateString()})`,
            company: 'Custom',
            raw_text: customJD,
            required_skills: skills
          });
          targetJobId = newJd.id;
          api.get('/api/v1/job-descriptions').then(setJobs).catch(() => {});
        } catch (e) {
          toast.error("Failed to save custom job description");
          clearInterval(tick);
          setAnalyzing(false);
          return;
        }
      }

      if (mode === "single") {
        const fd = new FormData();
        fd.append("file", files[0].file);
        fd.append("job_id", targetJobId || "senior_fullstack");
        const res = await api.postForm('/api/v1/parse', fd);
        clearInterval(tick);
        setProgress(100);
        setPipeline(["complete", "complete", "complete"]);
        setFiles((p) => p.map((f) => ({ ...f, status: "done" })));
        if (res) {
          const mappedCandidate = {
            id: res.candidate_id,
            name: res.personal_info?.name || res.parsed_data?.name || "Candidate",
            email: res.personal_info?.email || res.parsed_data?.email,
            match_score: res.match_score,
            job_title: res.job_description?.title,
            matched_skills: res.skill_overlap?.matched || [],
            missing_skills: res.skill_overlap?.missing || [],
            skills: (res.skills || []).map((s: any) => typeof s === 'string' ? s : s.canonical),
            experience: (res.work_experience || []).map((e: any) => ({
              title: e.role,
              company: e.company,
              duration: e.start_date && e.end_date ? `${e.start_date} - ${e.end_date}` : `${e.duration_months || 0} months`,
              description: (e.responsibilities || []).join(". ")
            })),
            projects: (res.projects || []).map((p: any) => ({
              name: p.title,
              description: p.description
            }))
          };
          setResults([mappedCandidate]);
        } else {
          toast.error("Analysis returned no results");
        }
        setAnalyzing(false);
      } else {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f.file));
        const path = targetJobId ? `/api/v1/parse/batch?job_id=${targetJobId}` : '/api/v1/parse/batch';
        const batchRes = await api.postForm(path, fd);
        const batchId = batchRes.batch_id;
        clearInterval(tick);

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.get(`/api/v1/jobs/${batchId}/status`);
            setProgress(Math.round(statusRes.percent || 0));

            if (statusRes.percent >= 100 || statusRes.status === 'done') {
              clearInterval(pollInterval);
              setPipeline(["complete", "complete", "complete"]);
              setFiles((p) => p.map((f) => ({ ...f, status: "done" })));

              const mappedResults = (statusRes.results || []).map((res: any) => {
                const pd = res.parsed_data || {};
                return {
                  id: res.candidate_id || res.id,
                  name: pd.personal_info?.name || pd.name || res.name || "Candidate",
                  email: pd.personal_info?.email || pd.email || res.email,
                  match_score: res.match_score || 0,
                  job_title: res.job_description?.title || "",
                  matched_skills: res.skill_overlap?.matched || [],
                  missing_skills: res.skill_overlap?.missing || [],
                  skills: (pd.skills || pd.technical_skills || []).map((s: any) => typeof s === 'string' ? s : s.canonical),
                  experience: (pd.work_experience || pd.experience || []).map((e: any) => ({
                    title: e.role || e.title,
                    company: e.company,
                    duration: e.start_date && e.end_date ? `${e.start_date} - ${e.end_date}` : `${e.duration_months || 0} months`,
                    description: Array.isArray(e.responsibilities) ? e.responsibilities.join(". ") : ""
                  })),
                  projects: (pd.projects || []).map((p: any) => ({
                    name: p.title || p.name,
                    description: p.description
                  }))
                };
              });
              setResults(mappedResults);
              setAnalyzing(false);
            }
          } catch (err) {
            clearInterval(pollInterval);
            setAnalyzing(false);
            toast.error("Error polling batch status");
          }
        }, 2000);
      }
    } catch (e: any) {
      if (tick) clearInterval(tick);
      setAnalyzing(false);
      toast.error(e.message || "Failed to analyze resume");
    }
  };

  const removeFile = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const current = results[currentIdx];
  const matchScore = current?.match_score ?? current?.score ?? 0;
  const candidateId = current?.id ?? current?.candidate_id ?? "";

  const copyId = () => {
    if (!candidateId) return;
    navigator.clipboard.writeText(candidateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fetchInsights = async () => {
    if (!results.length) return;
    setLoadingInsights(true);
    try {
      const ids = results.map((r) => r.id ?? r.candidate_id).filter(Boolean);
      const activeJob = jobs.find(j => j.id === jobId);
      const res = await api.post('/api/v1/insights/batch', {
        candidate_ids: ids,
        job_description: matchMode === 'custom' ? customJD : (activeJob?.description || ""),
        job_title: activeJob?.title || "Target Role"
      });
      if (res?.leaderboard || res?.insights) {
        setInsights(res.leaderboard || res.insights);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch AI insights");
    } finally { setLoadingInsights(false); }
  };

  const exportCsv = () => {
    if (!insights) return;
    const rows = [["Name", "Match", "AI Fit", "Recommendation"], ...insights.map((r: any) => [r.name, r.match_score, r.ai_fit, r.recommendation])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "smart-hire-insights.csv";
    a.click();
  };

  const matchedSkills: string[] = current?.matched_skills ?? [];
  const missingSkills: string[] = current?.missing_skills ?? [];
  const allSkills: string[] = current?.skills ?? [];

  return (
    <div className="flex flex-col">
      {/* Sub header */}
      <div className="border-b border-border-subtle px-10 py-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-text-primary">Resume Analyzer</h1>
            <p className="mt-1 text-[13px] text-text-secondary">Upload & analyse resumes with the 3-agent AI pipeline</p>
          </div>
          {results.length > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.12)] px-3 py-1.5 text-[12px] font-semibold text-green">
              <Check className="h-3.5 w-3.5" /> {results.length} resume{results.length > 1 ? "s" : ""} analysed
            </div>
          )}
        </div>
      </div>

      {/* Pipeline bar */}
      <div className="border-b border-border-subtle px-10 py-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>Agent Pipeline {results.length > 0 && <span className="ml-2 normal-case text-green">· ✓ {results.length} resume{results.length > 1 ? "s" : ""} processed</span>}</Label>
        </div>
        <AgentPipeline states={pipeline} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-border-subtle">
        {/* LEFT: SETUP */}
        <div className="space-y-5 p-10">
          <Label>Setup · Upload & configure</Label>

          {/* mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: "single" as const, t: "Single", s: "1 resume at a time", I: FileText },
              { v: "multiple" as const, t: "Multiple", s: "Up to 50 resumes", I: Upload },
            ].map((o) => {
              const Icon = o.I;
              const active = mode === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`flex items-center gap-3 rounded-[14px] border bg-card p-4 text-left transition-all cursor-pointer ${
                    active ? "border-primary shadow-glow-purple" : "border-border-subtle hover:border-border-default"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${active ? "bg-primary text-white" : "bg-elevated text-text-secondary"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">{o.t}</div>
                    <div className="text-[12px] text-text-muted">{o.s}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Upload zone */}
          <div
            ref={dropRef}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add("bg-[rgba(124,58,237,0.05)]"); }}
            onDragLeave={() => dropRef.current?.classList.remove("bg-[rgba(124,58,237,0.05)]")}
            onDrop={(e) => { e.preventDefault(); dropRef.current?.classList.remove("bg-[rgba(124,58,237,0.05)]"); onFiles(e.dataTransfer.files); }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[rgba(124,58,237,0.4)] px-6 py-12 text-center transition-all hover:border-primary hover:bg-[rgba(124,58,237,0.05)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.15)]">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 text-[15px] font-semibold text-text-primary">Drop {mode === "multiple" ? "multiple resumes" : "a resume"}</div>
            <div className="mt-1 text-[12px] text-text-muted">PDF or DOCX · {mode === "multiple" ? "Up to 50 files · " : ""}Max 10 MB each</div>
            <input ref={fileRef} type="file" hidden multiple={mode === "multiple"} accept=".pdf,.docx" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          </div>

          {/* File queue */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex h-12 items-center gap-3 rounded-[10px] border border-border-subtle bg-card px-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(124,58,237,0.15)] text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text-primary">{f.file.name}</div>
                    <div className="text-[11px] text-text-muted">{fmtBytes(f.file.size)}</div>
                  </div>
                  <Chip variant={f.status === "done" ? "green" : f.status === "processing" ? "amber" : f.status === "error" ? "red" : "amber"}>{f.status.toUpperCase()}</Chip>
                  <button onClick={() => removeFile(i)} className="rounded p-1 text-text-muted hover:text-red cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {analyzing && (
                <div className="rounded-[10px] border border-border-subtle bg-card p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                    <span className="text-amber">Processing {files.filter(f => f.status !== "queued").length} / {files.length} Resumes…</span>
                    <span className="text-text-secondary">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full bg-gradient-amber transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Match against */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Match Against</Label>
              <PillToggle value={matchMode} onChange={setMatchMode} options={[{ value: "job", label: "Select Job" }, { value: "custom", label: "Custom JD" }]} />
            </div>
            {matchMode === "job" ? (
              <div className="relative">
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="h-10 w-full appearance-none rounded-[10px] border border-border-subtle bg-card px-3 pr-9 text-[13px] text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select a job…</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            ) : (
              <textarea
                value={customJD}
                onChange={(e) => setCustomJD(e.target.value)}
                placeholder="Paste the job description here…"
                className="min-h-[120px] w-full resize-y rounded-[10px] border border-border-subtle bg-card p-3 font-mono text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
              />
            )}
            <div>
              <Label className="mb-2">Required Skills</Label>
              <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border-subtle bg-card p-2">
                {skills.map((s) => (
                  <Chip key={s} variant="purple">
                    {s}
                    <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="ml-1 cursor-pointer text-primary/70 hover:text-primary"><X className="h-3 w-3" /></button>
                  </Chip>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter"
                  className="min-w-[160px] flex-1 bg-transparent px-2 py-1 text-[13px] outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <Button variant="primary" className="h-[42px] w-full" disabled={analyzing || !files.length} onClick={runAnalysis}>
            <Sparkles className="h-4 w-4" /> {analyzing ? "Analysing…" : `Analyse ${files.length || ""} Resume${files.length === 1 ? "" : "s"}`}
          </Button>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="space-y-5 p-10">
          <Label>Results · AI-powered analysis</Label>

          {!results.length ? (
            <Card className="p-2">
              <EmptyState
                color="amber"
                icon={<Cpu className="h-6 w-6" />}
                title="Ready to Analyse"
                subtitle="Upload resumes on the left and pick a job. Results will appear here in seconds."
              />
            </Card>
          ) : (
            <>
              {/* Resume nav */}
              <Card className="flex items-center justify-between p-3">
                <button onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0} className="rounded-full p-2 text-text-secondary hover:bg-elevated disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
                <div className="text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">Resume {currentIdx + 1} of {results.length}</div>
                  <div className="text-[14px] font-semibold text-text-primary">{current?.name ?? "Candidate"}</div>
                </div>
                <button onClick={() => setCurrentIdx((i) => Math.min(results.length - 1, i + 1))} disabled={currentIdx >= results.length - 1} className="rounded-full p-2 text-text-secondary hover:bg-elevated disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
              </Card>

              {/* Saved banner */}
              {candidateId && (
                <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] px-4 py-2.5">
                  <div className="h-2 w-2 rounded-full bg-green" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-green">{results.length} Candidate{results.length > 1 ? "s" : ""} Saved</span>
                  <span className="ml-2 truncate font-mono text-[12px] text-text-secondary">{candidateId}</span>
                  <button onClick={copyId} className="ml-auto inline-flex items-center gap-1 text-[12px] text-green hover:underline cursor-pointer">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy ID"}
                  </button>
                </div>
              )}

              {/* Candidate header */}
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={current?.name} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[18px] font-bold text-text-primary">{current?.name ?? "—"}</div>
                    <div className="text-[13px] text-text-secondary">{current?.email ?? "—"}</div>
                    <div className="mt-1 text-[12px] text-text-muted">Resume processed successfully.</div>
                  </div>
                  <ScoreGauge score={matchScore} />
                </div>
                {current?.job_title && (
                  <div className="mt-4 border-t border-border-subtle pt-4">
                    <Label className="mb-1">Matched Against</Label>
                    <div className="text-[14px] font-semibold text-primary">{current.job_title}</div>
                  </div>
                )}
              </Card>

              {/* Tabs */}
              <div className="border-b border-border-subtle">
                <div className="flex gap-6">
                  {([
                    ["overview", "Overview"],
                    ["experience", "Experience"],
                    ["skills", "Skills"],
                    ["projects", "Projects & Certs"],
                  ] as const).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={`relative pb-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer ${tab === k ? "text-primary" : "text-text-muted hover:text-text-secondary"}`}
                    >
                      {l}
                      {tab === k && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: "Match Score", v: `${Math.round(matchScore)}%` },
                      { l: "Skills Matched", v: matchedSkills.length },
                      { l: "Skills Missing", v: missingSkills.length },
                      { l: "Experience", v: `${current?.experience_years ?? 0}y` },
                    ].map((s, i) => (
                      <Card key={i} className="p-3 text-center">
                        <div className="text-[20px] font-bold text-gradient">{s.v}</div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.l}</div>
                      </Card>
                    ))}
                  </div>
                  <div>
                    <Label className="mb-2">Technical Skills {matchedSkills.length}/{matchedSkills.length + missingSkills.length} matched</Label>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.length ? matchedSkills.map((s) => <Chip key={s} variant="green">{s}</Chip>) : <span className="text-[12px] text-text-muted">No matched skills</span>}
                    </div>
                  </div>
                  {missingSkills.length > 0 && (
                    <div>
                      <Label className="mb-2">Missing Required Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {missingSkills.map((s) => <Chip key={s} variant="red">{s}</Chip>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "skills" && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.length ? allSkills.map((s: string) => <Chip key={s} variant="purple">{s}</Chip>) : <EmptyState icon={<Cpu className="h-5 w-5" />} title="No skills extracted" />}
                </div>
              )}

              {tab === "experience" && (
                <div className="space-y-3">
                  {(current?.experience ?? []).length ? (current.experience as any[]).map((e, i) => (
                    <Card key={i} className="p-4">
                      <div className="text-[14px] font-semibold text-text-primary">{e.title ?? e.role}</div>
                      <div className="text-[12px] text-text-secondary">{e.company} · {e.duration}</div>
                      {e.description && <div className="mt-2 text-[13px] text-text-secondary">{e.description}</div>}
                    </Card>
                  )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No experience data" />}
                </div>
              )}

              {tab === "projects" && (
                <div className="space-y-3">
                  {(current?.projects ?? []).length ? (current.projects as any[]).map((p, i) => (
                    <Card key={i} className="p-4">
                      <div className="text-[14px] font-semibold text-text-primary">{p.name}</div>
                      {p.description && <div className="mt-1 text-[13px] text-text-secondary">{p.description}</div>}
                    </Card>
                  )) : <EmptyState icon={<FileText className="h-5 w-5" />} title="No projects" />}
                </div>
              )}

              {/* AI Insights */}
              {insights ? (
                <Card className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <Label>AI Insights Leaderboard</Label>
                      <div className="mt-1 text-[13px] text-text-secondary">{insights.length} candidates sorted by AI fit score</div>
                    </div>
                    <Button variant="secondary" className="h-9 px-4 text-[12px]" onClick={exportCsv}>
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-[10px] border border-border-subtle">
                    <div className="grid grid-cols-[1.5fr_80px_100px_140px_24px] gap-3 border-b border-border-subtle bg-elevated px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      <div>Name</div><div>Match</div><div>AI Fit</div><div>Recommendation</div><div></div>
                    </div>
                    {insights.map((r: any, i: number) => {
                      const open = expanded.has(i);
                      return (
                        <div key={i} className="border-b border-border-subtle last:border-0">
                          <button onClick={() => { const n = new Set(expanded); n.has(i) ? n.delete(i) : n.add(i); setExpanded(n); }} className="grid w-full grid-cols-[1.5fr_80px_100px_140px_24px] items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-card-hover">
                            <div>
                              <div className="text-[13px] font-semibold text-text-primary">{r.name}</div>
                              <div className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">{r.summary}</div>
                            </div>
                            <div className="text-[13px] font-semibold text-text-primary">{r.match_score ?? "—"}</div>
                            <Chip variant={r.ai_fit >= 75 ? "green" : r.ai_fit >= 50 ? "amber" : "red"}>{r.ai_fit ?? "—"}</Chip>
                            <div className="text-[12px] font-semibold" style={{ color: r.recommendation === "Strong" ? "#10b981" : r.recommendation === "Maybe" ? "#f59e0b" : "#ef4444" }}>{r.recommendation ?? "—"}</div>
                            <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                          {open && (
                            <div className="grid grid-cols-2 gap-4 border-t border-border-subtle bg-bg/50 p-4">
                              <div>
                                <Label className="mb-2">Top Strengths</Label>
                                <ul className="space-y-1 text-[12px] text-text-secondary">
                                  {(r.strengths ?? []).map((s: string, i: number) => <li key={i}>· {s}</li>)}
                                </ul>
                              </div>
                              <div>
                                <Label className="mb-2">Top Gaps</Label>
                                <ul className="space-y-1 text-[12px] text-text-secondary">
                                  {(r.gaps ?? []).map((g: string, i: number) => <li key={i}>· {g}</li>)}
                                </ul>
                              </div>
                              {r.verdict && (
                                <div className="col-span-2 rounded-[10px] border border-border-subtle bg-card p-3">
                                  <Label className="mb-1">Verdict</Label>
                                  <div className="text-[13px] text-text-secondary">{r.verdict}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <Button variant="amber" className="h-[42px] w-full" disabled={loadingInsights} onClick={fetchInsights}>
                  <Sparkles className="h-4 w-4" /> {loadingInsights ? "Loading…" : "Get AI Insights"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
