import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Users, BarChart3, Zap,
  FileSearch, GitCompare, BookOpen, Brain, Shield, Clock,
} from 'lucide-react';
import { fetchCandidates, fetchJobs } from '@/lib/api';

/* ── Animated counter ─────────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
      setCount(v => {
        if (v + step >= target) { clearInterval(timer); return target; }
        return v + step;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

/* ── Feature card ──────────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, desc, color, delay,
}: {
  icon: typeof FileSearch;
  title: string;
  desc: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="glass-card p-6 flex flex-col gap-4 hover:scale-[1.03] transition-all duration-300 cursor-default animate-fade-in-up"
      style={{ animationDelay: delay, animationFillMode: 'both', opacity: 0 }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1.5">{title}</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Stat item ─────────────────────────────────────────────────────────── */
function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center px-6">
      <p className="text-3xl font-black tabular-nums" style={{ color }}>
        <AnimatedCounter target={value} />
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-medium">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [candidateCount, setCandidateCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Fetch live stats */
  useEffect(() => {
    fetchCandidates(200).then(c => setCandidateCount(c.length)).catch(() => {});
    fetchJobs().then(j => setJobCount(j.length)).catch(() => {});
  }, []);

  /* Animated particle background */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.08,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,99,255,${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108,99,255,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  const features = [
    {
      icon: FileSearch, title: 'AI Resume Parser',
      desc: 'Extract structured data from any PDF or DOCX resume using GPT-4o — skills, experience, education and more.',
      color: 'var(--color-accent-light)', delay: '0.1s',
    },
    {
      icon: Brain, title: 'Semantic Skill Matching',
      desc: 'Sentence-Transformer embeddings score each candidate against job requirements with cosine similarity.',
      color: 'var(--color-cyan)', delay: '0.2s',
    },
    {
      icon: GitCompare, title: 'Head-to-Head Compare',
      desc: 'Run 1-vs-1 or multi-candidate leaderboard comparisons to instantly surface the top hire.',
      color: 'var(--color-violet)', delay: '0.3s',
    },
    {
      icon: BookOpen, title: 'Skill Taxonomy',
      desc: 'Explore thousands of normalised tech skills across categories — searchable and browseable.',
      color: 'var(--color-emerald)', delay: '0.4s',
    },
    {
      icon: Shield, title: 'Bulk Processing',
      desc: 'Upload up to 50 resumes at once and get sequential AI analysis with a live progress tracker.',
      color: 'var(--color-warning)', delay: '0.5s',
    },
    {
      icon: Clock, title: 'Persistent Storage',
      desc: 'Every parsed candidate is saved to SQLite so you can revisit, compare and manage at any time.',
      color: 'var(--color-rose)', delay: '0.6s',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full opacity-[0.15]"
          style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div className="absolute top-[25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, var(--color-violet) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-[5%] left-[25%] w-[450px] h-[450px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, var(--color-cyan) 0%, transparent 65%)', filter: 'blur(90px)' }} />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-20 max-w-[1100px] mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10
          bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25
          animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-light)]" />
          <span className="text-xs font-semibold text-[var(--color-accent-light)] uppercase tracking-widest">
            Multi-Agent AI System
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[clamp(3rem,8vw,5.5rem)] font-black leading-[1.05] tracking-tight mb-8 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
        >
          Hire Smarter with
          <br />
          <span className="gradient-text">AI Intelligence</span>
        </h1>

        <p
          className="text-lg text-[var(--color-text-secondary)] mb-12 max-w-[620px] leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'both', opacity: 0 }}
        >
          Smart Hire uses a multi-agent pipeline — <span className="text-[var(--color-accent-light)] font-semibold">Parser</span> → <span className="text-[var(--color-cyan)] font-semibold">Normalizer</span> → <span className="text-[var(--color-emerald)] font-semibold">Matcher</span> — to instantly score, rank and compare any number of resumes against your job openings.
        </p>

        {/* CTA buttons */}
        <div
          className="flex items-center justify-center gap-4 flex-wrap mb-16 animate-fade-in-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both', opacity: 0 }}
        >
          <button
            onClick={() => navigate('/analyze')}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl
              bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)]
              text-white text-sm font-bold
              hover:shadow-[0_0_40px_var(--color-accent-glow)]
              hover:scale-[1.04] active:scale-100
              transition-all duration-300"
          >
            <Zap className="w-4 h-4" />
            Analyze Resumes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl
              bg-[var(--color-bg-card)] border border-[var(--color-border)]
              text-[var(--color-text-secondary)] text-sm font-bold
              hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]
              hover:bg-[var(--color-bg-elevated)]
              transition-all duration-300"
          >
            <Users className="w-4 h-4" />
            View Candidates
          </button>
        </div>

        {/* Live stats pill */}
        <div
          className="inline-flex items-center divide-x divide-[var(--color-border)] rounded-2xl overflow-hidden
            bg-[var(--color-bg-card)]/70 border border-[var(--color-border)] backdrop-blur-xl animate-fade-in-up"
          style={{ animationDelay: '0.45s', animationFillMode: 'both', opacity: 0 }}
        >
          <StatItem value={candidateCount} label="Candidates Parsed" color="var(--color-accent-light)" />
          <StatItem value={jobCount} label="Job Profiles" color="var(--color-cyan)" />
          <StatItem value={3} label="AI Agents" color="var(--color-violet)" />
        </div>
      </section>

      {/* ── AGENT PIPELINE ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[860px] mx-auto px-6 pb-20">
        <div
          className="glass-card p-8 animate-fade-in-up"
          style={{ animationDelay: '0.55s', animationFillMode: 'both', opacity: 0 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] text-center mb-6">AI AGENT PIPELINE</p>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
            {[
              { name: 'Parser', desc: 'PDF/DOCX → Raw text', color: 'var(--color-accent-light)', icon: FileSearch },
              { name: 'Normaliser', desc: 'Skill extraction & cleanup', color: 'var(--color-cyan)', icon: Brain },
              { name: 'Matcher', desc: 'Semantic scoring', color: 'var(--color-emerald)', icon: BarChart3 },
            ].map((agent, i) => (
              <div key={agent.name} className="flex flex-1 items-center w-full">
                <div className="flex-1 flex flex-col items-center text-center gap-3 py-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                    <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{agent.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{agent.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <ArrowRight className="w-5 h-5 text-[var(--color-border)] flex-shrink-0 mx-1 rotate-90 md:rotate-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-[var(--color-text-primary)] mb-3 tracking-tight">Everything You Need</h2>
          <p className="text-sm text-[var(--color-text-muted)]">A complete hiring intelligence platform in one place</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24 text-center">
        <div className="glass-card p-14 border border-[var(--color-accent)]/15"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06) 0%, rgba(139,92,246,0.04) 100%)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-violet)]/20 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-7 h-7 text-[var(--color-accent-light)]" />
          </div>
          <h2 className="text-4xl font-black gradient-text mb-4 tracking-tight">Ready to Build Your Dream Team?</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-10 max-w-md mx-auto leading-relaxed">
            Upload your first resume and watch the 3-agent AI pipeline in action. No setup required.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl
              bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)]
              text-white text-sm font-bold
              hover:shadow-[0_0_50px_var(--color-accent-glow)]
              hover:scale-[1.04] active:scale-100 transition-all duration-300"
          >
            <Zap className="w-4 h-4" />
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </section>
    </div>
  );
}
