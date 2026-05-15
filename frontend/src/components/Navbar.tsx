import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BrainCircuit, FileSearch, Users, GitCompare, BookOpen,
  Menu, X
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

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-[100] h-[56px] bg-[var(--bg-base)] border-b border-[var(--border)] w-full">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-accent transition-transform duration-200 group-hover:scale-105">
              <BrainCircuit className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display font-bold text-base leading-tight tracking-tight text-[var(--text-primary)]">
                Smart Hire
              </span>
              <span className="text-[10px] leading-tight text-[var(--text-muted)] tracking-wide font-medium uppercase">
                AI Recruitment Intelligence
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 h-full">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-[var(--radius-sm)] text-[14px] font-medium transition-all duration-200
                  ${isActive
                    ? 'text-[var(--accent-bright)] bg-[var(--accent-muted)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : {}
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* API Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                API Live
              </span>
            </div>



            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 top-[56px] z-[90] bg-[var(--bg-base)] md:hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col p-6 gap-2">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-[var(--radius-md)] text-base font-medium transition-all duration-200
                ${isActive
                  ? 'text-[var(--accent-bright)] bg-[var(--accent-muted)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`
              }
              style={({ isActive }) => 
                isActive ? { boxShadow: 'inset 3px 0 0 var(--accent)' } : {}
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
          
          <div className="mt-8 pt-8 border-t border-[var(--border)] flex items-center justify-between px-5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">System Status</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--success-muted)] border border-[var(--success)]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <span className="text-[11px] font-bold text-[var(--success)] uppercase tracking-wider">
                Online
              </span>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
