import React, { useState, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCode,
  Flame,
  Bug,
  Lock,
  Play,
  RotateCcw,
  Search,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import { CODE_PRESETS, CodePreset } from '../data/presets';
import { analyzePythonCode, TrustFlagsReport } from '../utils/trustflags-core';
import { BadgeRenderer } from './BadgeRenderer';

interface ScannerPlaygroundProps {
  onSimulatePR?: (report: TrustFlagsReport) => void;
}

export const ScannerPlayground: React.FC<ScannerPlaygroundProps> = ({ onSimulatePR }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('clean');
  const [filename, setFilename] = useState<string>('auth_service.py');
  const [code, setCode] = useState<string>(CODE_PRESETS[0].code);
  const [committer, setCommitter] = useState<string>('alex-dev');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'security' | 'syntax' | 'lint' | 'test'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Run analysis
  const report: TrustFlagsReport = useMemo(() => {
    return analyzePythonCode(filename, code, committer);
  }, [filename, code, committer]);

  const handleSelectPreset = (preset: CodePreset) => {
    setSelectedPresetId(preset.id);
    setFilename(preset.filename);
    setCode(preset.code);
  };

  const handleReset = () => {
    const current = CODE_PRESETS.find((p) => p.id === selectedPresetId) || CODE_PRESETS[0];
    setCode(current.code);
    setFilename(current.filename);
  };

  // Filter issues
  const filteredIssues = useMemo(() => {
    return report.issues.filter((issue) => {
      const matchesCategory =
        activeCategoryFilter === 'all' || issue.category === activeCategoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.codeSnippet && issue.codeSnippet.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [report.issues, activeCategoryFilter, searchQuery]);

  // Code editor lines
  const codeLines = useMemo(() => code.split(/\r?\n/), [code]);
  const errorLineNumbers = useMemo(() => new Set(report.issues.map((i) => i.lineNumber)), [report.issues]);

  return (
    <div className="space-y-6">
      {/* Top Presets Banner */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Verification Test Presets
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Switch between presets to observe the 100% accuracy rule and badge assignment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {CODE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-3 rounded-xl border transition-all relative ${
                  isSelected
                    ? preset.badgeType === 'green'
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/30'
                    : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    preset.badgeType === 'green'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {preset.badgeType === 'green' ? '🟢 GREEN' : '🔴 RED'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]">
                    {preset.filename}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{preset.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Code Editor + Realtime Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-t-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-transparent text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 px-1 py-0.5 rounded border border-transparent hover:border-slate-700"
                placeholder="filename.py"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                ({codeLines.length} lines)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Committer:</span>
                <input
                  type="text"
                  value={committer}
                  onChange={(e) => setCommitter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 font-mono w-28 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleReset}
                title="Reset to preset original"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Code Editor with Line Numbers */}
          <div className="relative border border-slate-800 border-t-0 rounded-b-xl bg-slate-950 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex">
              {/* Line numbers gutter */}
              <div className="select-none py-3 px-3 bg-slate-900/70 border-r border-slate-800/80 text-right text-slate-500 font-mono text-xs min-w-[44px]">
                {codeLines.map((_, idx) => {
                  const lineNum = idx + 1;
                  const hasError = errorLineNumbers.has(lineNum);
                  return (
                    <div
                      key={idx}
                      className={`h-5 leading-5 ${
                        hasError ? 'text-rose-400 font-bold bg-rose-950/40 -mx-3 px-3' : ''
                      }`}
                    >
                      {lineNum}
                    </div>
                  );
                })}
              </div>

              {/* Textarea */}
              <div className="relative flex-1">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  rows={codeLines.length + 2}
                  className="w-full h-full min-h-[380px] p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 focus:outline-none resize-none whitespace-pre overflow-x-auto selection:bg-emerald-500/30"
                  placeholder="Paste or type Python code to scan..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              💡 Edit code in real-time: AST, Bandit rules, and Radon LOC update immediately.
            </span>
            <span className="font-mono text-emerald-400">
              {report.passed ? '✓ 0 error lines' : `⚠️ ${errorLineNumbers.size} error line(s)`}
            </span>
          </div>
        </div>

        {/* Right Column: Real-time Analysis Report (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Badge Display */}
          <BadgeRenderer report={report} />

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Accuracy Score Card */}
            <div className={`p-4 rounded-xl border ${
              report.passed
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="text-xs text-slate-400 font-medium">Accuracy Score</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold tracking-tight ${
                  report.passed ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {report.accuracyScore}%
                </span>
                <span className="text-[11px] font-mono text-slate-400">/ 100% req</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    report.passed ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(5, report.accuracyScore)}%` }}
                />
              </div>
            </div>

            {/* Merge Gate Verdict Card */}
            <div className={`p-4 rounded-xl border ${
              report.passed
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="text-xs text-slate-400 font-medium">GitHub Merge Gate</div>
              <div className="flex items-center gap-2 mt-1">
                {report.passed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className={`text-sm font-bold ${report.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {report.passed ? 'MERGE ALLOWED' : 'MERGE BLOCKED'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {report.passed ? 'Commit status: success' : 'Commit status: failure'}
              </div>
            </div>

            {/* Radon LOC Breakdown */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-medium">Radon LOC Breakdown</span>
                <span className="text-xs font-mono font-bold text-slate-200">{report.totalLoc} lines</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Executable Code:</span>
                  <span className="font-mono text-slate-300">{report.locBreakdown.codeLines}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comments & Docs:</span>
                  <span className="font-mono text-slate-300">{report.locBreakdown.commentLines}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blank Lines:</span>
                  <span className="font-mono text-slate-300">{report.locBreakdown.blankLines}</span>
                </div>
              </div>
            </div>

            {/* Error Counts Breakdown */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-medium">Error Counts</span>
                <span className={`text-xs font-mono font-bold ${report.totalErrors === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report.totalErrors} total
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">🧪 Tests (Unittest/pytest):</span>
                  <span className={`font-mono font-semibold ${report.testFailures > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {report.testFailures}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🛡️ Security (Bandit):</span>
                  <span className={`font-mono font-semibold ${report.securityIssues > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {report.securityIssues}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">💥 Syntax (AST):</span>
                  <span className={`font-mono font-semibold ${report.syntaxErrors > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {report.syntaxErrors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🧹 Lint (Flake8):</span>
                  <span className={`font-mono font-semibold ${report.lintErrors > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {report.lintErrors}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-200">
              Detailed Findings & Code Issues ({report.issues.length})
            </h3>
            {report.passed && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                0 Errors • Perfect Compliance
              </span>
            )}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule or code..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCategoryFilter === 'all'
                    ? 'bg-slate-800 text-slate-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                All ({report.issues.length})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('test')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCategoryFilter === 'test'
                    ? 'bg-purple-500/20 text-purple-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Tests ({report.testFailures})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('security')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCategoryFilter === 'security'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Security ({report.securityIssues})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('syntax')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCategoryFilter === 'syntax'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Syntax ({report.syntaxErrors})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('lint')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCategoryFilter === 'lint'
                    ? 'bg-sky-500/20 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Lint ({report.lintErrors})
              </button>
            </div>
          </div>
        </div>

        {/* Findings List */}
        {filteredIssues.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Rule ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Message & Code Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredIssues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      <span className="text-emerald-400">{issue.filePath}</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-amber-400 font-bold">{issue.lineNumber}</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-slate-400">{issue.column}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        issue.category === 'test'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : issue.category === 'security'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : issue.category === 'syntax'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {issue.category === 'test' && '🧪 Test Fail'}
                        {issue.category === 'security' && '🛡️ Security'}
                        {issue.category === 'syntax' && '💥 Syntax'}
                        {issue.category === 'lint' && '🧹 Lint'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                      {issue.ruleId}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        issue.severity === 'critical' || issue.severity === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/80'
                      }`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{issue.message}</div>
                      {issue.codeSnippet && (
                        <div className="mt-1 font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 inline-block">
                          <code>{issue.codeSnippet}</code>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-200">No issues found</div>
            <div className="text-xs text-slate-400 mt-1">
              {report.passed
                ? 'All AST, Bandit, and lint checks passed with 100% accuracy.'
                : 'No issues match your active search and filter criteria.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
