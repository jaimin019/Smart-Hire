import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, FileText, Search, GitCompareArrows, BookOpen, Layers, Database } from "lucide-react";
import { AgentPipeline } from "@/components/sh/AgentPipeline";
import { Button, Card, Label } from "@/components/sh/primitives";
import { CountUp } from "@/components/sh/CountUp";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Hire — Hire Smarter with Multi-Agent AI" },
      { name: "description", content: "Upload resumes, extract skills, and rank candidates semantically — not by keywords. Three AI agents do in seconds what takes recruiters hours." },
      { property: "og:title", content: "Smart Hire — Hire Smarter with Multi-Agent AI" },
      { property: "og:description", content: "AI-powered resume parsing, skill matching, and candidate ranking." },
    ],
  }),
  component: HomePage,
});

const features = [
  { color: "primary", Icon: FileText, title: "AI Resume Parser", desc: "Extract structured data from any PDF or DOCX resume using GPT-4o — skills, experience, education and more." },
  { color: "secondary", Icon: Search, title: "Semantic Skill Matching", desc: "Sentence-Transformer embeddings score each candidate against job requirements with cosine similarity." },
  { color: "primary", Icon: GitCompareArrows, title: "Head-to-Head Compare", desc: "Run 1-vs-1 or multi-candidate leaderboard comparisons to instantly surface the top hire." },
  { color: "green", Icon: BookOpen, title: "Skill Taxonomy", desc: "Explore thousands of normalised tech skills across categories — searchable and browseable." },
  { color: "amber", Icon: Layers, title: "Multiple Resume Processing", desc: "Upload up to 50 resumes at once and get sequential AI analysis with a live progress tracker." },
  { color: "secondary", Icon: Database, title: "Persistent Storage", desc: "Every parsed candidate is saved to the database so you can revisit, compare and manage at any time." },
] as const;

const colorMap = {
  primary: { bg: "rgba(124,58,237,0.15)", text: "#7c3aed", bar: "linear-gradient(90deg, #7c3aed, #a855f7)" },
  secondary: { bg: "rgba(6,182,212,0.15)", text: "#06b6d4", bar: "linear-gradient(90deg, #06b6d4, #67e8f9)" },
  green: { bg: "rgba(16,185,129,0.15)", text: "#10b981", bar: "linear-gradient(90deg, #10b981, #34d399)" },
  amber: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", bar: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
} as const;

function HomePage() {
  const [candidateCount, setCandidateCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    api.get('/api/v1/candidates').then((res) => setCandidateCount(res.total || res.candidates?.length || 0)).catch(() => {});
    api.get('/api/v1/job-descriptions').then((res) => setJobCount(res.length || 0)).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100vh-56px)] items-center justify-center overflow-hidden px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)" }}
        />
        <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border-default bg-[rgba(124,58,237,0.1)] px-4 py-1.5 text-[12px] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by LangGraph + GPT-4o-mini
          </div>
          <h1
            className="animate-fade-in-up mt-6 font-extrabold leading-[1.05] tracking-tight text-text-primary"
            style={{ fontSize: "clamp(40px, 7vw, 72px)", animationDelay: "100ms" }}
          >
            Hire Smarter with
            <br />
            Multi-Agent <span className="text-gradient">AI</span>
          </h1>
          <p
            className="animate-fade-in-up mt-6 max-w-[540px] text-[18px] leading-relaxed text-text-secondary"
            style={{ animationDelay: "200ms" }}
          >
            Upload resumes, extract skills, and rank candidates semantically — not by keywords. Three AI agents do in seconds what takes recruiters hours.
          </p>
          <div className="animate-fade-in-up mt-8 flex items-center gap-3" style={{ animationDelay: "300ms" }}>
            <Link to="/analyze">
              <Button variant="primary" className="h-12 px-7 text-[14px]">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/candidates">
              <Button variant="secondary" className="h-12 px-7 text-[14px]">View Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border-subtle bg-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border-subtle px-6 py-20">
          {[
            { n: candidateCount || 29, label: "Candidates Parsed" },
            { n: jobCount || 3, label: "Job Profiles" },
            { n: 3, label: "AI Agents" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-[56px] font-extrabold leading-none text-gradient">
                <CountUp to={s.n} />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AGENT PIPELINE */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Label className="mb-4">AI Agent Pipeline</Label>
          <Card className="p-6">
            <AgentPipeline states={["complete", "complete", "complete"]} />
          </Card>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12 text-center">
            <h2 className="text-[36px] font-extrabold tracking-tight text-text-primary">Everything You Need</h2>
            <p className="mt-3 text-text-secondary">A complete hiring intelligence platform in one place</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              const Icon = f.Icon;
              return (
                <Card key={i} hover delay={i * 80} className="group relative overflow-hidden p-6">
                  <div
                    className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: c.bar }}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px]" style={{ background: c.bg, color: c.text }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[16px] font-semibold text-text-primary">{f.title}</div>
                  <div className="mt-2 text-[14px] leading-[1.6] text-text-secondary">{f.desc}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-subtle bg-surface/50 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[48px] font-extrabold leading-tight tracking-tight text-gradient">Ready to Build Your Dream Team?</h2>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">Upload your first resume and watch the 3-agent AI pipeline in action.</p>
          <div className="mt-8 flex justify-center">
            <Link to="/analyze">
              <Button variant="primary" className="h-12 px-8 text-[14px]">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
