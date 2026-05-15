import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hexagon, Grid, Upload, Network, GitBranch, Scale, Target, Settings,
  FileText, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';

const mockParsedData = {
  name: "Alexander Vance",
  email: "alex.vance@talentgraph.ai",
  phone: "+1 (555) 019-8372",
  skills: ["React", "TypeScript", "Node.js", "Python", "GraphQL", "PostgreSQL", "AWS", "Docker", "Framer Motion"],
  experience_years: 6,
  match_score: 92,
  job_title: "Senior Full-Stack Engineer"
};

const Sidebar = () => {
  const navItems = [
    { icon: Grid, label: "Dashboard", path: "/dashboard" },
    { icon: Upload, label: "Analyze", path: "/analyze" },
    { icon: Network, label: "Agent Flow", path: "/pipeline" },
    { icon: GitBranch, label: "Skill Taxonomy", path: "/taxonomy" },
    { icon: Scale, label: "Compare", path: "/compare" },
    { icon: Target, label: "Job Match", path: "/jobs" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed top-0 left-0 w-[240px] h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <Hexagon className="w-[18px] h-[18px] text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/20 drop-shadow-[var(--glow-cyan)]" />
        <span className="font-display font-bold text-[18px] text-[var(--text-primary)] tracking-tight">TalentGraph</span>
        <sup className="font-display font-bold text-[10px] text-[var(--accent-amber)] top-[-0.8em] relative">AI</sup>
      </div>

      {/* Nav */}
      <div className="mt-10 flex flex-col gap-1 pr-4">
        {navItems.map((item) => {
          const isActive = item.label === "Analyze";
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-r-[6px] transition-colors duration-200 border-l-[2px] ${
                isActive 
                  ? 'bg-[var(--accent-cyan-dim)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' 
                  : 'border-transparent text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="font-sans text-[14px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Status Card */}
      <div className="mt-auto m-4 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[6px]">
        <div className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider mb-2">PIPELINE STATUS</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="font-sans text-[12px] text-[var(--text-primary)] font-medium">All agents online</span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-muted)]">3 agents · SQLite connected</div>
      </div>
    </div>
  );
};

export default function AnalyzePage() {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [pipelineState, setPipelineState] = useState<'idle'|'processing'|'complete'>('idle');
  const [agentStep, setAgentStep] = useState(0); 

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startPipeline(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startPipeline(e.target.files[0]);
    }
  };

  const startPipeline = (selectedFile: File) => {
    setFile(selectedFile);
    setPipelineState('processing');
    setAgentStep(0);
    
    // Simulate multi-agent processing pipeline
    setTimeout(() => setAgentStep(1), 1200);
    setTimeout(() => setAgentStep(2), 2400);
    setTimeout(() => setPipelineState('complete'), 3600);
  };

  const resetPipeline = () => {
    setFile(null);
    setPipelineState('idle');
    setAgentStep(0);
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      
      <main className="ml-[240px] flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        {/* Background Dot Matrix */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--accent-cyan) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.08
          }}
        />

        {/* Top Bar */}
        <div className="h-[56px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[32px] flex items-center justify-between relative z-10 shrink-0">
          <div className="font-mono text-[13px] text-[var(--text-muted)]">
            <span>Smart-Hire</span>
            <span className="mx-2 text-[var(--accent-amber)]">/</span>
            <span className="text-[var(--text-primary)]">Analyze</span>
          </div>
          
          {/* Batch Toggle */}
          <div className="flex items-center gap-3">
            <span className="font-sans text-[13px] text-[var(--text-muted)]">Batch Upload</span>
            <button 
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`w-[36px] h-[20px] rounded-full relative transition-colors duration-300 cursor-pointer ${
                isBatchMode ? 'bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]' : 'bg-white/10'
              }`}
            >
              <div 
                className={`absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-300 ${
                  isBatchMode ? 'translate-x-[18px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Padding */}
        <div className="p-[40px] relative z-10 flex-1 overflow-y-auto">
          
          {/* Section 1 - Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h1 className="font-display font-bold text-[32px] text-[var(--text-primary)] leading-tight">
              Resume Analysis
            </h1>
            <p className="font-sans text-[15px] text-[var(--text-muted)] mt-[6px]">
              Upload a resume and watch the agents parse, normalize, and score it in real time.
            </p>
          </motion.div>

          {/* Section 2 - Upload Zone (Idle) */}
          {pipelineState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={`max-w-[640px] mx-auto mt-[64px] border-[2px] border-dashed rounded-[12px] p-[64px_40px] text-center transition-all duration-200 ${
                isDragging 
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan-dim)]' 
                  : 'border-[rgba(0,229,255,0.3)] bg-[var(--bg-card)]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex justify-center mb-[16px]">
                <Upload className="w-[48px] h-[48px] text-[var(--accent-cyan)] opacity-40" />
              </div>
              <h2 className="font-display font-semibold text-[22px] text-[var(--text-primary)]">
                Drop your resume here
              </h2>
              <p className="font-sans text-[14px] text-[var(--text-muted)] mt-1 mb-[32px]">
                Supports PDF and DOCX · Max 10MB
              </p>
              
              <label className="inline-block px-6 py-2.5 font-sans text-[14px] font-medium text-[var(--accent-cyan)] border border-[var(--accent-cyan)] rounded hover:bg-[var(--accent-cyan-dim)] transition-colors cursor-pointer shadow-[var(--glow-cyan)]">
                Browse Files
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileSelect} />
              </label>
            </motion.div>
          )}

          {/* Simulated Pipeline UI */}
          {pipelineState !== 'idle' && file && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-[800px] mx-auto mt-[40px]"
            >
              {/* File Status Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[8px] p-5 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-medium text-[var(--text-primary)]">{file.name}</h3>
                    <p className="font-mono text-[12px] text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {pipelineState === 'complete' ? (
                  <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded border border-green-400/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-sans font-medium text-[13px]">Analysis Complete</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[var(--accent-cyan)] bg-[var(--accent-cyan-dim)] px-3 py-1.5 rounded border border-[var(--border-subtle)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-sans font-medium text-[13px]">Processing Pipeline...</span>
                  </div>
                )}
              </div>

              {/* Agent Steps Timeline */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { title: "Parser Agent", desc: "Extracting structured entities" },
                  { title: "Normalizer Agent", desc: "Mapping to standard taxonomy" },
                  { title: "Matcher Agent", desc: "Calculating semantic score" }
                ].map((step, i) => {
                  let status = 'pending';
                  if (agentStep === i) status = 'active';
                  if (agentStep > i || pipelineState === 'complete') status = 'done';
                  
                  return (
                    <div key={i} className={`p-4 rounded-[6px] border transition-colors duration-500 ${
                      status === 'active' ? 'bg-[var(--accent-cyan-dim)] border-[var(--accent-cyan)] shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]' :
                      status === 'done' ? 'bg-white/5 border-[var(--border-subtle)]' :
                      'bg-transparent border-white/5 opacity-40'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--text-primary)]">AGENT 0{i+1}</span>
                        {status === 'active' && <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse shadow-[var(--glow-cyan)]" />}
                        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />}
                      </div>
                      <h4 className="font-display font-semibold text-[15px] text-[var(--text-primary)]">{step.title}</h4>
                      <p className="font-sans text-[12px] text-[var(--text-muted)] mt-1">{step.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Parsed Results Data Display */}
              <AnimatePresence>
                {pipelineState === 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                  >
                    {/* Score Card (Left 4 cols) */}
                    <div className="md:col-span-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[8px] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Target className="w-40 h-40 text-[var(--accent-cyan)] translate-x-8 -translate-y-8" />
                      </div>
                      <div className="font-mono text-[11px] text-[var(--accent-cyan)] tracking-[0.15em] mb-6">MATCH SCORE</div>
                      <div className="relative flex items-center justify-center w-[140px] h-[140px] rounded-full border-[3px] border-[var(--accent-cyan)] shadow-[var(--glow-cyan)] bg-[var(--bg-surface)]">
                        <span className="font-display font-bold text-[56px] text-[var(--text-primary)] tracking-tighter">{mockParsedData.match_score}</span>
                        <span className="absolute bottom-[28px] right-[20px] font-mono text-[16px] text-[var(--accent-cyan)]">%</span>
                      </div>
                      <div className="mt-6 font-sans text-[13px] text-[var(--text-muted)] text-center">
                        Matched against<br/>
                        <span className="text-[var(--text-primary)] font-medium">{mockParsedData.job_title}</span>
                      </div>
                    </div>

                    {/* Extracted Data Card (Right 8 cols) */}
                    <div className="md:col-span-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[8px] p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">EXTRACTED PROFILE</div>
                        <button onClick={resetPipeline} className="text-[12px] font-sans text-[var(--accent-cyan)] hover:text-white flex items-center gap-1 transition-colors">
                          Analyze Another <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="mb-6 grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-display font-bold text-[24px] text-[var(--text-primary)] tracking-tight">{mockParsedData.name}</div>
                          <div className="font-sans text-[14px] text-[var(--text-muted)] mt-1">{mockParsedData.email}</div>
                          <div className="font-mono text-[12px] text-[var(--text-muted)] mt-1">{mockParsedData.phone}</div>
                        </div>
                        <div className="flex gap-8 justify-end text-right">
                          <div>
                            <div className="font-mono text-[10px] text-[var(--text-muted)] mb-1 tracking-wider">EXPERIENCE</div>
                            <div className="font-display font-semibold text-[20px] text-[var(--text-primary)]">{mockParsedData.experience_years} <span className="text-[14px] font-sans text-[var(--text-muted)]">YRS</span></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="mb-3 font-mono text-[10px] text-[var(--text-muted)] tracking-wider">NORMALIZED SKILLS ({mockParsedData.skills.length})</div>
                        <div className="flex flex-wrap gap-2">
                          {mockParsedData.skills.map(skill => (
                            <span key={skill} className="px-3 py-1.5 rounded bg-[var(--accent-cyan-dim)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--accent-cyan)]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
