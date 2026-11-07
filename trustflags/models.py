"""Data models for TrustFlags code analysis, metrics, and reporting."""

from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    from pydantic import BaseModel, Field
except ImportError:
    # Graceful fallback if pydantic is not installed in bare test runner
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any):
            for k, v in data.items():
                setattr(self, k, v)

        def dict(self) -> Dict[str, Any]:
            return self.__dict__

        def model_dump(self) -> Dict[str, Any]:
            return self.dict()

    def Field(default=None, **kwargs):  # type: ignore
        return default


class IssueSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    WARNING = "warning"
    INFO = "info"


class IssueCategory(str, Enum):
    SYNTAX = "syntax"
    LINT = "lint"
    SECURITY = "security"


class CodeIssue(BaseModel):
    """Detailed finding from AST, linter, or security analyzer."""
    file_path: str
    line_number: int
    column: int = 1
    rule_id: str
    message: str
    category: IssueCategory
    severity: IssueSeverity
    code_snippet: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column": self.column,
            "rule_id": self.rule_id,
            "message": self.message,
            "category": self.category.value if hasattr(self.category, "value") else str(self.category),
            "severity": self.severity.value if hasattr(self.severity, "value") else str(self.severity),
            "code_snippet": self.code_snippet,
        }


class LocMetrics(BaseModel):
    """Radon-style Lines of Code breakdown."""
    total_loc: int = 0
    code_lines: int = 0
    blank_lines: int = 0
    comment_lines: int = 0
    net_lines_added: int = 0
    net_lines_modified: int = 0


class TrustFlagsReport(BaseModel):
    """Aggregated TrustFlags verification report."""
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
    loc_breakdown: LocMetrics = LocMetrics()
    timestamp: str = ""

    def summary_dict(self) -> Dict[str, Any]:
        return {
            "committer": self.committer,
            "total_loc": self.total_loc,
            "syntax_errors": self.syntax_errors,
            "lint_errors": self.lint_errors,
            "security_issues": self.security_issues,
            "total_errors": self.total_errors,
            "accuracy_score": self.accuracy_score,
            "badge_status": self.badge_status,
            "passed": self.passed,
        }
