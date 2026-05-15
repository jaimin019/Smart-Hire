import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Hexagon, Grid, Upload, Network, GitBranch, Scale, Target, Settings,
  FileText, Code2, BarChart2, CheckCircle2
} from 'lucide-react';

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
          const isActive = item.label === "Agent Flow";
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

/* --- INITIAL LOGS --- */
const initialLogs = [
  { time: "09:14:28", level: "INFO", source: "orchestrator", text: "Pipeline initialized · 3 agents registered" },
  { time: "09:14:29", level: "INFO", source: "parser_agent", text: "Received job #1247 · file: resume_arjun.pdf" },
  { time: "09:14:29", level: "INFO", source: "parser_agent", text: "Tokenizing document... 847 tokens extracted" },
  { time: "09:14:29", level: "INFO", source: "parser_agent", text: "NER pass complete · 6 entities found" },
  { time: "09:14:30", level: "INFO", source: "normalizer_agent", text: "Received 14 raw skill tokens" },
  { time: "09:14:30", level: "INFO", source: "normalizer_agent", text: "Taxonomy lookup · 12/14 resolved" },
  { time: "09:14:30", level: "WARN", source: "normalizer_agent", text: "2 skills unresolved → flagged for review" },
  { time: "09:14:31", level: "INFO", source: "matcher_agent", text: "Loading sentence-transformer model" },
  { time: "09:14:31", level: "INFO", source: "matcher_agent", text: "Embedding 12 skill vectors · dim=384" },
  { time: "09:14:32", level: "INFO", source: "matcher_agent", text: "Cosine similarity computed · top score: 94.7%" },
  { time: "09:14:32", level: "INFO", source: "result_aggregator", text: "Compiling final output payload" },
  { time: "09:14:32", level: "SUCCESS", source: "orchestrator", text: "Job #1247 complete · 1.31s · Score: 94.7" },
];

const newRunLogs = [
  { time: "09:18:01", level: "INFO", source: "orchestrator", text: "Job #1248 initiated · resume_alex.docx" },
  { time: "09:18:01", level: "INFO", source: "parser_agent", text: "Parsing text from DOCX container" },
  { time: "09:18:02", level: "INFO", source: "parser_agent", text: "Extracted 1,024 tokens · 9 skills" },
  { time: "09:18:02", level: "INFO", source: "normalizer_agent", text: "Mapping 9 skills to core taxonomy" },
  { time: "09:18:03", level: "INFO", source: "normalizer_agent", text: "All 9 skills successfully resolved" },
  { time: "09:18:03", level: "INFO", source: "matcher_agent", text: "Computing vectors · 384-dim" },
  { time: "09:18:04", level: "INFO", source: "matcher_agent", text: "Score generated: 92.0%" },
  { time: "09:18:04", level: "SUCCESS", source: "orchestrator", text: "Job #1248 complete · 3.60s · Score: 92.0" },
];

/* --- SPARKLINE --- */
const Sparkline = () => (
  <div className="w-full h-[32px] mt-6 relative flex items-end">
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 32">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,32 L0,20 L10,15 L20,22 L30,12 L40,18 L50,8 L60,14 L70,5 L80,10 L90,2 L100,6 L100,32 Z" fill="url(#spark-grad)" />
      <path d="M0,20 L10,15 L20,22 L30,12 L40,18 L50,8 L60,14 L70,5 L80,10 L90,2 L100,6" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  </div>
);

/* --- MAIN PAGE --- */
export default function AgentFlowPage() {
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); 
  const [logLines, setLogLines] = useState(initialLogs);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logLines]);

  const simulateRun = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    setCurrentStage(0);
    setLogLines(prev => [...prev, { time: "09:18:00", level: "INFO", source: "orchestrator", text: "--- NEW SIMULATION RUN ---" }]);
    
    // Stages: 1(Parser), 2(Normalizer), 3(Matcher), 4(Output)
    let logIdx = 0;

    const interval = setInterval(() => {
      // Append a log
      if (logIdx < newRunLogs.length) {
        setLogLines(prev => [...prev, newRunLogs[logIdx]]);
        logIdx++;
      }

      // Advance stage roughly every 2 logs (800-900ms)
      if (logIdx === 2) { setCurrentStage(1); }
      if (logIdx === 4) { setCurrentStage(2); }
      if (logIdx === 6) { setCurrentStage(3); }
      if (logIdx === 8) { 
        setCurrentStage(4); 
        setPipelineRunning(false);
        clearInterval(interval);
      }
    }, 450);
  };

  const getStatus = (nodeIndex: number) => {
    if (currentStage === 0) return 'idle'; // all idle initially
    if (currentStage === 4) return 'done'; // all done at end
    if (currentStage === nodeIndex) return 'processing';
    if (currentStage > nodeIndex) return 'done';
    return 'idle';
  };

  const NodeCard = ({ title, sub, label, icon: Icon, type, idx, stats, status }: any) => {
    const isProcessing = status === 'processing';
    const isDone = status === 'done';
    
    const baseClass = type === 'terminal' 
      ? "w-[160px] h-[90px] bg-[var(--bg-base)] rounded-[8px]" 
      : "w-[170px] h-[100px] bg-[var(--accent-cyan-dim)]";

    const clipStyle = type === 'agent' 
      ? { clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' } 
      : {};

    const borderClass = isProcessing 
      ? 'border-[var(--accent-amber)] shadow-[var(--glow-amber)]' 
      : isDone 
        ? 'border-[var(--accent-cyan)] shadow-[var(--glow-cyan)]' 
        : 'border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:shadow-[var(--glow-cyan)]';

    return (
      <div className="relative group z-10 flex flex-col items-center">
        <div 
          className={`flex flex-col justify-center items-center border transition-all duration-300 relative ${baseClass} ${borderClass} hover:-translate-y-1 cursor-default`}
          style={clipStyle}
        >
          <div className="absolute top-2 w-full flex justify-center text-center">
            <span className={`font-mono text-[10px] tracking-[0.15em] ${type==='agent' ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`}>
              {label}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center mt-3">
            <Icon className={`w-5 h-5 mb-1 ${type==='terminal' ? 'text-[var(--accent-amber)]' : 'text-[var(--accent-cyan)]'}`} />
            <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)]">{title}</h3>
            <span className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</span>
          </div>

          {/* Status Indicator inside card */}
          {type === 'terminal' ? (
            <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${idx===0 ? 'bg-[var(--accent-amber)] animate-pulse' : (isDone ? 'bg-[#00FF88] shadow-[0_0_8px_#00FF88]' : 'bg-[var(--text-muted)]')}`} />
          ) : (
            <div className="absolute bottom-2 w-full flex justify-center">
              <span className="font-mono text-[9px] text-[var(--text-muted)]">{stats}</span>
            </div>
          )}

          {/* Overlay Badge */}
          {type === 'agent' && (isProcessing || isDone) && (
            <div className="absolute -top-3 -right-2">
              {isProcessing ? (
                <div className="bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)] px-2 py-0.5 rounded flex items-center gap-1 shadow-[var(--glow-amber)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] animate-pulse" />
                  <span className="font-mono text-[9px] text-[var(--accent-amber)]">PROC</span>
                </div>
              ) : (
                <div className="bg-[var(--accent-cyan-dim)] border border-[var(--accent-cyan)] px-2 py-0.5 rounded flex items-center gap-1 shadow-[var(--glow-cyan)]">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[var(--accent-cyan)]" />
                  <span className="font-mono text-[9px] text-[var(--accent-cyan)]">DONE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute top-[110px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-[220px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[6px] p-3 shadow-[var(--shadow-card)] pointer-events-none z-50">
          <ul className="flex flex-col gap-1 font-mono text-[10px] text-[var(--text-muted)]">
            <li>Model: <span className="text-[var(--text-primary)]">GPT-4o / LangChain</span></li>
            <li>Success: <span className="text-[var(--text-primary)]">99.8%</span></li>
            <li>Latency: <span className="text-[var(--text-primary)]">~850ms</span></li>
          </ul>
        </div>
      </div>
    );
  };

  // Node X positions in percentage based on flex layout
  const dotPositions = ["10%", "30%", "50%", "70%", "90%"];

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      <Sidebar />
      
      <main className="ml-[240px] flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        {/* Backgrounds */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--accent-cyan) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.05
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.015) 0px, rgba(0,229,255,0.015) 1px, transparent 1px, transparent 28px)',
          }}
        />

        {/* Top Bar */}
        <div className="h-[56px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[32px] flex items-center justify-between relative z-10 shrink-0">
          <div className="font-mono text-[13px] text-[var(--text-muted)] flex items-center">
            <span>Smart-Hire</span>
            <span className="mx-2 text-[var(--accent-amber)]">/</span>
            <span className="text-[var(--text-primary)]">Agent Flow</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" />
            <span className="font-mono text-[12px] text-[var(--text-muted)]">Pipeline Active · Run #1,248</span>
          </div>

          <button 
            onClick={simulateRun}
            disabled={pipelineRunning}
            className="font-display font-semibold text-[13px] text-[var(--accent-amber)] border border-[var(--accent-amber)] px-[20px] py-[8px] rounded-[4px] hover:bg-[var(--accent-amber-dim)] hover:shadow-[var(--glow-amber)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pipelineRunning ? 'Simulating...' : 'Simulate Run'}
          </button>
        </div>

        {/* Content Padding */}
        <div className="p-[32px_40px] relative z-10 flex-1 overflow-y-auto">
          
          {/* SECTION 1 - HEADER */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8"
          >
            <div>
              <h1 className="font-display font-bold text-[32px] text-[var(--text-primary)] leading-tight">
                Agent Orchestration
              </h1>
              <p className="font-sans text-[15px] text-[var(--text-muted)] mt-[6px] max-w-[600px]">
                Live view of TalentGraph AI's LangGraph multi-agent pipeline. Monitor each agent's status, throughput, and decision chain.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: "Runs Today", val: "1,247" },
                { label: "Success", val: "98.2%" },
                { label: "Avg Time", val: "1.31s" }
              ].map(k => (
                <div key={k.label} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-[16px] py-[6px] flex gap-2 font-mono text-[12px]">
                  <span className="text-[var(--text-muted)]">{k.label}</span>
                  <span className="text-[var(--accent-cyan)] font-bold">{k.val}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SECTION 2 - AGENT NODE GRAPH */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[12px] p-[40px] mb-8 relative">
            <div className="relative w-full h-[120px] flex items-center justify-between px-[5%]">
              
              {/* SVG Connectors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {/* Base dashed line */}
                <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="rgba(0,229,255,0.25)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-[dash_1.5s_linear_infinite]" />
                
                {/* Active glow line */}
                {currentStage > 0 && currentStage < 4 && (
                  <motion.line 
                    x1={dotPositions[currentStage - 1]} y1="50%" 
                    x2={dotPositions[currentStage]} y2="50%" 
                    stroke="var(--accent-cyan)" strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.6))' }}
                  />
                )}
                
                {/* Traveling dot */}
                {currentStage > 0 && currentStage < 4 && (
                  <motion.circle 
                    cy="50%" r="4" fill="var(--accent-cyan)"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,1))' }}
                    initial={{ cx: dotPositions[currentStage - 1] }}
                    animate={{ cx: dotPositions[currentStage] }}
                    transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
                  />
                )}
              </svg>
              <style>{`@keyframes dash { to { stroke-dashoffset: -40; } }`}</style>

              {/* Nodes */}
              <NodeCard idx={0} type="terminal" label="INPUT" title="Resume Input" sub="PDF / DOCX" icon={FileText} status={getStatus(0)} />
              <NodeCard idx={1} type="agent" label="AGENT · 01" title="Parser Agent" sub="parser_agent.py" icon={Code2} stats="847 tokens · 12ms" status={getStatus(1)} />
              <NodeCard idx={2} type="agent" label="AGENT · 02" title="Normalizer Agent" sub="normalizer_agent.py" icon={Network} stats="14 skills · 84ms" status={getStatus(2)} />
              <NodeCard idx={3} type="agent" label="AGENT · 03" title="Matcher Agent" sub="matcher_agent.py" icon={Target} stats="384-dim · 210ms" status={getStatus(3)} />
              <NodeCard idx={4} type="terminal" label="OUTPUT" title="Match Score" sub="result_aggregator" icon={BarChart2} status={getStatus(4)} />
            </div>
          </div>

          {/* SECTION 3 - AGENT DETAIL CARDS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
            {[
              { id: "01", name: "Parser Agent", path: "agents/parser_agent.py", status: "READY", m: ["1,247", "12ms", "1.04M", "0.0%"], ml: ["Runs Today", "Avg Latency", "Tokens Processed", "Error Rate"] },
              { id: "02", name: "Normalizer Agent", path: "agents/normalizer_agent.py", status: "READY", m: ["1,247", "84ms", "14.2k", "1.2%"], ml: ["Runs Today", "Avg Latency", "Skills Resolved", "Error Rate"] },
              { id: "03", name: "Matcher Agent", path: "agents/matcher_agent.py", status: "READY", m: ["1,247", "210ms", "1.04M", "87.4"], ml: ["Runs Today", "Avg Latency", "Embeddings Gen", "Avg Score"] },
            ].map((agent, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[10px] p-[24px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
                    <span className="font-mono text-[10px] text-[var(--accent-cyan)]">AGENT · {agent.id}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded font-mono text-[9px] ${getStatus(i+1) === 'processing' ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[var(--accent-amber)]' : 'bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]'}`}>
                    {getStatus(i+1) === 'processing' ? 'PROCESSING' : 'READY'}
                  </div>
                </div>
                <h3 className="font-display font-bold text-[18px] text-[var(--text-primary)] mt-2">{agent.name}</h3>
                <p className="font-mono text-[12px] text-[var(--text-muted)]">{agent.path}</p>
                
                <div className="h-px bg-[var(--border-subtle)] my-4" />
                
                <div className="grid grid-cols-2 gap-4">
                  {agent.m.map((val, mi) => (
                    <div key={mi}>
                      <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase">{agent.ml[mi]}</div>
                      <div className="font-display font-semibold text-[20px] text-[var(--accent-cyan)]">{val}</div>
                    </div>
                  ))}
                </div>
                
                <div className="h-px bg-[var(--border-subtle)] mt-4" />
                <Sparkline />
              </div>
            ))}
          </div>

          {/* SECTION 4 - LIVE PIPELINE LOG */}
          <div className="bg-[#050709] border border-[rgba(0,229,255,0.2)] rounded-[8px] overflow-hidden shadow-lg">
            <div className="h-[36px] bg-[#0A0D12] border-b border-[rgba(0,229,255,0.1)] flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="font-mono text-[12px] text-[var(--text-muted)] ml-2">pipeline.log — Live Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="font-mono text-[11px] text-red-500 tracking-wider">LIVE</span>
              </div>
            </div>
            
            <div ref={logContainerRef} className="h-[220px] overflow-y-auto p-[16px_20px] font-mono text-[12px] flex flex-col gap-1 scroll-smooth">
              {logLines.map((log, i) => {
                let colorClass = 'text-[var(--text-primary)]';
                if (log.level === 'INFO') colorClass = 'text-[var(--accent-cyan)]';
                if (log.level === 'WARN') colorClass = 'text-[var(--accent-amber)]';
                if (log.level === 'SUCCESS') colorClass = 'text-[#00FF88]';
                if (log.level === 'ERROR') colorClass = 'text-red-500';

                return (
                  <div key={i} className="flex gap-4 opacity-90 hover:opacity-100 hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                    <span className="text-[var(--accent-amber)] shrink-0">[{log.time}]</span>
                    <span className={`${colorClass} w-[60px] shrink-0`}>{log.level}</span>
                    <span className={`${colorClass} opacity-70 w-[140px] shrink-0 truncate`}>{log.source}:</span>
                    <span className="text-[var(--text-primary)] whitespace-pre-wrap">{log.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="h-[28px] bg-[#0A0D12] border-t border-[rgba(0,229,255,0.1)] flex items-center justify-between px-4">
              <span className="font-mono text-[11px] text-[var(--text-muted)]">Showing last {logLines.length} lines · 0 errors · 1 warning</span>
              <div className="flex gap-3">
                <button onClick={() => setLogLines([])} className="font-mono text-[10px] text-[var(--text-muted)] hover:text-white transition-colors uppercase">Clear</button>
                <button className="font-mono text-[10px] text-[var(--text-muted)] hover:text-white transition-colors uppercase">Export Logs</button>
              </div>
            </div>
          </div>

          {/* SECTION 5 - HEALTH FOOTER STRIP */}
          <div className="mt-8 py-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-6">
            {[
              { l: "LangGraph", v: "Connected", dot: "bg-green-500" },
              { l: "SQLite DB", v: "Online", dot: "bg-green-500" },
              { l: "Embedding Model", v: "Loaded (384-dim)", dot: "bg-green-500" },
              { l: "Job Queue", v: "3 pending", dot: "bg-[var(--accent-amber)]" },
              { l: "Last Error", v: "None (24h clean)", dot: "bg-gray-500" },
            ].map(h => (
              <div key={h.l} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${h.dot}`} />
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-[var(--text-muted)] leading-tight">{h.l}</span>
                  <span className="font-sans text-[13px] text-[var(--text-primary)] font-medium leading-tight">{h.v}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
