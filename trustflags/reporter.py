"""Badge and Report Generator for TrustFlags.

Renders Shields.io URLs, local SVG vector badges, and production-grade
Markdown summaries for GitHub PR comments and CI/CD artifacts.
"""

import json
from typing import Dict, Any
from urllib.parse import quote
from .models import TrustFlagsReport, IssueCategory


class BadgeGenerator:
    """Dynamic badge generator supporting Shields.io URLs and standalone SVG vectors."""

    @staticmethod
    def get_shields_url(report: TrustFlagsReport, style: str = "for-the-badge") -> str:
        """Generate a Shields.io dynamic badge URL based on TrustFlags report metrics."""
        if report.passed:
            subject = "TrustFlags"
            status = f"TRUSTED ({report.accuracy_score:g}%)"
            color = "brightgreen"
        else:
            subject = "TrustFlags"
            status = f"FLAGGED ({report.total_errors} Errors)"
            color = "red"

        encoded_subject = quote(subject, safe="")
        encoded_status = quote(status, safe="")
        return f"https://img.shields.io/badge/{encoded_subject}-{encoded_status}-{color}?style={style}&logo=githubactions&logoColor=white"

    @staticmethod
    def generate_svg(report: TrustFlagsReport) -> str:
        """Render a standalone crisp SVG badge with TrustFlags shield icon and stats."""
        status_text = "TRUSTED 100%" if report.passed else f"FLAGGED {report.total_errors} ISSUES"
        bg_left = "#1e293b"
        bg_right = "#10b981" if report.passed else "#ef4444"
        border_color = "#34d399" if report.passed else "#f87171"
        score_text = f"{report.accuracy_score:g}% ACCURACY"

        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="240" height="36" viewBox="0 0 240 36" fill="none" role="img" aria-label="TrustFlags: {status_text}">
  <defs>
    <linearGradient id="grad-tf" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{bg_left}" />
      <stop offset="45%" stop-color="{bg_left}" />
      <stop offset="45.1%" stop-color="{bg_right}" />
      <stop offset="100%" stop-color="{bg_right}" />
    </linearGradient>
    <filter id="shadow-tf" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="240" height="36" rx="6" fill="url(#grad-tf)" stroke="{border_color}" stroke-width="1" filter="url(#shadow-tf)" />
  
  <!-- TrustFlags Shield Icon -->
  <g transform="translate(10, 8)" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 2L3 5v6c0 5 3.5 9.5 7 10 3.5-.5 7-5 7-10V5l-7-3z"/>
    {"<path d='M7 11l2 2 4-4' stroke='#34d399' stroke-width='2'/>" if report.passed else "<path d='M7 8l6 6M13 8l-6 6' stroke='#f87171' stroke-width='2'/>"}
  </g>
  
  <!-- Left Label -->
  <text x="36" y="22" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.5">TRUSTFLAGS</text>
  
  <!-- Right Status -->
  <text x="175" y="17" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10.5" font-weight="800" text-anchor="middle" letter-spacing="0.4">{status_text}</text>
  <text x="175" y="29" fill="#f1f5f9" opacity="0.9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="8.5" font-weight="600" text-anchor="middle">{score_text}</text>
</svg>"""
        return svg


class ReportGenerator:
    """Formats markdown reports, GitHub PR comments, and JSON summaries."""

    @staticmethod
    def format_pr_comment(report: TrustFlagsReport) -> str:
        """Create the formatted Markdown comment for GitHub Pull Requests."""
        badge_url = BadgeGenerator.get_shields_url(report)
        status_icon = "🟢" if report.passed else "🔴"
        status_headline = (
            "**PASS: 100% ACCURATE / TRUSTED**"
            if report.passed
            else f"**FAIL: {report.total_errors} ISSUES DETECTED / FLAGGED**"
        )
        gate_verdict = (
            "✅ **MERGE ALLOWED** - All checks passed with zero errors."
            if report.passed
            else "❌ **MERGE BLOCKED** - Contributor must resolve all security issues and lint errors to achieve 100% accuracy."
        )

        md_parts = [
            f"## {status_icon} TrustFlags Verification Report",
            f"",
            f"[![TrustFlags Status]({badge_url})]({badge_url})",
            f"",
            f"**Committer:** `@{report.committer}` | **Status:** {status_headline}",
            f"",
            f"### 📊 Code Quality & Security Metrics",
            f"",
            f"| Metric | Value | Threshold / Standard |",
            f"| :--- | :--- | :--- |",
            f"| **Accuracy Score** | **{report.accuracy_score:g}%** | **100.0% Required** |",
            f"| **Total Lines of Code (LOC)** | `{report.total_loc}` lines | Radon Metrics |",
            f"| ↳ Source Code Lines | `{report.loc_breakdown.code_lines}` lines | Executable logic |",
            f"| ↳ Blank Lines | `{report.loc_breakdown.blank_lines}` lines | Formatting |",
            f"| ↳ Comments / Docstrings | `{report.loc_breakdown.comment_lines}` lines | Documentation |",
            f"| **Syntax Errors (AST)** | `{report.syntax_errors}` | 0 allowed |",
            f"| **Lint Issues (Ruff / Flake8)** | `{report.lint_errors}` | 0 allowed |",
            f"| **Security Issues (Bandit)** | `{report.security_issues}` | 0 allowed |",
            f"| **Unit Test Failures** | `{report.test_failures}` | 0 allowed |",
            f"| **Total Errors** | **`{report.total_errors}`** | **0 required for Green Badge** |",
            f"| **Merge Gate Verdict** | {gate_verdict} | Enforced by Branch Protection |",
            f"",
        ]

        if report.issues:
            md_parts.extend([
                f"<details>",
                f"<summary><b>🔍 View Detailed Breakdown of Issues ({len(report.issues)})</b></summary>",
                f"",
                f"| File & Line | Category | Rule | Severity | Message |",
                f"| :--- | :--- | :--- | :--- | :--- |",
            ])
            for issue in report.issues:
                cat_badge = {
                    IssueCategory.SECURITY: "🛡️ Security",
                    IssueCategory.SYNTAX: "💥 Syntax",
                    IssueCategory.LINT: "🧹 Lint",
                    IssueCategory.TEST: "🧪 Test Failure",
                }.get(issue.category, str(issue.category))
                sev_icon = "🔴" if issue.severity.value in ["critical", "high"] else "🟡"
                snippet_text = f"<br>`{issue.code_snippet}`" if issue.code_snippet else ""
                md_parts.append(
                    f"| `{issue.file_path}:{issue.line_number}:{issue.column}` | {cat_badge} | `{issue.rule_id}` | {sev_icon} {issue.severity.value.upper()} | {issue.message}{snippet_text} |"
                )
            md_parts.extend([
                f"",
                f"</details>",
                f"",
            ])
        else:
            md_parts.extend([
                f"> 🎉 **Flawless Pull Request!** No syntax errors, code smells, or security vulnerabilities were identified.",
                f"",
            ])

        md_parts.extend([
            f"---",
            f"*Generated automatically by [TrustFlags](https://github.com/marketplace/actions/trustflags-verifier) • Automated Code Quality & Security Verification*",
        ])

        return "\n".join(md_parts)

    @staticmethod
    def emit_github_workflow_commands(report: TrustFlagsReport) -> None:
        """Emit GitHub Actions workflow commands (::error / ::warning) for inline PR annotations."""
        for issue in report.issues:
            level = "error" if issue.severity.value in ["critical", "high"] else "warning"
            file_path = issue.file_path
            line = issue.line_number
            col = issue.column
            title = f"TrustFlags [{issue.rule_id} - {issue.category.value.upper()}]"
            # Sanitize message for workflow command
            msg = issue.message.replace("\r", "").replace("\n", " ")
            print(f"::{level} file={file_path},line={line},col={col},title={title}::{msg}")

    @staticmethod
    def write_github_step_summary(report: TrustFlagsReport) -> None:
        """Write the TrustFlags markdown report to GITHUB_STEP_SUMMARY for native GitHub Actions UI embedding."""
        import os
        summary_file = os.getenv("GITHUB_STEP_SUMMARY")
        if summary_file:
            try:
                markdown = ReportGenerator.format_pr_comment(report)
                with open(summary_file, "a", encoding="utf-8") as f:
                    f.write(markdown)
                    f.write("\n")
                print("Appended TrustFlags report to GitHub Step Summary.")
            except Exception as e:
                print(f"Notice: Failed to write to GITHUB_STEP_SUMMARY: {e}")

    @staticmethod
    def write_github_output(report: TrustFlagsReport) -> None:
        """Write key metrics to GITHUB_OUTPUT for subsequent GitHub Action steps."""
        import os
        output_file = os.getenv("GITHUB_OUTPUT")
        if output_file:
            try:
                with open(output_file, "a", encoding="utf-8") as f:
                    f.write(f"passed={'true' if report.passed else 'false'}\n")
                    f.write(f"accuracy_score={report.accuracy_score:g}\n")
                    f.write(f"total_errors={report.total_errors}\n")
                    f.write(f"badge_url={report.badge_url}\n")
            except Exception as e:
                print(f"Notice: Failed to write to GITHUB_OUTPUT: {e}")

    @staticmethod
    def to_json(report: TrustFlagsReport, indent: int = 2) -> str:
        """Export full report to structured JSON."""
        return json.dumps(report.dict() if hasattr(report, "dict") else report.model_dump(), indent=indent)

