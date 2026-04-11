import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Cpu, FileSearch, Users, GitCompare, BookOpen,
  Menu, X, Zap, ExternalLink,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/analyze', label: 'Analyze', icon: FileSearch },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/taxonomy', label: 'Taxonomy', icon: BookOpen },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300
        backdrop-blur-xl border-b
        ${isLanding
          ? 'bg-transparent border-transparent'
          : 'bg-[var(--color-bg-primary)]/85 border-[var(--color-border-subtle)]'
        }`}
    >
      <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-violet)] flex items-center justify-center shadow-lg shadow-[var(--color-accent-glow)] group-hover:scale-110 transition-transform duration-200">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold gradient-text leading-tight">Smart Hire</p>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight -mt-0.5">
              Multi-Agent Resume Intelligence
            </p>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent-light)] border border-[var(--color-accent)]/20'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <Zap className="w-3 h-3 text-[var(--color-accent-light)]" />
            <span className="text-[10px] text-[var(--color-text-muted)]">LangGraph + GPT-4o</span>
          </div>
          <a
            href="https://github.com/jaimin019/Smart-Hire"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center
              bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
              text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
              hover:border-[var(--color-accent)] transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center
              bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]
              text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
              transition-all duration-200"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/95 backdrop-blur-xl">
          <nav className="max-w-[1700px] mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent-light)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
