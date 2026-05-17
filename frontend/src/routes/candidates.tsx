import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Upload, RefreshCw, ChevronRight, Trash2, X, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/utils/api";
export type Candidate = {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  skills?: string[];
  experience_years?: number;
  data?: any;
};
import { Button, Card, Chip, EmptyState, Label, Avatar, Skeleton } from "@/components/sh/primitives";
import { fmtDate } from "@/lib/ui";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Smart Hire" },
      { name: "description", content: "Browse all parsed candidates stored in your Smart Hire database." },
      { property: "og:title", content: "Candidates — Smart Hire" },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const [data, setData] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "date">("date");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/candidates');
      const list = res.candidates || [];
      setData(Array.isArray(list) ? list : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const lower = q.toLowerCase();
    const out = data.filter((c) =>
      !q || (c.name?.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower) || c.id?.toLowerCase().includes(lower))
    );
    out.sort((a, b) => sort === "name"
      ? (a.name ?? "").localeCompare(b.name ?? "")
      : (b.created_at ?? "").localeCompare(a.created_at ?? "")
    );
    return out;
  }, [data, q, sort]);

  const onDelete = async () => {
    if (!confirmId) return;
    try {
      await api.delete('/api/v1/candidates/' + confirmId);
      toast.success("Candidate deleted");
      setData((d) => d?.filter((c) => c.id !== confirmId) ?? []);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete candidate");
    }
    finally { setConfirmId(null); }
  };

  return (
    <div className="px-10 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary">Candidates</h1>
          <p className="mt-1 text-[13px] text-text-secondary">{data ? `${data.length} candidates stored` : "Loading…"}</p>
        </div>
        <Link to="/analyze">
          <Button variant="primary"><Upload className="h-4 w-4" /> Upload Resume</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, ID…"
            className="h-10 w-full rounded-full border border-border-subtle bg-card pl-9 pr-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
          />
        </div>
        <button onClick={() => setSort("name")} className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold cursor-pointer ${sort === "name" ? "bg-primary text-white border-primary shadow-glow-purple" : "border-border-subtle text-text-secondary hover:text-text-primary"}`}>Name</button>
        <button onClick={() => setSort("date")} className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold cursor-pointer ${sort === "date" ? "bg-primary text-white border-primary shadow-glow-purple" : "border-border-subtle text-text-secondary hover:text-text-primary"}`}>Date</button>
        <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-card text-text-secondary hover:text-text-primary cursor-pointer">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <div className="mx-2 h-6 w-px bg-border-subtle" />
        <span className="text-[13px] text-text-muted">{data ? `Showing ${filtered.length} of ${data.length} candidates` : "Loading…"}</span>
        <Link to="/compare" className="ml-auto text-[13px] font-semibold text-primary hover:underline">Compare Candidates →</Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[110px]" />)
          : filtered.length === 0
          ? (
            <div className="col-span-full">
              <Card className="p-2">
                <EmptyState icon={<Search className="h-6 w-6" />} title={data?.length ? "No matches" : "No candidates yet"} subtitle={data?.length ? "Try a different search query." : "Upload your first resume to get started."} />
              </Card>
            </div>
          )
          : filtered.map((c, i) => (
            <Card key={c.id} hover delay={i * 30} className="group relative cursor-pointer p-4 pr-10" onClick={() => setOpenId(c.id)}>
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-text-primary">{c.name ?? "Unnamed"}</div>
                  <div className="truncate text-[12px] text-text-muted">{c.email ?? "—"}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12px] text-text-muted">{fmtDate(c.created_at)}</div>
                <Chip variant="green">Saved</Chip>
              </div>
              <div className="mt-2 truncate font-mono text-[11px] text-text-muted">{c.id}</div>
              <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <button onClick={(e) => { e.stopPropagation(); setConfirmId(c.id); }} className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-[rgba(239,68,68,0.15)] hover:text-red group-hover:flex cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
      </div>

      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setConfirmId(null)}>
          <Card className="max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-[16px] font-semibold text-text-primary">Delete candidate?</div>
            <div className="mt-2 text-[13px] text-text-secondary">This permanently removes the candidate from the database. This cannot be undone.</div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button variant="danger" onClick={onDelete}>Delete</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Profile modal */}
      {openId && <ProfileModal candidateId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

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
