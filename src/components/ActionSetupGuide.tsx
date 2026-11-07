import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  Copy,
  Check,
  Server,
  Zap,
  Lock,
  GitBranch,
  Settings,
} from 'lucide-react';

export const ActionSetupGuide: React.FC = () => {
  const [failOnError, setFailOnError] = useState<boolean>(true);
  const [postComment, setPostComment] = useState<boolean>(true);
  const [setStatus, setSetStatus] = useState<boolean>(true);
  const [scanPaths, setScanPaths] = useState<string>('.');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const workflowYaml = `name: TrustFlags Verification

on:
  push:
    branches: [ main, develop ]
  pull_request:
    types: [ opened, synchronize, reopened ]

permissions:
  contents: read
  pull-requests: write
  statuses: write

jobs:
  verify:
    runs-on: ubuntu-latest
    name: TrustFlags Code Quality & Security Audit
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run TrustFlags
        uses: trustflags/trustflags@v1
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          paths: '${scanPaths}'
          fail_on_errors: ${failOnError ? 'true' : 'false'}
          post_pr_comment: ${postComment ? 'true' : 'false'}
          set_commit_status: ${setStatus ? 'true' : 'false'}
`;

  const pipInstallCommand = `pip install trustflags\n# or with all linters and security scanners:\npip install "trustflags[full]"`;
  const cliScanCommand = `trustflags scan . --fail-on-errors --json report.json --svg badge.svg`;
  const webhookCommand = `trustflags serve --host 0.0.0.0 --port 8000`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <span>GitHub Action & Webhook Integration Setup</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Drop TrustFlags into any open-source GitHub repository in 5 lines of YAML or deploy as a standalone webhook server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive YAML Generator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">5-Line Workflow Builder</h3>
              </div>
              <button
                onClick={() => copyToClipboard(workflowYaml, 'workflow')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer"
              >
                {copiedType === 'workflow' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'workflow' ? 'Copied Workflow!' : 'Copy Workflow YAML'}</span>
              </button>
            </div>

            {/* Options Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={failOnError}
                  onChange={(e) => setFailOnError(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <div>
                  <span className="font-semibold text-slate-200">Fail CI on Red Badge</span>
                  <div className="text-[10px] text-slate-400">Exit code 1 on errors</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={postComment}
                  onChange={(e) => setPostComment(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <div>
                  <span className="font-semibold text-slate-200">Post PR Comment</span>
                  <div className="text-[10px] text-slate-400">Interactive markdown table</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={setStatus}
                  onChange={(e) => setSetStatus(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <div>
                  <span className="font-semibold text-slate-200">Set Commit Status</span>
                  <div className="text-[10px] text-slate-400">Enforces GitHub branch rules</div>
                </div>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Scan Paths:</span>
                <input
                  type="text"
                  value={scanPaths}
                  onChange={(e) => setScanPaths(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 font-mono flex-1"
                />
              </div>
            </div>

            {/* Generated YAML Code */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto text-slate-200 leading-relaxed">
              <pre className="whitespace-pre">{workflowYaml}</pre>
            </div>

            <div className="text-xs text-slate-400">
              Save this file as <code className="text-emerald-400 font-mono">.github/workflows/trustflags.yml</code> in your repository.
            </div>
          </div>
        </div>

        {/* Right Column: CLI & Webhook Server Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* CLI Installation */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Local CLI Installation</span>
              </h3>
              <button
                onClick={() => copyToClipboard(pipInstallCommand, 'pip')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedType === 'pip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'pip' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              <code>{pipInstallCommand}</code>
            </div>

            <div className="text-xs text-slate-400 space-y-2">
              <p>Run a local scan before pushing your commit:</p>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <code>{cliScanCommand}</code>
              </div>
            </div>
          </div>

          {/* Webhook Server Mode */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <span>FastAPI Webhook Server Mode</span>
              </h3>
              <button
                onClick={() => copyToClipboard(webhookCommand, 'serve')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedType === 'serve' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'serve' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Run TrustFlags as a standalone central webhook service for your GitHub organization:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-sky-400">
              <code>{webhookCommand}</code>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div className="font-semibold text-slate-300">Environment Variables:</div>
              <div className="font-mono text-[11px] text-slate-400 space-y-1">
                <div><span className="text-emerald-400">GITHUB_TOKEN</span>: Bot API token</div>
                <div><span className="text-emerald-400">GITHUB_WEBHOOK_SECRET</span>: HMAC signature</div>
                <div><span className="text-emerald-400">PORT</span>: Default 8000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
