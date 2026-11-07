import React from 'react';
import { Shield, GitPullRequest, Code2, Terminal, CheckCircle2, FileText, Sparkles } from 'lucide-react';

export type ActiveTab = 'scanner' | 'pr-simulation' | 'codebase' | 'setup' | 'tests';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  statusText?: string;
  isGreen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  statusText = 'READY',
  isGreen = true,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-indigo-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">TrustFlags</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  v1.0.0
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Python 3.11+ DevSecOps
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Automated Code Quality & Security Verification Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 max-w-full no-scrollbar">
            <button
              onClick={() => onTabChange('scanner')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'scanner'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Scanner & Playground</span>
            </button>

            <button
              onClick={() => onTabChange('pr-simulation')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'pr-simulation'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              <span>PR Simulation</span>
            </button>

            <button
              onClick={() => onTabChange('codebase')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'codebase'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Codebase Explorer</span>
            </button>

            <button
              onClick={() => onTabChange('setup')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'setup'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Action & Webhook</span>
            </button>

            <button
              onClick={() => onTabChange('tests')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'tests'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Test Suite</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
