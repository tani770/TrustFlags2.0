"""GitHub Integration Client for TrustFlags.

Uses PyGithub to inspect commits and PRs, retrieve changed files,
post automated Markdown verification comments, and set Commit Status checks.
"""

import os
import sys
from typing import List, Dict, Optional, Tuple, Any

try:
    from github import Github, GithubException
    from github.PullRequest import PullRequest
    from github.Repository import Repository
except ImportError:
    Github = None
    GithubException = Exception
    PullRequest = Any
    Repository = Any

from .models import TrustFlagsReport
from .reporter import ReportGenerator, BadgeGenerator


class GitHubIntegrationClient:
    """Handles GitHub API operations for TrustFlags."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN")
        if not self.token:
            print("Warning: GITHUB_TOKEN is not set. GitHub API operations will run in unauthenticated/read-only mode.")
        if Github is not None:
            self.gh = Github(self.token) if self.token else Github()
        else:
            self.gh = None

    def get_pr_files(self, repo_name: str, pr_number: int) -> Tuple[List[Dict[str, Any]], str, str]:
        """Fetch modified/added Python files from a Pull Request.

        Returns:
            Tuple of (list_of_file_dicts, head_sha, committer_login)
        """
        if not self.gh:
            raise RuntimeError("PyGithub is required for GitHub operations. Install with 'pip install PyGithub'.")

        repo: Repository = self.gh.get_repo(repo_name)
        pull: PullRequest = repo.get_pull(pr_number)
        head_sha = pull.head.sha
        committer = pull.user.login if pull.user else "contributor"

        py_files: List[Dict[str, Any]] = []
        for file in pull.get_files():
            # Only analyze python files that were not deleted
            if file.filename.endswith(".py") and file.status != "removed":
                try:
                    content_file = repo.get_contents(file.filename, ref=head_sha)
                    if hasattr(content_file, "decoded_content"):
                        decoded_str = content_file.decoded_content.decode("utf-8", errors="replace")
                        py_files.append({
                            "filename": file.filename,
                            "content": decoded_str,
                            "patch": file.patch or "",
                            "status": file.status,
                            "additions": file.additions,
                            "changes": file.changes,
                        })
                except Exception as e:
                    print(f"Warning: Could not fetch content for {file.filename}: {e}")

        return py_files, head_sha, committer

    def post_or_update_pr_comment(self, repo_name: str, pr_number: int, comment_body: str) -> None:
        """Post a new comment or update existing TrustFlags comment to prevent spam."""
        if not self.gh:
            raise RuntimeError("PyGithub is required for posting comments.")

        repo: Repository = self.gh.get_repo(repo_name)
        pull: PullRequest = repo.get_pull(pr_number)

        identifier = "## 🟢 TrustFlags Verification Report"
        alt_identifier = "## 🔴 TrustFlags Verification Report"

        # Check existing comments to update idempotently
        try:
            for comment in pull.get_issue_comments():
                if identifier in comment.body or alt_identifier in comment.body or "TrustFlags Verification Report" in comment.body:
                    comment.edit(comment_body)
                    print(f"Updated existing TrustFlags PR comment on #{pr_number}.")
                    return
        except Exception as e:
            print(f"Notice: Failed to query existing comments ({e}), creating a new one.")

        # If not found, create new comment
        pull.create_issue_comment(comment_body)
        print(f"Posted new TrustFlags PR comment on #{pr_number}.")

    def set_commit_status(
        self,
        repo_name: str,
        commit_sha: str,
        report: TrustFlagsReport,
        target_url: Optional[str] = None
    ) -> None:
        """Update GitHub Commit Status check to pass or block merging."""
        if not self.gh:
            raise RuntimeError("PyGithub is required for updating commit status.")

        repo: Repository = self.gh.get_repo(repo_name)
        commit = repo.get_commit(commit_sha)

        state = "success" if report.passed else "failure"
        if report.passed:
            description = f"TrustFlags: Passed with 100% accuracy ({report.total_loc} LOC)."
        else:
            description = f"TrustFlags: Blocked! {report.total_errors} errors/vulnerabilities ({report.accuracy_score:g}%)."

        # Truncate description to 140 chars per GitHub API spec
        description = description[:140]

        context = "TrustFlags / Verification Gate"

        commit.create_status(
            state=state,
            target_url=target_url or BadgeGenerator.get_shields_url(report),
            description=description,
            context=context,
        )
        print(f"Set commit status on {commit_sha[:7]} -> {state.upper()} ({description})")
