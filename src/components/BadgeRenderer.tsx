import React, { useState } from 'react';
import { Shield, Copy, Check, Download, ExternalLink, Sparkles } from 'lucide-react';
import { TrustFlagsReport, generateSvgBadge } from '../utils/trustflags-core';

interface BadgeRendererProps {
  report: TrustFlagsReport;
}

export const BadgeRenderer: React.FC<BadgeRendererProps> = ({ report }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const svgContent = generateSvgBadge(report);
  const shieldsUrl = report.badgeUrl;
  const markdownSnippet = `[![TrustFlags Status](${shieldsUrl})](${shieldsUrl})`;
  const htmlSnippet = `<a href="https://github.com/marketplace/actions/trustflags-verifier"><img src="${shieldsUrl}" alt="TrustFlags Status" /></a>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustflags-badge-${report.badgeStatus.toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      report.passed
        ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30 shadow-xl shadow-emerald-950/20'
        : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/30 shadow-xl shadow-rose-950/20'
    }`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Badge & Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
              report.passed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {report.passed ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Green Badge Awarded
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Red Badge Flagged
                </>
              )}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {report.passed ? '100% Accuracy Standard Met' : `${report.totalErrors} Error(s) - Merge Restricted`}
            </span>
          </div>

          {/* Rendered Live SVG Badge */}
          <div className="pt-1">
            <div
              className="inline-block transform hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgContent }}
              title="Click or use buttons below to export badge"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyToClipboard(markdownSnippet, 'markdown')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'markdown' ? 'Copied MD!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={() => copyToClipboard(htmlSnippet, 'html')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'html' ? 'Copied HTML!' : 'Copy HTML'}</span>
          </button>

          <button
            onClick={downloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download SVG</span>
          </button>

          <a
            href={shieldsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Shields.io URL</span>
          </a>
        </div>
      </div>
    </div>
  );
};
