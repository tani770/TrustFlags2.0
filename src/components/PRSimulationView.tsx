import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Shield,
  FileCode,
  FileText,
  AlertTriangle,
  GitBranch,
  Terminal,
  Eye,
  Layers,
} from 'lucide-react';
import { analyzePythonCode, TrustFlagsReport } from '../utils/trustflags-core';
import { CODE_PRESETS } from '../data/presets';

export const PRSimulationView: React.FC = () => {
  const [prPreset, setPrPreset] = useState<'clean' | 'vulnerable'>('vulnerable');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeGithubTab, setActiveGithubTab] = useState<'conversation' | 'diff' | 'summary' | 'commands'>('conversation');
  const [commentFormat, setCommentFormat] = useState<'rendered' | 'raw'>('rendered');

  const selectedCode = prPreset === 'clean' ? CODE_PRESETS[0].code : CODE_PRESETS[1].code;
  const filename = prPreset === 'clean' ? CODE_PRESETS[0].filename : CODE_PRESETS[1].filename;
  const committer = prPreset === 'clean' ? 'octocat' : 'contributor-dev';

  const report: TrustFlagsReport = analyzePythonCode(filename, selectedCode, committer);
  const codeLines = selectedCode.split('\n');

  // Markdown comment format
  const rawMarkdown = `## ${report.passed ? '🟢' : '🔴'} TrustFlags Verification Report

[![TrustFlags Status](${report.badgeUrl})](${report.badgeUrl})

**Committer:** \`@${report.committer}\` | **Status:** **${
    report.passed ? 'PASS: 100% ACCURATE / TRUSTED' : `FAIL: ${report.totalErrors} ISSUES DETECTED / FLAGGED`
  }**

### 📊 Code Quality & Security Metrics

| Metric | Value | Threshold / Standard |
| :--- | :--- | :--- |
| **Accuracy Score** | **${report.accuracyScore}%** | **100.0% Required** |
| **Total Lines of Code (LOC)** | \`${report.totalLoc}\` lines | Radon Metrics |
| ↳ Source Code Lines | \`${report.locBreakdown.codeLines}\` lines | Executable logic |
| ↳ Blank Lines | \`${report.locBreakdown.blankLines}\` lines | Formatting |
| ↳ Comments / Docstrings | \`${report.locBreakdown.commentLines}\` lines | Documentation |
| **Syntax Errors (AST)** | \`${report.syntaxErrors}\` | 0 allowed |
| **Lint Issues (Ruff / Flake8)** | \`${report.lintErrors}\` | 0 allowed |
| **Security Issues (Bandit)** | \`${report.securityIssues}\` | 0 allowed |
| **Total Errors** | **\`${report.totalErrors}\`** | **0 required for Green Badge** |
| **Merge Gate Verdict** | ${
    report.passed
      ? '✅ **MERGE ALLOWED** - All checks passed with zero errors.'
      : '❌ **MERGE BLOCKED** - Contributor must resolve all security issues and lint errors to achieve 100% accuracy.'
  } | Enforced by Branch Protection |

${
  report.issues.length > 0
    ? `<details>
<summary><b>🔍 View Detailed Breakdown of Issues (${report.issues.length})</b></summary>

| File & Line | Category | Rule | Severity | Message |
| :--- | :--- | :--- | :--- | :--- |
${report.issues
  .map(
    (i) =>
      `| \`${i.filePath}:${i.lineNumber}:${i.column}\` | ${i.category.toUpperCase()} | \`${i.ruleId}\` | ${i.severity.toUpperCase()} | ${i.message} |`
  )
  .join('\n')}

</details>`
    : `> 🎉 **Flawless Pull Request!** No syntax errors, code smells, or security vulnerabilities were identified.`
}

---
*Generated automatically by [TrustFlags](https://github.com/marketplace/actions/trustflags-verifier) • Automated Code Quality & Security Verification*`;

  // GitHub Actions Workflow commands
  const workflowCommands = report.issues
    .map(
      (i) =>
        `::${i.severity === 'critical' || i.severity === 'high' ? 'error' : 'warning'} file=${i.filePath},line=${i.lineNumber},col=${i.column},title=TrustFlags [${i.ruleId} - ${i.category.toUpperCase()}]::${i.message}`
    )
    .join('\n');

  const copyMarkdown = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Native GitHub Embedding • Zero External Portal Needed</span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-sky-400" />
            <span>Native GitHub Integration Preview</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            TrustFlags lives entirely inside GitHub: inline diff annotations, commit check status, PR comment, and Step Summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">PR Scenario:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPrPreset('vulnerable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                prPreset === 'vulnerable'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              🔴 Vulnerable PR (Blocked)
            </button>
            <button
              onClick={() => setPrPreset('clean')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                prPreset === 'clean'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              🟢 Clean PR (Approved)
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* GitHub PR Title Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {prPreset === 'clean'
                    ? 'feat(auth): implement hardened pbkdf2 password hashing and salt verification'
                    : 'feat(api): add dynamic user evaluation and system backup endpoints'}
                </span>
                <span className="text-slate-500 text-lg font-normal">#42</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  report.passed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <GitPullRequest className="w-3.5 h-3.5" />
                  Open
                </span>
                <span>
                  <strong className="text-slate-200">@{report.committer}</strong> wants to merge 1 commit into{' '}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-sky-400">main</span> from{' '}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-sky-400">
                    feat/{prPreset === 'clean' ? 'secure-auth' : 'vulnerable-api'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy PR Markdown'}</span>
              </button>
            </div>
          </div>

          {/* GitHub PR Tabs Navigation */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveGithubTab('conversation')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
                activeGithubTab === 'conversation'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversation (Bot Comment)</span>
            </button>

            <button
              onClick={() => setActiveGithubTab('diff')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
                activeGithubTab === 'diff'
                  ? 'border-rose-400 text-rose-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Files Changed (Inline Annotations)</span>
              {report.issues.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {report.issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveGithubTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
                activeGithubTab === 'summary'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>GitHub Actions Job Summary</span>
            </button>

            <button
              onClick={() => setActiveGithubTab('commands')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors shrink-0 ${
                activeGithubTab === 'commands'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Workflow ::error Commands</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Conversation View (PR Bot Comment + Merge Box) */}
        {activeGithubTab === 'conversation' && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">trustflags-bot</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      bot
                    </span>
                    <span className="text-slate-500">commented automated verification</span>
                  </div>
                  <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setCommentFormat('rendered')}
                      className={`px-2 py-0.5 rounded ${
                        commentFormat === 'rendered' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Rendered
                    </button>
                    <button
                      onClick={() => setCommentFormat('raw')}
                      className={`px-2 py-0.5 rounded ${
                        commentFormat === 'raw' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Raw Markdown
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {commentFormat === 'rendered' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>{report.passed ? '🟢' : '🔴'}</span>
                            <span>TrustFlags Verification Report</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Committer: <code className="text-emerald-400 font-mono">@{report.committer}</code> • Status:{' '}
                            <strong className={report.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {report.passed ? 'PASS: 100% ACCURATE / TRUSTED' : `FAIL: ${report.totalErrors} ISSUES DETECTED`}
                            </strong>
                          </p>
                        </div>
                        <img src={report.badgeUrl} alt="TrustFlags Badge" className="h-7 w-auto" />
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Metric</th>
                              <th className="py-2 px-3">Value</th>
                              <th className="py-2 px-3">Threshold / Standard</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-200">Accuracy Score</td>
                              <td className={`py-2 px-3 font-mono font-bold ${report.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {report.accuracyScore}%
                              </td>
                              <td className="py-2 px-3 font-mono text-emerald-400">100.0% Required</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-200">Total Lines of Code (LOC)</td>
                              <td className="py-2 px-3 font-mono">{report.totalLoc} lines</td>
                              <td className="py-2 px-3 text-slate-400">Radon Metrics (Executable: {report.locBreakdown.codeLines})</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-200">Syntax Errors (AST)</td>
                              <td className={`py-2 px-3 font-mono ${report.syntaxErrors === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {report.syntaxErrors}
                              </td>
                              <td className="py-2 px-3 text-slate-400">0 allowed</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-200">Lint Issues (Ruff / Flake8)</td>
                              <td className={`py-2 px-3 font-mono ${report.lintErrors === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {report.lintErrors}
                              </td>
                              <td className="py-2 px-3 text-slate-400">0 allowed</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-200">Security Issues (Bandit)</td>
                              <td className={`py-2 px-3 font-mono ${report.securityIssues === 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                                {report.securityIssues}
                              </td>
                              <td className="py-2 px-3 text-slate-400">0 allowed</td>
                            </tr>
                            <tr className={report.passed ? 'bg-emerald-950/20' : 'bg-rose-950/20'}>
                              <td className="py-2 px-3 font-bold text-white">Merge Gate Verdict</td>
                              <td colSpan={2} className="py-2 px-3">
                                {report.passed ? (
                                  <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    MERGE ALLOWED - All checks passed with zero errors.
                                  </span>
                                ) : (
                                  <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                    MERGE BLOCKED - Contributor must resolve all security issues and lint errors.
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
                      {rawMarkdown}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* GitHub Native Commit Status & Merge Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {report.passed ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-rose-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {report.passed ? 'All checks have passed' : '1 check has failed - Merge blocked'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {report.passed
                        ? '1 successful check before merging'
                        : 'Required check failed. Resolving issues is required to proceed.'}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  report.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {report.passed ? 'status: SUCCESS' : 'status: FAILURE'}
                </span>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={report.passed ? 'text-emerald-400' : 'text-rose-400'}>
                    {report.passed ? '✓' : '✗'}
                  </span>
                  <span className="font-semibold text-slate-200">TrustFlags / Verification Gate</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-slate-400">
                    {report.passed
                      ? `Passed with 100% accuracy (${report.totalLoc} LOC)`
                      : `Blocked! ${report.totalErrors} errors/vulnerabilities (${report.accuracyScore}%).`}
                  </span>
                </div>
                <span className="text-slate-500">Required</span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  disabled={!report.passed}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    report.passed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>{report.passed ? 'Merge pull request' : 'Merging is blocked'}</span>
                </button>
                {!report.passed && (
                  <span className="text-xs text-rose-400">
                    ⚠️ GitHub Protected Branch rules block merge until TrustFlags passes.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Files Changed (Native Inline GitHub Annotations) */}
        {activeGithubTab === 'diff' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-slate-200">{filename}</span>
                <span className="text-slate-400">({codeLines.length} lines modified)</span>
              </div>
              <span className="text-rose-400 font-mono text-[11px]">
                {report.issues.length} GitHub Inline Annotation(s)
              </span>
            </div>

            {/* Code Diff with Inline Annotations */}
            <div className="border border-slate-800 rounded-xl bg-slate-950 font-mono text-xs overflow-hidden">
              {codeLines.map((line, idx) => {
                const lineNum = idx + 1;
                const lineIssues = report.issues.filter((i) => i.lineNumber === lineNum);
                const hasError = lineIssues.length > 0;

                return (
                  <div key={idx} className="group">
                    {/* Diff Code Line */}
                    <div className={`flex items-center hover:bg-slate-900/60 transition-colors ${
                      hasError ? 'bg-rose-950/20' : ''
                    }`}>
                      <div className="w-12 text-right pr-3 select-none text-slate-500 border-r border-slate-800 bg-slate-900/40 py-1">
                        {lineNum}
                      </div>
                      <div className="w-6 text-center select-none text-emerald-400 font-bold bg-emerald-950/20 py-1">
                        +
                      </div>
                      <div className="flex-1 px-3 py-1 text-slate-200 whitespace-pre overflow-x-auto">
                        {line}
                      </div>
                    </div>

                    {/* GitHub Native Inline Error Callout Banner */}
                    {lineIssues.map((issue, issueIdx) => (
                      <div
                        key={issueIdx}
                        className="mx-6 my-2 p-3 rounded-lg bg-rose-950/80 border border-rose-500/60 shadow-lg font-sans text-xs flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-200">
                              TrustFlags [{issue.ruleId}]
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-900/80 text-rose-300 uppercase">
                              {issue.category} • {issue.severity}
                            </span>
                            <span className="text-slate-400 text-[11px] font-mono">
                              line {issue.lineNumber}:{issue.column}
                            </span>
                          </div>
                          <div className="text-rose-100 text-xs mt-1">
                            {issue.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: GitHub Actions Step Summary */}
        {activeGithubTab === 'summary' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">
                  $GITHUB_STEP_SUMMARY Dashboard
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  github.com/actions/runs/84920412
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Whenever TrustFlags runs in GitHub Actions, it automatically appends its Markdown report to <code className="text-emerald-400 font-mono">$GITHUB_STEP_SUMMARY</code>, giving maintainers this dashboard directly inside GitHub’s run interface without leaving github.com.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl bg-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{report.passed ? '🟢' : '🔴'}</span>
                  <span>TrustFlags Verification Report</span>
                </h3>
                <img src={report.badgeUrl} alt="TrustFlags Badge" className="h-7 w-auto" />
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Metric</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Threshold / Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-semibold">Accuracy Score</td>
                      <td className={`p-2.5 font-mono font-bold ${report.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {report.accuracyScore}%
                      </td>
                      <td className="p-2.5 text-emerald-400">100.0% Required</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Total LOC Analyzed</td>
                      <td className="p-2.5 font-mono">{report.totalLoc} lines</td>
                      <td className="p-2.5 text-slate-400">Radon Metrics</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Total Errors</td>
                      <td className={`p-2.5 font-mono font-bold ${report.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {report.totalErrors}
                      </td>
                      <td className="p-2.5 text-slate-400">0 required</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Workflow ::error Commands */}
        {activeGithubTab === 'commands' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 font-mono">
                GitHub Actions Workflow Commands (Stdout)
              </span>
              <p className="text-xs text-slate-400">
                GitHub’s runner automatically intercepts lines starting with <code className="text-amber-400 font-mono">::error</code> or <code className="text-amber-400 font-mono">::warning</code> and creates rich annotations in the GitHub web interface:
              </p>
            </div>

            <pre className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre">
              {workflowCommands || '::notice::TrustFlags verified 100% accuracy with 0 errors.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
