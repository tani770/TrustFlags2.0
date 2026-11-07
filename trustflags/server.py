"""FastAPI Webhook Server for TrustFlags.

Receives GitHub push and pull_request webhook events, executes code quality and
security audits, updates PR comments and commit statuses asynchronously,
and serves dynamic SVG badges.
"""

import hmac
import hashlib
import os
import tempfile
from typing import Dict, Any, Optional
from pathlib import Path

try:
    from fastapi import FastAPI, Request, Header, HTTPException, BackgroundTasks, Response
    from fastapi.responses import HTMLResponse, JSONResponse
except ImportError:
    FastAPI = Any  # type: ignore

from .analyzer import CodeAnalyzer
from .reporter import BadgeGenerator, ReportGenerator
from .github_client import GitHubIntegrationClient
from .models import TrustFlagsReport

app = FastAPI(
    title="TrustFlags Webhook Server",
    description="Automated Code Quality and Security Verification Service",
    version="1.0.0",
)

WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")


def verify_signature(payload: bytes, signature_header: Optional[str]) -> bool:
    """Validate GitHub webhook HMAC SHA256 signature."""
    if not WEBHOOK_SECRET:
        return True  # If no secret configured, accept in development mode
    if not signature_header:
        return False
    sha_name, signature = signature_header.split("=")
    if sha_name != "sha256":
        return False
    mac = hmac.new(WEBHOOK_SECRET.encode(), msg=payload, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)


def process_pull_request_event(payload: Dict[str, Any]) -> None:
    """Background task to analyze modified files in a PR and post results."""
    action = payload.get("action")
    if action not in ["opened", "synchronize", "reopened"]:
        print(f"Skipping PR action: {action}")
        return

    pull_request = payload.get("pull_request", {})
    repo_data = payload.get("repository", {})
    repo_name = repo_data.get("full_name")
    pr_number = pull_request.get("number")
    committer = pull_request.get("user", {}).get("login", "contributor")
    head_sha = pull_request.get("head", {}).get("sha")

    if not repo_name or not pr_number:
        print("Missing repository full_name or PR number in webhook payload.")
        return

    print(f"Analyzing PR #{pr_number} in {repo_name} from @{committer}...")
    gh_client = GitHubIntegrationClient(token=GITHUB_TOKEN)
    analyzer = CodeAnalyzer()

    # Fetch changed files
    try:
        pr_files, _, _ = gh_client.get_pr_files(repo_name, pr_number)
    except Exception as e:
        print(f"Error fetching PR files: {e}")
        return

    # Write temporary files to disk for complete analysis
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_paths = []
        for f in pr_files:
            file_tmp = Path(tmpdir) / f["filename"]
            file_tmp.parent.mkdir(parents=True, exist_ok=True)
            file_tmp.write_text(f["content"], encoding="utf-8")
            tmp_paths.append(str(file_tmp))

        report: TrustFlagsReport = analyzer.analyze_paths(tmp_paths, committer=committer)
        # Rewrite file paths in issues to match repo paths
        for issue in report.issues:
            for f in pr_files:
                if f["filename"] in issue.file_path:
                    issue.file_path = f["filename"]
                    break

    report.repo = repo_name
    report.pr_number = pr_number
    report.commit_sha = head_sha

    # Generate Markdown comment and update PR
    markdown_body = ReportGenerator.format_pr_comment(report)
    try:
        gh_client.post_or_update_pr_comment(repo_name, pr_number, markdown_body)
    except Exception as e:
        print(f"Error updating PR comment: {e}")

    # Set commit status
    if head_sha:
        try:
            gh_client.set_commit_status(repo_name, head_sha, report)
        except Exception as e:
            print(f"Error setting commit status: {e}")


@app.get("/")
def root():
    return {
        "service": "TrustFlags Webhook Server",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "trustflags"}


@app.post("/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None),
):
    """GitHub webhook receiver endpoint."""
    body_bytes = await request.body()

    if not verify_signature(body_bytes, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid HMAC webhook signature")

    payload = await request.json()

    if x_github_event == "pull_request":
        background_tasks.add_task(process_pull_request_event, payload)
        return {"status": "enqueued", "event": "pull_request", "action": payload.get("action")}

    return {"status": "ignored", "event": x_github_event}


@app.get("/badge/{owner}/{repo}/status.svg")
def get_repo_badge(owner: str, repo: str, accuracy: float = 100.0, errors: int = 0):
    """Dynamic standalone SVG badge endpoint."""
    passed = (errors == 0 and accuracy >= 100.0)
    mock_report = TrustFlagsReport(
        committer=owner,
        repo=f"{owner}/{repo}",
        total_loc=100,
        total_errors=errors,
        accuracy_score=accuracy,
        passed=passed,
    )
    svg_content = BadgeGenerator.generate_svg(mock_report)
    return Response(content=svg_content, media_type="image/svg+xml")
