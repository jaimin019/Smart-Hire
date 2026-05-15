import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hexagon, Grid, Upload, Network, GitBranch, Scale, Target, Settings,
  Search, ChevronRight, ChevronDown, MousePointerClick
} from 'lucide-react';

const domainColors: Record<string, string> = {
  "Engineering": "#00E5FF",
  "Data & AI": "#A855F7",
  "Design": "#FF6B6B",
  "DevOps": "#00FF88",
  "Management": "#FF9500",
  "Product": "#3B82F6",
  "Marketing": "#F59E0B",
  "Finance": "#10B981"
};

const domainsList = Object.keys(domainColors);

const taxonomyTree = [
  { domain: 'Engineering', count: 312, categories: [
    { name: 'Frontend', count: 84 },
    { name: 'Backend', count: 96 },
    { name: 'Mobile', count: 48 },
    { name: 'Systems', count: 44 },
    { name: 'Databases', count: 40 }
  ]},
  { domain: 'Data & AI', count: 245, categories: [
    { name: 'Machine Learning', count: 65 },
    { name: 'Data Engineering', count: 82 },
    { name: 'Analytics', count: 98 }
  ]},
  { domain: 'Design', count: 184, categories: [{ name: 'UI/UX', count: 120 }, { name: 'Research', count: 64 }] },
  { domain: 'DevOps', count: 156, categories: [{ name: 'CI/CD', count: 50 }, { name: 'Cloud', count: 106 }] },
  { domain: 'Management', count: 142, categories: [{ name: 'Agile', count: 70 }, { name: 'Leadership', count: 72 }] },
  { domain: 'Product', count: 128, categories: [{ name: 'Strategy', count: 80 }, { name: 'Metrics', count: 48 }] },
  { domain: 'Marketing', count: 195, categories: [{ name: 'Growth', count: 110 }, { name: 'Content', count: 85 }] },
  { domain: 'Finance', count: 112, categories: [{ name: 'Modeling', count: 60 }, { name: 'Accounting', count: 52 }] }
];

const mockSkillsList = [
  { name: 'React', demand: 94 }, { name: 'TypeScript', demand: 91 },
  { name: 'Next.js', demand: 88 }, { name: 'Vue.js', demand: 72 },
  { name: 'Tailwind CSS', demand: 85 }, { name: 'GraphQL', demand: 67 },
  { name: 'WebSockets', demand: 58 }, { name: 'Redux', demand: 61 },
  { name: 'Webpack', demand: 44 }, { name: 'Vite', demand: 79 },
  { name: 'CSS Animations', demand: 52 }, { name: 'Web Accessibility', demand: 48 },
];

const bubbleNodes = [
  { name: 'React', demand: 94, color: '#00E5FF', x: 15, y: 30 },
  { name: 'TypeScript', demand: 91, color: '#00E5FF', x: 25, y: 70 },
  { name: 'Python', demand: 100, color: '#A855F7', x: 50, y: 40 },
  { name: 'Docker', demand: 85, color: '#00FF88', x: 75, y: 30 },
  { name: 'Kubernetes', demand: 70, color: '#00FF88', x: 85, y: 60 },
  { name: 'Figma', demand: 82, color: '#FF6B6B', x: 40, y: 20 },
  { name: 'Agile', demand: 75, color: '#FF9500', x: 60, y: 80 },
  { name: 'SEO', demand: 60, color: '#F59E0B', x: 35, y: 85 },
  { name: 'SQL', demand: 88, color: '#10B981', x: 80, y: 85 },
  { name: 'Next.js', demand: 88, color: '#00E5FF', x: 10, y: 55 },
  { name: 'GraphQL', demand: 67, color: '#00E5FF', x: 30, y: 45 },
];

const heatmapData = [
  { skill: 'Python', count: 1847, color: '#A855F7' },
  { skill: 'React', count: 1623, color: '#00E5FF' },
  { skill: 'TypeScript', count: 1401, color: '#00E5FF' },
  { skill: 'Docker', count: 1198, color: '#00FF88' },
  { skill: 'FastAPI', count: 987, color: '#A855F7' },
  { skill: 'SQL', count: 934, color: '#10B981' },
  { skill: 'Git', count: 912, color: '#00FF88' },
  { skill: 'Node.js', count: 876, color: '#00E5FF' },
  { skill: 'Kubernetes', count: 654, color: '#00FF88' },
  { skill: 'TensorFlow', count: 589, color: '#A855F7' },
];

/* --- SIDEBAR --- */
const Sidebar = () => {
  const navItems = [
    { icon: Grid, label: "Dashboard", path: "/dashboard" },
    { icon: Upload, label: "Analyze", path: "/analyze" },
    { icon: Network, label: "Agent Flow", path: "/agent-flow" },
    { icon: GitBranch, label: "Skill Taxonomy", path: "/taxonomy" },
    { icon: Scale, label: "Compare", path: "/compare" },
    { icon: Target, label: "Job Match", path: "/jobs" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed top-0 left-0 w-[240px] h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-20">
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <Hexagon className="w-[18px] h-[18px] text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/20 drop-shadow-[var(--glow-cyan)]" />
        <span className="font-display font-bold text-[18px] text-[var(--text-primary)] tracking-tight">TalentGraph</span>
        <sup className="font-display font-bold text-[10px] text-[var(--accent-amber)] top-[-0.8em] relative">AI</sup>
      </div>
      <div className="mt-10 flex flex-col gap-1 pr-4">
        {navItems.map((item) => {
          const isActive = item.label === "Skill Taxonomy";
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-5 py-2.5 rounded-r-[6px] transition-colors duration-200 border-l-[2px] ${isActive ? 'bg-[var(--accent-cyan-dim)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'}`}>
              <Icon className="w-[18px] h-[18px]" />
              <span className="font-sans text-[14px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
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

export default function TaxonomyPage() {
  const [expandedDomains, setExpandedDomains] = useState<string[]>(['Engineering', 'Data & AI']);
  const [selectedCategory, setSelectedCategory] = useState<string>('Frontend');
  const [selectedDomain, setSelectedDomain] = useState<string>('Engineering');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid'|'bubble'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Domains');
  const [gapRole, setGapRole] = useState('');
  const [gapAnalyzed, setGapAnalyzed] = useState(false);

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => 
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const selectCategory = (domain: string, category: string) => {
    setSelectedDomain(domain);
    setSelectedCategory(category);
    setSelectedSkill(null);
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      <Sidebar />
      
      <main className="ml-0 md:ml-[240px] flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        {/* Background Dot Matrix */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, var(--accent-cyan) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.05 }} />

        {/* Top Bar */}
        <div className="h-[56px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[32px] flex items-center justify-between relative z-10 shrink-0">
          <div className="font-mono text-[13px] text-[var(--text-muted)] flex items-center">
            <span>Smart-Hire</span>
            <span className="mx-2 text-[var(--accent-amber)]">/</span>
            <span className="text-[var(--text-primary)]">Skill Taxonomy</span>
          </div>
          <button className="font-display font-semibold text-[13px] text-[var(--text-muted)] border border-[var(--border-subtle)] px-[20px] py-[8px] rounded-[4px] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all duration-200">
            Export Taxonomy
          </button>
        </div>

        {/* Content Padding */}
        <div className="p-[32px_40px] relative z-10 flex-1 overflow-y-auto">
          
          {/* SECTION 1 - HEADER & SEARCH */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mb-8">
            <h1 className="font-display font-bold text-[32px] text-[var(--text-primary)] leading-tight">Skill Taxonomy</h1>
            <p className="font-sans text-[15px] text-[var(--text-muted)] mt-[6px] max-w-[640px]">
              Explore 2,400+ normalized skills across 8 domains. Click any node to inspect metadata, demand scores, and related roles.
            </p>
            
            <div className="mt-8">
              <div className="max-w-[560px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[6px] p-[12px_20px] flex items-center gap-3 focus-within:border-[var(--accent-cyan)] focus-within:shadow-[0_0_0_3px_rgba(0,229,255,0.08)] transition-all duration-200">
                <Search className="w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills — e.g. Python, GraphQL, Docker..." 
                  className="bg-transparent border-none outline-none font-sans text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] flex-1"
                />
                <div className="border border-[var(--border-subtle)] rounded-[3px] p-[2px_6px] font-mono text-[11px] text-[var(--text-muted)]">⌘K</div>
              </div>
              
              <div className="mt-[12px] flex flex-wrap gap-[8px]">
                {['All Domains', ...domainsList].map(filter => {
                  const isActive = activeFilter === filter;
                  return (
                    <button 
                      key={filter} 
                      onClick={() => setActiveFilter(filter)}
                      className={`font-mono text-[11px] px-[14px] py-[4px] rounded-[20px] border transition-all duration-150 ${isActive ? 'bg-[var(--accent-cyan-dim)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-cyan)] hover:text-[var(--text-primary)]'}`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* SECTION 2 - 3-COLUMN LAYOUT */}
          <div className="flex flex-col xl:flex-row gap-[24px] items-start mb-8">
            
            {/* COLUMN 1 - TAXONOMY TREE */}
            <div className="w-full xl:w-[300px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-[16px_20px] border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                <span className="font-mono text-[10px] text-[var(--accent-cyan)] tracking-[0.15em]">TAXONOMY TREE</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">8 domains · 2,412 skills</span>
              </div>
              <div className="flex-1 overflow-y-auto py-[12px] custom-scrollbar">
                {taxonomyTree.map(domain => {
                  const isExpanded = expandedDomains.includes(domain.domain);
                  const color = domainColors[domain.domain];
                  return (
                    <div key={domain.domain}>
                      <button 
                        onClick={() => toggleDomain(domain.domain)}
                        className="w-full p-[10px_20px] flex items-center gap-[10px] hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[10px] flex justify-center text-[var(--text-muted)] text-[10px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</div>
                        <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: color }} />
                        <span className={`font-sans text-[14px] ${isExpanded ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>{domain.domain}</span>
                        <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">{domain.count}</span>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            {domain.categories.map(cat => {
                              const isActive = selectedDomain === domain.domain && selectedCategory === cat.name;
                              return (
                                <button 
                                  key={cat.name}
                                  onClick={() => selectCategory(domain.domain, cat.name)}
                                  className={`w-full p-[8px_20px_8px_44px] flex items-center hover:bg-white/5 transition-colors ${isActive ? 'bg-[var(--accent-cyan-dim)]/50' : ''}`}
                                >
                                  <div className="w-[5px] h-[5px] rounded-full bg-[var(--text-muted)] mr-[10px]" />
                                  <span className={`font-sans text-[13px] ${isActive ? 'text-[var(--accent-cyan)] font-medium' : 'text-[var(--text-muted)]'}`}>{cat.name}</span>
                                  <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">{cat.count}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2 - SKILL GRID / VISUALIZATION */}
            <div className="flex-1 min-w-0 flex flex-col min-h-[600px]">
              <div className="flex mb-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[6px] p-[3px] flex gap-1">
                  {['grid', 'bubble'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`font-mono text-[12px] px-[16px] py-[6px] rounded-[4px] capitalize transition-colors ${activeTab === tab ? 'bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      {tab} View
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'grid' ? (
                <div>
                  <div className="mb-[16px] flex items-end gap-3">
                    <h2 className="font-display font-semibold text-[16px] text-[var(--text-primary)]">{selectedDomain} → {selectedCategory}</h2>
                    <span className="font-mono text-[12px] text-[var(--text-muted)]">(84 skills)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
                    {mockSkillsList.map((skill, i) => {
                      const demandColor = skill.demand > 75 ? 'var(--accent-cyan)' : skill.demand > 40 ? 'var(--accent-amber)' : 'var(--error)';
                      const trendUp = skill.demand > 60;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          key={skill.name}
                          onClick={() => setSelectedSkill(skill.name)}
                          className={`bg-[var(--bg-card)] border rounded-[8px] p-[16px] cursor-pointer transition-all duration-200 ${selectedSkill === skill.name ? 'border-[var(--accent-cyan)] shadow-[var(--glow-cyan)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:-translate-y-[2px] hover:shadow-[var(--glow-cyan)]'}`}
                        >
                          <div className="flex justify-between items-start mb-[12px]">
                            <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)]">{skill.name}</h3>
                            <span className="font-mono text-[10px]" style={{ color: domainColors[selectedDomain] }}>{selectedDomain}</span>
                          </div>
                          
                          <div className="w-full h-[3px] rounded-full bg-white/5 overflow-hidden mb-[8px]">
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${skill.demand}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full rounded-full" style={{ backgroundColor: demandColor }} 
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[11px] text-[var(--text-muted)]">Demand: {skill.demand}%</span>
                            <span className={`font-mono text-[11px] ${trendUp ? 'text-[#00FF88]' : 'text-red-500'}`}>
                              {trendUp ? `↑ ${Math.floor(Math.random()*15 + 2)}% this month` : `↓ ${Math.floor(Math.random()*5 + 1)}%`}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] w-full h-[500px] relative overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  {bubbleNodes.map((node, i) => {
                    const r = node.demand * 0.6;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="absolute rounded-full flex items-center justify-center group cursor-pointer"
                        style={{
                          left: `calc(${node.x}% - ${r}px)`, top: `calc(${node.y}% - ${r}px)`,
                          width: r * 2, height: r * 2,
                          backgroundColor: `${node.color}33`, // 20% opacity approx
                          border: `1px solid ${node.color}`,
                          backdropFilter: 'blur(2px)'
                        }}
                        onClick={() => setSelectedSkill(node.name)}
                        whileHover={{ scale: 1.1, backgroundColor: `${node.color}66`, zIndex: 10 }}
                      >
                        {r > 35 && <span className="font-mono text-[9px] text-[var(--text-primary)] font-bold px-1 text-center leading-tight">{node.name}</span>}
                        <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded font-mono text-[10px] text-white whitespace-nowrap pointer-events-none transition-opacity">
                          {node.name} · {node.demand}%
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* COLUMN 3 - SKILL DETAIL PANEL */}
            <div className="w-full xl:w-[280px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] p-[24px] min-h-[500px]">
              <AnimatePresence mode="wait">
                {!selectedSkill ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                    <MousePointerClick className="w-[40px] h-[40px] text-[var(--text-muted)] opacity-20 mb-[16px]" />
                    <h3 className="font-display font-semibold text-[16px] text-[var(--text-muted)]">Select a skill</h3>
                    <p className="font-sans text-[13px] text-[var(--text-muted)] mt-[8px]">Click any skill card to inspect its metadata, demand trend, and related roles.</p>
                  </motion.div>
                ) : (
                  <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[11px] px-[8px] py-[2px] rounded border" style={{ borderColor: domainColors[selectedDomain], color: domainColors[selectedDomain], backgroundColor: `${domainColors[selectedDomain]}22` }}>
                        {selectedDomain}
                      </span>
                      <button onClick={() => setSelectedSkill(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">×</button>
                    </div>
                    <h2 className="font-display font-bold text-[24px] text-[var(--text-primary)] mt-[8px]">{selectedSkill}</h2>
                    <div className="font-mono text-[11px] text-[var(--text-muted)] mt-[2px]">skill:{selectedSkill.toLowerCase().replace(/[^a-z0-9]/g, '')}.18</div>
                    
                    <div className="h-px bg-[var(--border-subtle)] my-[16px]" />
                    
                    {/* Gauge */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                          <motion.circle 
                            initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * 94) / 100 }} transition={{ duration: 1, ease: "easeOut" }}
                            cx="50" cy="50" r="45" fill="none" stroke="var(--accent-cyan)" strokeWidth="6" strokeDasharray="283" strokeLinecap="round" 
                          />
                        </svg>
                        <span className="absolute font-display font-extrabold text-[28px] text-[var(--accent-cyan)]">94<span className="text-[14px]">%</span></span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] mt-[8px]">Market Demand</span>
                    </div>

                    {/* Trend Sparkline */}
                    <div className="mt-[24px]">
                      <div className="font-mono text-[10px] text-[var(--accent-cyan)] mb-[8px]">DEMAND TREND (12mo)</div>
                      <div className="w-full h-[48px] relative">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 48">
                          <defs>
                            <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,48 L0,30 L10,28 L20,25 L30,22 L40,18 L50,15 L60,12 L70,10 L80,8 L90,6 L100,5 L100,48 Z" fill="url(#trend-grad)" />
                          <motion.path 
                            initial={{ strokeDashoffset: 150 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
                            d="M0,30 L10,28 L20,25 L30,22 L40,18 L50,15 L60,12 L70,10 L80,8 L90,6 L100,5" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeDasharray="150" 
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="h-px bg-[var(--border-subtle)] my-[16px]" />
                    
                    <div className="flex flex-col gap-[8px]">
                      {[
                        { l: "Aliases", v: `${selectedSkill}, ${selectedSkill}JS` },
                        { l: "Experience Levels", v: "Junior · Mid · Senior" },
                        { l: "Avg Salary Signal", v: "$115k–$155k" },
                        { l: "Taxonomy Version", v: "v2.4.1" }
                      ].map(m => (
                        <div key={m.l} className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">{m.l}</span>
                          <span className="font-sans text-[13px] text-[var(--text-primary)]">{m.v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="font-mono text-[10px] text-[var(--accent-cyan)] mt-[16px] mb-[8px]">COMMON IN ROLES</div>
                    <div className="flex flex-wrap gap-[6px]">
                      {["Frontend Dev", "Full Stack Eng", "UI Engineer"].map(r => (
                        <div key={r} className="font-sans text-[12px] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[20px] px-[12px] py-[4px] hover:border-[var(--accent-cyan)] cursor-pointer transition-colors">{r}</div>
                      ))}
                    </div>

                    <button className="mt-[24px] w-full font-display font-semibold text-[13px] text-[var(--accent-amber)] border border-[var(--accent-amber)] rounded-[4px] py-[10px] hover:bg-[var(--accent-amber-dim)] hover:shadow-[var(--glow-amber)] transition-all duration-200">
                      Add to Gap Analysis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* SECTION 3 - GAP ANALYSIS WIDGET */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] p-[28px] mb-[24px]">
            <div className="flex justify-between items-center">
              <div className="font-mono text-[10px] text-[var(--accent-amber)] tracking-[0.15em]">SKILL GAP ANALYSIS</div>
              <div className="font-mono text-[9px] text-[var(--accent-amber)] border border-[var(--accent-amber-dim)] rounded-[3px] px-[6px] py-[2px]">BETA</div>
            </div>
            <p className="font-sans text-[14px] text-[var(--text-muted)] mt-[4px] mb-[16px]">Enter a job role to see which skills candidates are missing vs. matched.</p>
            
            <div className="flex gap-[12px]">
              <input 
                type="text" 
                value={gapRole}
                onChange={(e) => setGapRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer" 
                className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[4px] p-[10px_16px] font-sans text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-amber)] transition-colors"
              />
              <button 
                onClick={() => setGapAnalyzed(true)}
                className="bg-[var(--accent-amber)] text-[var(--bg-base)] font-display font-semibold text-[13px] px-[24px] py-[10px] rounded-[4px] hover:brightness-110 hover:shadow-[var(--glow-amber)] transition-all duration-200"
              >
                Analyze Gap
              </button>
            </div>

            <AnimatePresence>
              {gapAnalyzed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-[24px] overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-[20px] mb-[20px]">
                    <div className="flex-1">
                      <div className="font-mono text-[11px] text-[#00FF88] mb-[8px]">✓ MATCHED (10)</div>
                      <div className="bg-[rgba(0,255,136,0.08)] border border-[rgba(0,255,136,0.25)] rounded-[8px] p-[16px] flex flex-wrap gap-[8px]">
                        {["Python", "FastAPI", "React", "TypeScript", "Git", "Docker", "REST APIs", "SQLite", "Vite", "LangGraph"].map(s => (
                          <span key={s} className="font-mono text-[12px] text-[#00FF88]">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-[11px] text-[var(--accent-amber)] mb-[8px]">✗ MISSING (6)</div>
                      <div className="bg-[var(--accent-amber-dim)] border border-[rgba(255,149,0,0.3)] rounded-[8px] p-[16px] flex flex-wrap gap-[8px]">
                        {["Kubernetes", "Redis", "PostgreSQL", "CI/CD", "System Design", "GraphQL"].map(s => (
                          <span key={s} className="font-mono text-[12px] text-[var(--accent-amber)]">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full h-[8px] rounded-[4px] flex overflow-hidden mb-[8px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: '62.5%' }} transition={{ duration: 0.8 }} className="h-full bg-[#00FF88]" />
                    <motion.div initial={{ width: 0 }} animate={{ width: '37.5%' }} transition={{ duration: 0.8 }} className="h-full bg-[var(--accent-amber)]" />
                  </div>
                  <div className="flex justify-between font-mono text-[12px]">
                    <span className="text-[#00FF88]">62.5% Match Coverage</span>
                    <span className="text-[var(--accent-amber)]">37.5% Skill Gap</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 4 - HEATMAP */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] p-[28px]">
            <div className="font-mono text-[10px] text-[var(--accent-cyan)] tracking-[0.15em] mb-[4px]">SKILL FREQUENCY HEATMAP</div>
            <p className="font-sans text-[14px] text-[var(--text-muted)] mb-[24px]">Most common skills across all parsed resumes in the last 30 days.</p>
            
            <div className="flex flex-col gap-[12px]">
              {heatmapData.map((data, i) => {
                const widthPct = (data.count / 1847) * 100;
                return (
                  <div key={data.skill} className="flex items-center gap-[16px]">
                    <div className="w-[140px] text-right font-mono text-[12px] text-[var(--text-primary)] shrink-0">{data.skill}</div>
                    <div className="flex-1 h-[28px] rounded-[3px] overflow-hidden flex items-center bg-white/5">
                      <motion.div 
                        initial={{ width: 0 }} whileInView={{ width: `${widthPct}%` }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                        className="h-full rounded-[3px]"
                        style={{ background: `linear-gradient(to right, ${data.color}33, ${data.color})` }}
                      />
                    </div>
                    <div className="w-[40px] font-mono text-[12px] text-[var(--text-muted)] shrink-0">{data.count}</div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--accent-cyan-dim);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
}
