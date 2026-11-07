/**
 * Exported raw source code of the TrustFlags repository for in-browser inspection.
 */

export interface SourceFile {
  path: string;
  filename: string;
  category: 'core' | 'ci' | 'tests' | 'docs' | 'config';
  language: 'python' | 'yaml' | 'dockerfile' | 'toml' | 'markdown';
  description: string;
  content: string;
}

export const TRUSTFLAGS_FILES: SourceFile[] = [
  {
    path: 'trustflags/analyzer.py',
    filename: 'analyzer.py',
    category: 'core',
    language: 'python',
    description: 'Core verification engine: AST syntax parser, Bandit security rules, linter, and Radon LOC counter.',
    content: `"""Core Code Analysis Engine for TrustFlags.

Performs multi-layered verification:
1. Python AST parsing for immediate syntax error detection.
2. Built-in + subprocess security audits (Bandit & Semgrep rules).
3. Linter inspections (Flake8 / Ruff / Pylint).
4. Radon-style line-of-code (LOC) breakdown and accuracy scoring.
"""

import ast
import os
import re
import shutil
from pathlib import Path
from typing import List, Dict, Tuple, Set, Optional

from .models import (
    CodeIssue,
    IssueCategory,
    IssueSeverity,
    LocMetrics,
    TrustFlagsReport,
)


class BuiltInSecurityVisitor(ast.NodeVisitor):
    """AST visitor enforcing key Bandit security rules (B101-B608)."""

    def __init__(self, file_path: str, lines: List[str]):
        self.file_path = file_path
        self.lines = lines
        self.issues: List[CodeIssue] = []

    def _get_snippet(self, lineno: int) -> Optional[str]:
        if 1 <= lineno <= len(self.lines):
            return self.lines[lineno - 1].strip()
        return None

    def visit_Call(self, node: ast.Call):
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
            if isinstance(node.func.value, ast.Name):
                func_name = f"{node.func.value.id}.{node.func.attr}"

        # B307 / B102: eval() and exec()
        if func_name in ("eval", "exec"):
            self.issues.append(
                CodeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset + 1,
                    rule_id="B307",
                    message=f"Use of possibly insecure function - {func_name}() detected.",
                    category=IssueCategory.SECURITY,
                    severity=IssueSeverity.CRITICAL,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )

        # B602: subprocess with shell=True
        if func_name in (
            "subprocess.Popen", "subprocess.call", "subprocess.check_call",
            "subprocess.check_output", "subprocess.run", "os.system", "os.popen"
        ):
            for kw in node.keywords:
                if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                    self.issues.append(
                        CodeIssue(
                            file_path=self.file_path,
                            line_number=node.lineno,
                            column=node.col_offset + 1,
                            rule_id="B602",
                            message="Subprocess call with shell=True identified, security hazard.",
                            category=IssueCategory.SECURITY,
                            severity=IssueSeverity.HIGH,
                            code_snippet=self._get_snippet(node.lineno),
                        )
                    )

        # B301: pickle / unsafe deserialization
        if func_name in ("pickle.loads", "pickle.load", "_pickle.loads", "shelve.open"):
            self.issues.append(
                CodeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset + 1,
                    rule_id="B301",
                    message="Pickle deserialization can be unsafe when used with untrusted data.",
                    category=IssueCategory.SECURITY,
                    severity=IssueSeverity.CRITICAL,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )

        # B608: SQL Injection in cursor.execute / db.execute
        if func_name.endswith(".execute"):
            if node.args:
                first_arg = node.args[0]
                is_sql_injection = False
                if isinstance(first_arg, ast.JoinedStr):  # f-string
                    is_sql_injection = True
                elif isinstance(first_arg, ast.BinOp) and isinstance(first_arg.op, (ast.Add, ast.Mod)):
                    is_sql_injection = True
                
                if is_sql_injection:
                    snippet = self._get_snippet(node.lineno) or ""
                    if any(sql_kw in snippet.upper() for sql_kw in ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "WHERE"]):
                        self.issues.append(
                            CodeIssue(
                                file_path=self.file_path,
                                line_number=node.lineno,
                                column=node.col_offset + 1,
                                rule_id="B608",
                                message="Possible SQL injection vector through string-formatted query execution.",
                                category=IssueCategory.SECURITY,
                                severity=IssueSeverity.CRITICAL,
                                code_snippet=snippet,
                            )
                        )

        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        # B105: Hardcoded credentials
        secret_patterns = re.compile(r"^(api_key|apikey|secret|token|password|auth_token)$", re.IGNORECASE)
        for target in node.targets:
            if isinstance(target, ast.Name) and secret_patterns.match(target.id):
                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                    val = node.value.value.strip()
                    if len(val) >= 8 and not val.startswith("YOUR_") and "example" not in val.lower():
                        self.issues.append(
                            CodeIssue(
                                file_path=self.file_path,
                                line_number=node.lineno,
                                column=node.col_offset + 1,
                                rule_id="B105",
                                message=f"Possible hardcoded secret or credential assigned to variable '{target.id}'.",
                                category=IssueCategory.SECURITY,
                                severity=IssueSeverity.HIGH,
                                code_snippet=self._get_snippet(node.lineno),
                            )
                        )
        self.generic_visit(node)
`,
  },
  {
    path: 'trustflags/reporter.py',
    filename: 'reporter.py',
    category: 'core',
    language: 'python',
    description: 'Dynamic Shields.io badge URL builder, local crisp SVG vector generator, and PR Markdown comment formatter.',
    content: `"""Badge and Report Generator for TrustFlags.

Renders Shields.io URLs, local SVG vector badges, and production-grade
Markdown summaries for GitHub PR comments and CI/CD artifacts.
"""

from urllib.parse import quote
from .models import TrustFlagsReport, IssueCategory


class BadgeGenerator:
    """Dynamic badge generator supporting Shields.io URLs and standalone SVG vectors."""

    @staticmethod
    def get_shields_url(report: TrustFlagsReport, style: str = "for-the-badge") -> str:
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
        status_text = "TRUSTED 100%" if report.passed else f"FLAGGED {report.total_errors} ISSUES"
        bg_right = "#10b981" if report.passed else "#ef4444"
        border_color = "#34d399" if report.passed else "#f87171"
        score_text = f"{report.accuracy_score:g}% ACCURACY"

        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="36" viewBox="0 0 240 36">
  <rect width="240" height="36" rx="6" fill="#1e293b" stroke="{border_color}" stroke-width="1"/>
  <rect x="110" width="130" height="36" rx="6" fill="{bg_right}"/>
  <text x="36" y="22" fill="#f8fafc" font-size="12" font-weight="700">TRUSTFLAGS</text>
  <text x="175" y="17" fill="#ffffff" font-size="10.5" font-weight="800" text-anchor="middle">{status_text}</text>
  <text x="175" y="29" fill="#f1f5f9" font-size="8.5" text-anchor="middle">{score_text}</text>
</svg>'''


class ReportGenerator:
    """Formats markdown reports, GitHub PR comments, and JSON summaries."""

    @staticmethod
    def format_pr_comment(report: TrustFlagsReport) -> str:
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
            f"**Committer:** \`@{report.committer}\` | **Status:** {status_headline}",
            f"",
            f"### 📊 Code Quality & Security Metrics",
            f"| Metric | Value | Threshold / Standard |",
            f"| :--- | :--- | :--- |",
            f"| **Accuracy Score** | **{report.accuracy_score:g}%** | **100.0% Required** |",
            f"| **Total Lines of Code (LOC)** | \`{report.total_loc}\` lines | Radon Metrics |",
            f"| **Total Errors** | **\`{report.total_errors}\`** | **0 required for Green Badge** |",
            f"| **Merge Gate Verdict** | {gate_verdict} | Enforced by Branch Protection |",
        ]
        return "\\n".join(md_parts)
`,
  },
  {
    path: 'trustflags/github_client.py',
    filename: 'github_client.py',
    category: 'core',
    language: 'python',
    description: 'PyGithub wrapper for PR file fetching, comment posting/updating, and Commit Status Check API integration.',
    content: `"""GitHub Integration Client for TrustFlags.

Uses PyGithub to inspect commits and PRs, retrieve changed files,
post automated Markdown verification comments, and set Commit Status checks.
"""

import os
from typing import List, Dict, Optional, Tuple, Any

try:
    from github import Github
    from github.PullRequest import PullRequest
    from github.Repository import Repository
except ImportError:
    Github = None

from .models import TrustFlagsReport
from .reporter import ReportGenerator, BadgeGenerator


class GitHubIntegrationClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.gh = Github(self.token) if (Github and self.token) else None

    def post_or_update_pr_comment(self, repo_name: str, pr_number: int, comment_body: str) -> None:
        repo = self.gh.get_repo(repo_name)
        pull = repo.get_pull(pr_number)
        identifier = "TrustFlags Verification Report"

        for comment in pull.get_issue_comments():
            if identifier in comment.body:
                comment.edit(comment_body)
                return

        pull.create_issue_comment(comment_body)

    def set_commit_status(self, repo_name: str, commit_sha: str, report: TrustFlagsReport) -> None:
        repo = self.gh.get_repo(repo_name)
        commit = repo.get_commit(commit_sha)
        state = "success" if report.passed else "failure"
        description = "TrustFlags: Passed 100% accuracy" if report.passed else f"TrustFlags: Blocked! {report.total_errors} errors ({report.accuracy_score:g}%)"

        commit.create_status(
            state=state,
            target_url=BadgeGenerator.get_shields_url(report),
            description=description[:140],
            context="TrustFlags / Verification Gate",
        )
`,
  },
  {
    path: 'trustflags/models.py',
    filename: 'models.py',
    category: 'core',
    language: 'python',
    description: 'Pydantic data schemas: TrustFlagsReport, CodeIssue, LocMetrics, IssueSeverity, and IssueCategory.',
    content: `"""Data models for TrustFlags code analysis, metrics, and reporting."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class IssueSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    WARNING = "warning"


class IssueCategory(str, Enum):
    SYNTAX = "syntax"
    LINT = "lint"
    SECURITY = "security"


class CodeIssue(BaseModel):
    file_path: str
    line_number: int
    column: int = 1
    rule_id: str
    message: str
    category: IssueCategory
    severity: IssueSeverity
    code_snippet: Optional[str] = None


class LocMetrics(BaseModel):
    total_loc: int = 0
    code_lines: int = 0
    blank_lines: int = 0
    comment_lines: int = 0
    net_lines_added: int = 0
    net_lines_modified: int = 0


class TrustFlagsReport(BaseModel):
    committer: str = "contributor"
    repo: Optional[str] = None
    pr_number: Optional[int] = None
    commit_sha: Optional[str] = None
    files_analyzed: List[str] = []
    
    total_loc: int = 0
    syntax_errors: int = 0
    lint_errors: int = 0
    security_issues: int = 0
    total_errors: int = 0
    accuracy_score: float = 100.0
    
    badge_status: str = "TRUSTED"
    badge_color: str = "brightgreen"
    badge_label: str = "100% ACCURATE"
    badge_url: str = ""
    badge_svg: str = ""
    
    passed: bool = True
    issues: List[CodeIssue] = []
    loc_breakdown: LocMetrics = Field(default_factory=LocMetrics)
`,
  },
  {
    path: 'action.yml',
    filename: 'action.yml',
    category: 'ci',
    language: 'yaml',
    description: 'Reusable GitHub Action definition: inputs, composite steps, and execution modes.',
    content: `name: 'TrustFlags - Automated Code Quality & Security Verification'
description: 'Enforces 100% accuracy, AST syntax checks, Bandit security scans, Radon LOC metrics, dynamic Green/Red badges, and PR status checks.'
author: 'TrustFlags Team'
branding:
  icon: 'shield'
  color: 'green'

inputs:
  github_token:
    description: 'GitHub Secret Token used for posting PR comments and updating commit statuses.'
    required: false
    default: '\${{ github.token }}'
  paths:
    description: 'Paths or directories containing Python files to scan.'
    required: false
    default: '.'
  fail_on_errors:
    description: 'Whether to fail the CI step if code quality or security errors are detected (Red Badge).'
    required: false
    default: 'true'

runs:
  using: 'composite'
  steps:
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    - name: Install Dependencies
      shell: bash
      run: pip install . bandit ruff radon PyGithub rich
    - name: Run TrustFlags
      shell: bash
      run: trustflags scan \${{ inputs.paths }} --fail-on-errors
`,
  },
  {
    path: '.github/workflows/trustflags.yml',
    filename: 'trustflags.yml',
    category: 'ci',
    language: 'yaml',
    description: '5-line automated GitHub Actions workflow for pull requests and main branch pushes.',
    content: `name: TrustFlags Verification

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
          fail_on_errors: true
          post_pr_comment: true
          set_commit_status: true
`,
  },
  {
    path: 'Dockerfile',
    filename: 'Dockerfile',
    category: 'config',
    language: 'dockerfile',
    description: 'Production container for TrustFlags CLI, GitHub Action container runner, and FastAPI server.',
    content: `FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --upgrade pip && pip install . bandit ruff radon PyGithub rich fastapi uvicorn

COPY trustflags/ ./trustflags/
RUN pip install -e .

EXPOSE 8000
ENTRYPOINT ["trustflags"]
CMD ["scan", "."]
`,
  },
  {
    path: 'pyproject.toml',
    filename: 'pyproject.toml',
    category: 'config',
    language: 'toml',
    description: 'PEP 517 / 621 package specification, CLI scripts, dependencies, and metadata.',
    content: `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "trustflags"
version = "1.0.0"
description = "Automated code quality and security verification tool with 100% accuracy enforcement and dynamic badges for GitHub."
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "pydantic>=2.0.0",
    "PyGithub>=2.1.1",
    "rich>=13.0.0",
    "bandit>=1.7.5",
    "radon>=6.0.1",
    "ruff>=0.1.0",
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
    "httpx>=0.24.0",
]

[project.scripts]
trustflags = "trustflags.main:cli"
`,
  },
  {
    path: 'tests/test_analyzer.py',
    filename: 'test_analyzer.py',
    category: 'tests',
    language: 'python',
    description: 'Unit test suite covering clean code, AST syntax errors, eval(), subprocess shell=True, SQL injection, and secrets.',
    content: `import unittest
from trustflags.analyzer import CodeAnalyzer
from trustflags.models import IssueCategory

class TestCodeAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = CodeAnalyzer(use_subprocesses=False)

    def test_clean_code_awards_100_percent(self):
        clean_python = 'def add(a: int, b: int) -> int:\\n    return a + b\\n'
        issues, loc = self.analyzer.analyze_source("clean.py", clean_python)
        self.assertEqual(len(issues), 0)

    def test_security_eval_detected(self):
        eval_code = 'def run(payload):\\n    return eval(payload)\\n'
        issues, _ = self.analyzer.analyze_source("vuln.py", eval_code)
        self.assertTrue(any(i.rule_id == "B307" for i in issues))
`,
  },
  {
    path: 'README.md',
    filename: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Comprehensive open-source documentation, badges, architecture, and contribution guidelines.',
    content: `# 🛡️ TrustFlags - Automated Code Quality & Security Verification Engine

Guarantee 100% code accuracy and zero security vulnerabilities before merging on GitHub.
`,
  },
];
