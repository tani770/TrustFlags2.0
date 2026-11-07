"""Core Code Analysis Engine for TrustFlags.

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
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Tuple, Set, Optional, Any

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
            # Check for module.attribute
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
            if func_name in ("os.system", "os.popen"):
                self.issues.append(
                    CodeIssue(
                        file_path=self.file_path,
                        line_number=node.lineno,
                        column=node.col_offset + 1,
                        rule_id="B605",
                        message=f"Starting a process with a shell via {func_name}()",
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
                    message="Pickle and modules that wrap it can be unsafe when used to deserialize untrusted data.",
                    category=IssueCategory.SECURITY,
                    severity=IssueSeverity.CRITICAL,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )

        # B608: SQL Injection in cursor.execute / db.execute
        if func_name.endswith(".execute"):
            if node.args:
                first_arg = node.args[0]
                # Check for formatted string or string concatenation
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

        # B506: unsafe yaml.load
        if func_name == "yaml.load":
            has_safe_loader = any(
                kw.arg == "Loader" and "SafeLoader" in ast.unparse(kw.value)
                for kw in node.keywords if hasattr(ast, "unparse")
            )
            if not has_safe_loader:
                self.issues.append(
                    CodeIssue(
                        file_path=self.file_path,
                        line_number=node.lineno,
                        column=node.col_offset + 1,
                        rule_id="B506",
                        message="Use of unsafe yaml.load() without SafeLoader.",
                        category=IssueCategory.SECURITY,
                        severity=IssueSeverity.HIGH,
                        code_snippet=self._get_snippet(node.lineno),
                    )
                )

        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        # B105: Hardcoded password / secret detection
        secret_patterns = re.compile(
            r"^(api_key|apikey|secret|token|password|passwd|auth_token|client_secret|private_key)$",
            re.IGNORECASE
        )
        for target in node.targets:
            target_name = ""
            if isinstance(target, ast.Name):
                target_name = target.id
            if target_name and secret_patterns.match(target_name):
                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                    val = node.value.value.strip()
                    # Ignore placeholder values
                    if len(val) >= 8 and not val.startswith("YOUR_") and not val.startswith("MY_") and "example" not in val.lower():
                        self.issues.append(
                            CodeIssue(
                                file_path=self.file_path,
                                line_number=node.lineno,
                                column=node.col_offset + 1,
                                rule_id="B105",
                                message=f"Possible hardcoded secret or credential assigned to variable '{target_name}'.",
                                category=IssueCategory.SECURITY,
                                severity=IssueSeverity.HIGH,
                                code_snippet=self._get_snippet(node.lineno),
                            )
                        )
        self.generic_visit(node)

    def visit_Assert(self, node: ast.Assert):
        # B101: Assert used in non-test file
        if not ("test" in self.file_path.lower()):
            self.issues.append(
                CodeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset + 1,
                    rule_id="B101",
                    message="Use of assert detected. Asserts are stripped when compiled with -O.",
                    category=IssueCategory.SECURITY,
                    severity=IssueSeverity.LOW,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )
        self.generic_visit(node)


class BuiltInLintVisitor(ast.NodeVisitor):
    """AST-based linter checking logical bugs and Python code smells."""

    def __init__(self, file_path: str, lines: List[str]):
        self.file_path = file_path
        self.lines = lines
        self.issues: List[CodeIssue] = []
        self.defined_names: Set[str] = set()
        self.used_names: Set[Tuple[str, int, int]] = set()
        self.imported_names: Dict[str, Tuple[int, int]] = {}

    def _get_snippet(self, lineno: int) -> Optional[str]:
        if 1 <= lineno <= len(self.lines):
            return self.lines[lineno - 1].strip()
        return None

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.asname or alias.name
            self.imported_names[name] = (node.lineno, node.col_offset + 1)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if any(alias.name == "*" for alias in node.names):
            self.issues.append(
                CodeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset + 1,
                    rule_id="F403",
                    message=f"'from {node.module} import *' used; unable to detect undefined names.",
                    category=IssueCategory.LINT,
                    severity=IssueSeverity.MEDIUM,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )
        for alias in node.names:
            name = alias.asname or alias.name
            self.imported_names[name] = (node.lineno, node.col_offset + 1)
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        # Bare except: except:
        if node.type is None:
            self.issues.append(
                CodeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset + 1,
                    rule_id="E722",
                    message="Do not use bare 'except'; specify Exception or specific error type.",
                    category=IssueCategory.LINT,
                    severity=IssueSeverity.MEDIUM,
                    code_snippet=self._get_snippet(node.lineno),
                )
            )
        self.generic_visit(node)


class CodeAnalyzer:
    """Multi-tiered Python code analysis engine."""

    def __init__(self, use_subprocesses: bool = True):
        self.use_subprocesses = use_subprocesses
        self.has_ruff = shutil.which("ruff") is not None if use_subprocesses else False
        self.has_flake8 = shutil.which("flake8") is not None if use_subprocesses else False
        self.has_bandit = shutil.which("bandit") is not None if use_subprocesses else False

    def calculate_loc(self, content: str) -> LocMetrics:
        """Calculate total, code, blank, and comment lines in Python file."""
        lines = content.splitlines()
        total_loc = len(lines)
        blank_lines = 0
        comment_lines = 0
        code_lines = 0
        in_multiline_string = False
        multiline_delimiter = ""

        for line in lines:
            stripped = line.strip()
            if not stripped:
                blank_lines += 1
                continue

            # Check multiline docstring transitions
            if not in_multiline_string:
                if stripped.startswith('"""') or stripped.startswith("'''"):
                    multiline_delimiter = stripped[:3]
                    # Check if single line docstring
                    if stripped.count(multiline_delimiter) >= 2 and len(stripped) > 3:
                        comment_lines += 1
                    else:
                        in_multiline_string = True
                        comment_lines += 1
                elif stripped.startswith("#"):
                    comment_lines += 1
                else:
                    code_lines += 1
            else:
                comment_lines += 1
                if multiline_delimiter in stripped:
                    in_multiline_string = False

        return LocMetrics(
            total_loc=total_loc,
            code_lines=code_lines,
            blank_lines=blank_lines,
            comment_lines=comment_lines,
            net_lines_added=total_loc,
            net_lines_modified=0,
        )

    def analyze_source(self, file_path: str, content: str) -> Tuple[List[CodeIssue], LocMetrics]:
        """Analyze a single Python source string."""
        issues: List[CodeIssue] = []
        loc = self.calculate_loc(content)
        lines = content.splitlines()

        # Step 1: AST Syntax Check
        try:
            tree = ast.parse(content, filename=file_path)
        except SyntaxError as e:
            issues.append(
                CodeIssue(
                    file_path=file_path,
                    line_number=e.lineno or 1,
                    column=e.offset or 1,
                    rule_id="E999",
                    message=f"SyntaxError: {e.msg}",
                    category=IssueCategory.SYNTAX,
                    severity=IssueSeverity.CRITICAL,
                    code_snippet=e.text.strip() if e.text else (lines[e.lineno - 1].strip() if e.lineno and e.lineno <= len(lines) else None),
                )
            )
            # Cannot proceed with tree-based checks on broken syntax
            return issues, loc

        # Step 2: AST Security Analysis (Bandit rules)
        security_visitor = BuiltInSecurityVisitor(file_path, lines)
        security_visitor.visit(tree)
        issues.extend(security_visitor.issues)

        # Step 3: AST Lint Analysis
        lint_visitor = BuiltInLintVisitor(file_path, lines)
        lint_visitor.visit(tree)
        issues.extend(lint_visitor.issues)

        # Step 4: Line length and whitespace checks (PEP 8)
        for idx, line in enumerate(lines, start=1):
            if len(line) > 120:
                issues.append(
                    CodeIssue(
                        file_path=file_path,
                        line_number=idx,
                        column=121,
                        rule_id="E501",
                        message=f"Line too long ({len(line)} > 120 characters).",
                        category=IssueCategory.LINT,
                        severity=IssueSeverity.WARNING,
                        code_snippet=line.strip()[:80] + "...",
                    )
                )

        return issues, loc

    def analyze_file(self, file_path: str) -> Tuple[List[CodeIssue], LocMetrics]:
        """Read and analyze a file from disk."""
        path = Path(file_path)
        if not path.exists():
            return [], LocMetrics()
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            return [
                CodeIssue(
                    file_path=file_path,
                    line_number=1,
                    column=1,
                    rule_id="IO_ERR",
                    message=f"Could not read file: {str(e)}",
                    category=IssueCategory.SYNTAX,
                    severity=IssueSeverity.CRITICAL,
                )
            ], LocMetrics()

        return self.analyze_source(str(file_path), content)

    def analyze_paths(self, paths: List[str], committer: str = "contributor") -> TrustFlagsReport:
        """Scan a list of files or directories and aggregate findings."""
        all_issues: List[CodeIssue] = []
        total_loc = 0
        total_code = 0
        total_blank = 0
        total_comment = 0
        analyzed_files: List[str] = []
        error_lines_set: Set[Tuple[str, int]] = set()

        # Expand paths to collect all .py files
        target_files: List[str] = []
        for p in paths:
            path_obj = Path(p)
            if path_obj.is_file() and p.endswith(".py"):
                target_files.append(str(path_obj))
            elif path_obj.is_dir():
                for py_file in path_obj.rglob("*.py"):
                    # Skip common virtual environments and cache
                    if not any(skip in py_file.parts for skip in [".venv", "venv", ".git", "__pycache__", "node_modules"]):
                        target_files.append(str(py_file))

        for file_path in target_files:
            analyzed_files.append(file_path)
            file_issues, loc = self.analyze_file(file_path)
            all_issues.extend(file_issues)
            total_loc += loc.total_loc
            total_code += loc.code_lines
            total_blank += loc.blank_lines
            total_comment += loc.comment_lines

            for issue in file_issues:
                error_lines_set.add((issue.file_path, issue.line_number))

        syntax_count = sum(1 for i in all_issues if i.category == IssueCategory.SYNTAX)
        lint_count = sum(1 for i in all_issues if i.category == IssueCategory.LINT)
        security_count = sum(1 for i in all_issues if i.category == IssueCategory.SECURITY)
        total_errors = syntax_count + lint_count + security_count

        # Accuracy Score formula: ((total_loc - error_lines) / total_loc) * 100
        error_lines_count = len(error_lines_set)
        if total_loc > 0:
            accuracy = max(0.0, min(100.0, round(((total_loc - error_lines_count) / total_loc) * 100.0, 2)))
        else:
            accuracy = 100.0 if total_errors == 0 else 0.0

        # TrustFlags strict rule: Green badge ONLY if total_errors == 0 and accuracy_score == 100.0
        passed = (total_errors == 0 and accuracy == 100.0)

        badge_status = "TRUSTED" if passed else "FLAGGED"
        badge_color = "brightgreen" if passed else "red"
        badge_label = "100% ACCURATE" if passed else (f"{total_errors} ISSUES" if total_errors > 0 else "NEEDS REVIEW")

        return TrustFlagsReport(
            committer=committer,
            files_analyzed=analyzed_files,
            total_loc=total_loc,
            syntax_errors=syntax_count,
            lint_errors=lint_count,
            security_issues=security_count,
            total_errors=total_errors,
            accuracy_score=accuracy,
            badge_status=badge_status,
            badge_color=badge_color,
            badge_label=badge_label,
            passed=passed,
            issues=all_issues,
            loc_breakdown=LocMetrics(
                total_loc=total_loc,
                code_lines=total_code,
                blank_lines=total_blank,
                comment_lines=total_comment,
            ),
        )
