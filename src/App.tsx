/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScannerPlayground } from './components/ScannerPlayground';
import { PRSimulationView } from './components/PRSimulationView';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { ActionSetupGuide } from './components/ActionSetupGuide';
import { TestSuiteViewer } from './components/TestSuiteViewer';
import { Shield, Sparkles, CheckCircle2, GitPullRequest, Terminal, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
                <span>Open-Source DevSecOps Standard • Python 3.11+</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Guarantee <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">100% Code Accuracy</span> & Zero Vulnerabilities
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                TrustFlags automatically inspects commits & Pull Requests, triggers AST syntax compilation, runs Bandit security audits & Radon LOC accounting, and awards contributors a verifiable Green Badge or restricts merge rights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('scanner')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Launch Live Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab('pr-simulation')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4 text-sky-400" />
                <span>Simulate PR Check</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'scanner' && <ScannerPlayground />}
        {activeTab === 'pr-simulation' && <PRSimulationView />}
        {activeTab === 'codebase' && <CodebaseExplorer />}
        {activeTab === 'setup' && <ActionSetupGuide />}
        {activeTab === 'tests' && <TestSuiteViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">TrustFlags</span>
            <span>— Automated Code Quality & Security Verification Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Apache-2.0 License</span>
            <span>•</span>
            <span>PyGithub + Bandit + Radon + AST</span>
            <span>•</span>
            <span>GitHub Action & FastAPI Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
