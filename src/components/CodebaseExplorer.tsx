import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Copy,
  Check,
  Folder,
  FolderOpen,
  FileText,
  Terminal,
  Shield,
  Layers,
  Download,
} from 'lucide-react';
import { TRUSTFLAGS_FILES, SourceFile } from '../data/codebase-files';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(TRUSTFLAGS_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'ci' | 'tests' | 'config' | 'docs'>('all');

  const filteredFiles = TRUSTFLAGS_FILES.filter((f) => {
    return categoryFilter === 'all' || f.category === categoryFilter;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileLines = selectedFile.content.split('\n');

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>TrustFlags Open-Source Architecture & Codebase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready Python repository layout with AST analyzer, PyGithub integration, Shields.io badge generator, Dockerfile, and action.yml.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
              {TRUSTFLAGS_FILES.length} Files Available
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 text-xs mr-2 font-medium">Category:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'all'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setCategoryFilter('core')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'core'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Core Python ({TRUSTFLAGS_FILES.filter((f) => f.category === 'core').length})
          </button>
          <button
            onClick={() => setCategoryFilter('ci')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'ci'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            GitHub Action & Workflows ({TRUSTFLAGS_FILES.filter((f) => f.category === 'ci').length})
          </button>
          <button
            onClick={() => setCategoryFilter('config')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'config'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Docker & Packaging ({TRUSTFLAGS_FILES.filter((f) => f.category === 'config').length})
          </button>
          <button
            onClick={() => setCategoryFilter('tests')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'tests'
                ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Unit Tests ({TRUSTFLAGS_FILES.filter((f) => f.category === 'tests').length})
          </button>
          <button
            onClick={() => setCategoryFilter('docs')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              categoryFilter === 'docs'
                ? 'bg-slate-700 text-slate-200 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Documentation ({TRUSTFLAGS_FILES.filter((f) => f.category === 'docs').length})
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree: File List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              <span>Project Files</span>
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/60 border border-indigo-500/40 text-white shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`} />
                    <div className="overflow-hidden flex-1">
                      <div className="font-semibold truncate">{file.path}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{file.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-2">
          {/* File Header */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-t-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-mono text-xs font-bold text-white">{selectedFile.path}</span>
                <span className="text-[11px] text-slate-400 ml-2">({fileLines.length} lines)</span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied File!' : 'Copy File Content'}</span>
            </button>
          </div>

          {/* Description banner */}
          <div className="bg-slate-900/40 border-x border-slate-800 px-4 py-2 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code Viewer */}
          <div className="border border-slate-800 border-t-0 rounded-b-xl bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="flex max-h-[560px] overflow-y-auto overflow-x-auto">
              {/* Line Numbers */}
              <div className="select-none py-3 px-3 bg-slate-900/60 border-r border-slate-800/80 text-right text-slate-600 font-mono text-xs min-w-[44px]">
                {fileLines.map((_, idx) => (
                  <div key={idx} className="h-5 leading-5">
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Code lines */}
              <pre className="p-3 text-slate-200 font-mono text-xs leading-5 flex-1 whitespace-pre selection:bg-indigo-500/30">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
