import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, FileSearch, Brain, GitCompare } from 'lucide-react';

const ParticleGraph = () => {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; delay: number; duration: number }[]>([]);
  const [lines, setLines] = useState<{ id: number; n1: any; n2: any }[]>([]);

  useEffect(() => {
    // Generate ~60 nodes
    const newNodes = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
    }));
    
    // Connect a subset of random nodes with lines
    const newLines = Array.from({ length: 40 }).map((_, i) => {
      const n1 = newNodes[Math.floor(Math.random() * newNodes.length)];
      const n2 = newNodes[Math.floor(Math.random() * newNodes.length)];
      return { id: i, n1, n2 };
    });

    setNodes(newNodes);
    setLines(newLines);
  }, []);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <style>
          {`
            @keyframes drift {
              0% { transform: translate(0px, 0px); }
              33% { transform: translate(15px, -15px); }
              66% { transform: translate(-10px, 10px); }
              100% { transform: translate(0px, 0px); }
            }
            .node {
              animation: drift var(--dur) ease-in-out infinite alternate;
              animation-delay: var(--del);
            }
          `}
        </style>
      </defs>
      {lines.map((line) => (
        <line
          key={line.id}
          x1={`${line.n1.x}%`}
          y1={`${line.n1.y}%`}
          x2={`${line.n2.x}%`}
          y2={`${line.n2.y}%`}
          stroke="var(--accent-cyan)"
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />
      ))}
      {nodes.map((node) => (
        <circle
          key={node.id}
          cx={`${node.x}%`}
          cy={`${node.y}%`}
          r="1.5"
          fill="var(--accent-cyan)"
          fillOpacity="0.3"
          className="node"
          style={{ '--dur': `${node.duration}s`, '--del': `${node.delay}s` } as React.CSSProperties}
        />
      ))}
    </svg>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headlineWords = ["Hire", "with", "Neural", "Precision"];

  const features = [
    { title: 'Parser', desc: 'Extracts structured data from PDF/DOCX using LLMs.', icon: FileSearch },
    { title: 'Normalizer', desc: 'Cleans and maps extracted skills to a standard taxonomy.', icon: Brain },
    { title: 'Matcher', desc: 'Scores candidate fit against job requirements semantically.', icon: GitCompare },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav 
        className={`fixed top-0 left-0 right-0 h-[64px] z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-[rgba(8,11,17,0.95)] border-[var(--border-subtle)]' 
            : 'bg-[var(--bg-surface)]/80 backdrop-blur-[12px] border-[var(--border-subtle)]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Hexagon className="w-[20px] h-[20px] text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] fill-[var(--accent-cyan)]/20" />
            <span className="font-display font-bold text-[20px] tracking-tight text-[var(--text-primary)]">TalentGraph</span>
            <sup className="font-display font-bold text-[10px] text-[var(--accent-amber)] top-[-0.8em] relative">AI</sup>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pipeline', 'Pricing'].map((item) => (
              <Link 
                key={item} 
                to={`#${item.toLowerCase()}`}
                className="group relative text-[14px] font-sans text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200"
              >
                {item}
                <span className="absolute left-0 right-0 -bottom-1 h-px bg-[var(--accent-cyan)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
              </Link>
            ))}
          </div>

          {/* Action */}
          <button 
            onClick={() => navigate('/analyze')}
            className="px-4 py-2 text-[14px] font-sans font-medium text-[var(--accent-cyan)] border border-[var(--accent-cyan)] rounded hover:bg-[var(--accent-cyan-dim)] transition-all duration-200 hover:shadow-[var(--glow-cyan)]"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <ParticleGraph />
        
        {/* Radial Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col items-center mt-[64px]">
          
          {/* Top Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--accent-cyan-dim)] flex items-center justify-center"
          >
            <span className="font-mono text-[11px] text-[var(--accent-cyan)] tracking-wider">
              ⬡ Multi-Agent AI Pipeline
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-[48px] md:text-[80px] leading-[1.05] tracking-tight mb-6 max-w-4xl flex flex-wrap justify-center gap-x-3 md:gap-x-4">
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.15), duration: 0.6, ease: "easeOut" }}
                className={word === 'Neural' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}
                style={word === 'Neural' ? { textShadow: 'var(--glow-cyan)' } : {}}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="font-sans text-[18px] text-[var(--text-muted)] max-w-[520px] mb-10 leading-relaxed"
          >
            TalentGraph AI parses resumes, normalizes skills, and semantically matches candidates to roles — powered by a live multi-agent orchestration pipeline.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <button 
              onClick={() => navigate('/analyze')}
              className="px-[32px] py-[14px] bg-[var(--accent-cyan)] text-[var(--bg-base)] font-display font-semibold text-[15px] rounded-[4px] border border-transparent hover:brightness-110 hover:scale-[1.02] hover:shadow-[var(--glow-cyan)] transition-all duration-200"
            >
              Start Analyzing →
            </button>
            <button 
              onClick={() => navigate('/pipeline')}
              className="px-[32px] py-[14px] bg-transparent text-[var(--text-muted)] font-display font-semibold text-[15px] rounded-[4px] border border-[var(--border-subtle)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] hover:shadow-[var(--glow-amber)] transition-all duration-200"
            >
              Watch Pipeline
            </button>
          </motion.div>

          {/* Stat Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="flex items-center font-mono text-[12px] text-[var(--text-muted)]"
          >
            <span>2,400+ Resumes Parsed</span>
            <span className="mx-3 text-[var(--accent-amber)]">•</span>
            <span>98.2% Match Accuracy</span>
            <span className="mx-3 text-[var(--accent-amber)]">•</span>
            <span>3 AI Agents</span>
          </motion.div>

        </div>
      </section>

      {/* 3. FEATURES STRIP */}
      <section className="relative w-full py-[100px] px-6 z-10 bg-[var(--bg-base)]">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-[56px]">
          <span className="font-mono text-[11px] text-[var(--accent-cyan)] tracking-[0.2em] mb-[16px] uppercase">
            Core Capabilities
          </span>
          <h2 className="font-display font-bold text-[40px] text-[var(--text-primary)]">
            Three Agents. One Pipeline.
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i} 
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[8px] p-[32px] hover:border-[var(--accent-cyan)] hover:shadow-[var(--glow-cyan)] transition-all duration-300 group"
              >
                <div className="w-[48px] h-[48px] rounded-[6px] bg-[var(--accent-cyan-dim)] border border-[var(--border-subtle)] flex items-center justify-center mb-[24px] group-hover:bg-[rgba(0,229,255,0.2)] transition-colors duration-300">
                  <Icon className="w-[24px] h-[24px] text-[var(--accent-cyan)]" />
                </div>
                <h3 className="font-display font-bold text-[20px] text-[var(--text-primary)] mb-[12px]">
                  {feature.title}
                </h3>
                <p className="font-sans text-[15px] text-[var(--text-muted)] leading-[1.6]">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
}
