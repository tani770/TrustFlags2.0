"""TrustFlags - Automated Code Quality & Security Verification Engine.

A DevSecOps tool that automatically evaluates commits and PRs on GitHub,
enforces 100% accuracy rules, runs AST/ruff/bandit scans, calculates Radon LOC metrics,
and awards dynamic Green or Red TrustFlags badges.
"""

__version__ = "1.0.0"
__author__ = "TrustFlags Open Source Community"

from .models import (
    CodeIssue,
    IssueCategory,
    IssueSeverity,
    LocMetrics,
    TrustFlagsReport,
)
from .analyzer import CodeAnalyzer
from .reporter import BadgeGenerator, ReportGenerator
from .github_client import GitHubIntegrationClient

__all__ = [
    "CodeAnalyzer",
    "BadgeGenerator",
    "ReportGenerator",
    "GitHubIntegrationClient",
    "TrustFlagsReport",
    "CodeIssue",
    "LocMetrics",
    "IssueCategory",
    "IssueSeverity",
]
