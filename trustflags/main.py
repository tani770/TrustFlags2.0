"""Main CLI and GitHub Action entrypoint for TrustFlags.

Usage:
  trustflags scan <path> [--fail-on-errors] [--json report.json] [--svg badge.svg]
  trustflags pr --repo owner/repo --pr 123 [--token GITHUB_TOKEN] [--set-status]
  trustflags serve [--host 0.0.0.0] [--port 8000]
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional

from .analyzer import CodeAnalyzer
from .reporter import BadgeGenerator, ReportGenerator
from .github_client import GitHubIntegrationClient
from .models import TrustFlagsReport, IssueCategory


def print_rich_report(report: TrustFlagsReport) -> None:
    """Print an attractive summary table to terminal using Rich or ANSI."""
    try:
        from rich.console import Console
        from rich.table import Table
        from rich.panel import Panel
        from rich.text import Text

        console = Console()

        # Badge Banner
        badge_color = "bold green" if report.passed else "bold red"
        badge_symbol = "🟢" if report.passed else "🔴"
        title_text = f"{badge_symbol} TRUSTFLAGS: {report.badge_status} ({report.badge_label})"
        
        banner = Panel(
            Text(f"Accuracy Score: {report.accuracy_score:g}%\nTotal Errors: {report.total_errors}\nTotal LOC: {report.total_loc} lines", justify="center"),
            title=title_text,
            style=badge_color,
            expand=False,
        )
        console.print(banner)

        # Metrics Table
        table = Table(title="TrustFlags Verification Metrics", show_header=True, header_style="bold cyan")
        table.add_column("Metric", style="dim")
        table.add_column("Count / Value", justify="right")
        table.add_column("Status / Limit")

        table.add_row("Total Lines of Code", str(report.total_loc), "Radon Metrics")
        table.add_row("Source Code Lines", str(report.loc_breakdown.code_lines), "Executable")
        table.add_row("Comments / Docstrings", str(report.loc_breakdown.comment_lines), "Documentation")
        table.add_row("Syntax Errors (AST)", str(report.syntax_errors), "[green]0[/green]" if report.syntax_errors == 0 else "[red]FAIL[/red]")
        table.add_row("Lint Issues (Flake8/Ruff)", str(report.lint_errors), "[green]0[/green]" if report.lint_errors == 0 else "[yellow]FAIL[/yellow]")
        table.add_row("Security Issues (Bandit)", str(report.security_issues), "[green]0[/green]" if report.security_issues == 0 else "[red]VULNERABLE[/red]")
        table.add_row("Accuracy Score", f"{report.accuracy_score:g}%", "[green]100% Required[/green]" if report.passed else "[red]Under 100%[/red]")

        console.print(table)

        # Issues details table if any
        if report.issues:
            issues_table = Table(title=f"Detailed Findings ({len(report.issues)})", show_header=True, header_style="bold magenta")
            issues_table.add_column("Location", style="cyan")
            issues_table.add_column("Category", style="yellow")
            issues_table.add_column("Rule", style="bold")
            issues_table.add_column("Severity")
            issues_table.add_column("Message")

            for issue in report.issues:
                sev_color = "red" if issue.severity.value in ["critical", "high"] else "yellow"
                issues_table.add_row(
                    f"{issue.file_path}:{issue.line_number}:{issue.column}",
                    issue.category.value if hasattr(issue.category, "value") else str(issue.category),
                    issue.rule_id,
                    f"[{sev_color}]{issue.severity.value.upper()}[/{sev_color}]",
                    issue.message,
                )
            console.print(issues_table)

    except ImportError:
        # Fallback plain console printing
        print("=" * 60)
        badge_name = "TRUSTED (100% ACCURATE)" if report.passed else f"FLAGGED ({report.total_errors} ISSUES)"
        print(f"TRUSTFLAGS REPORT: {badge_name}")
        print(f"Accuracy: {report.accuracy_score:g}% | Total LOC: {report.total_loc} | Errors: {report.total_errors}")
        print(f"Syntax: {report.syntax_errors} | Lint: {report.lint_errors} | Security: {report.security_issues}")
        print("=" * 60)
        for issue in report.issues:
            print(f"[{issue.category}] {issue.file_path}:{issue.line_number} ({issue.rule_id}) - {issue.message}")
        print("=" * 60)


def run_scan_command(args: argparse.Namespace) -> int:
    """Execute local code scan on target files or paths."""
    analyzer = CodeAnalyzer()
    paths = args.paths or ["."]
    committer = args.committer or os.getenv("GITHUB_ACTOR", "local-dev")

    print(f"Scanning target paths: {', '.join(paths)}...")
    report = analyzer.analyze_paths(paths, committer=committer)

    # Output Badge & Report
    report.badge_url = BadgeGenerator.get_shields_url(report)
    report.badge_svg = BadgeGenerator.generate_svg(report)

    print_rich_report(report)

    # Emit native GitHub Actions workflow commands and Step Summary if running in CI
    ReportGenerator.emit_github_workflow_commands(report)
    ReportGenerator.write_github_step_summary(report)
    ReportGenerator.write_github_output(report)

    if args.json:
        out_path = Path(args.json)
        out_path.write_text(ReportGenerator.to_json(report), encoding="utf-8")
        print(f"Saved JSON report to {args.json}")

    if args.svg:
        out_svg = Path(args.svg)
        out_svg.write_text(BadgeGenerator.generate_svg(report), encoding="utf-8")
        print(f"Saved SVG badge to {args.svg}")

    if args.badge_url:
        print("\nShields.io Badge URL:")
        print(BadgeGenerator.get_shields_url(report))

    # Exit code: 0 if passed (100% accurate, 0 errors), 1 if failed
    if args.fail_on_errors and not report.passed:
        return 1
    return 0


def run_pr_command(args: argparse.Namespace) -> int:
    """Execute GitHub PR scan, post comment, and set Commit Status."""
    token = args.token or os.getenv("GITHUB_TOKEN")
    repo = args.repo or os.getenv("GITHUB_REPOSITORY")
    pr_number = args.pr or int(os.getenv("GITHUB_PR_NUMBER", "0"))

    if not repo or not pr_number:
        print("Error: --repo and --pr are required (or GITHUB_REPOSITORY and GITHUB_PR_NUMBER env vars).")
        return 1

    print(f"Inspecting Pull Request #{pr_number} in repo {repo}...")
    gh_client = GitHubIntegrationClient(token=token)

    try:
        pr_files, head_sha, committer = gh_client.get_pr_files(repo, pr_number)
    except Exception as e:
        print(f"Failed to fetch PR files: {e}")
        return 1

    if not pr_files:
        print("No Python files found in this Pull Request. Skipping analysis.")
        return 0

    print(f"Found {len(pr_files)} Python file(s) in PR. Analyzing contents...")
    analyzer = CodeAnalyzer()
    
    # Save temporary files to run checks
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_paths = []
        for f in pr_files:
            file_tmp = Path(tmpdir) / f["filename"]
            file_tmp.parent.mkdir(parents=True, exist_ok=True)
            file_tmp.write_text(f["content"], encoding="utf-8")
            tmp_paths.append(str(file_tmp))

        report = analyzer.analyze_paths(tmp_paths, committer=committer)
        # Remap filenames
        for issue in report.issues:
            for f in pr_files:
                if f["filename"] in issue.file_path:
                    issue.file_path = f["filename"]
                    break

    report.repo = repo
    report.pr_number = pr_number
    report.commit_sha = head_sha
    report.badge_url = BadgeGenerator.get_shields_url(report)

    # Post or update PR comment
    comment_body = ReportGenerator.format_pr_comment(report)
    if args.post_comment:
        try:
            gh_client.post_or_update_pr_comment(repo, pr_number, comment_body)
        except Exception as e:
            print(f"Failed to post PR comment: {e}")

    # Set Commit Status Check
    if args.set_status and head_sha:
        try:
            gh_client.set_commit_status(repo, head_sha, report)
        except Exception as e:
            print(f"Failed to set commit status: {e}")

    # Emit native GitHub Actions workflow commands and Step Summary
    ReportGenerator.emit_github_workflow_commands(report)
    ReportGenerator.write_github_step_summary(report)
    ReportGenerator.write_github_output(report)

    print_rich_report(report)

    if args.fail_on_errors and not report.passed:
        return 1
    return 0


def run_serve_command(args: argparse.Namespace) -> int:
    """Run FastAPI webhook server."""
    try:
        import uvicorn
        from .server import app
        print(f"Starting TrustFlags Webhook Server on {args.host}:{args.port}...")
        uvicorn.run(app, host=args.host, port=args.port)
        return 0
    except ImportError:
        print("Error: uvicorn is required to run the server. Install with 'pip install uvicorn'.")
        return 1


def cli() -> None:
    """Main CLI argument parser entrypoint."""
    parser = argparse.ArgumentParser(
        prog="trustflags",
        description="TrustFlags: Automated Code Quality & Security Verification Engine",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Scan subcommand
    scan_parser = subparsers.add_parser("scan", help="Scan local files or directories")
    scan_parser.add_argument("paths", nargs="*", default=["."], help="Paths to files or directories")
    scan_parser.add_argument("--committer", help="Committer username for report")
    scan_parser.add_argument("--fail-on-errors", action="store_true", default=True, help="Exit with non-zero code on errors")
    scan_parser.add_argument("--json", help="Path to write JSON report")
    scan_parser.add_argument("--svg", help="Path to write SVG badge")
    scan_parser.add_argument("--badge-url", action="store_true", help="Print Shields.io badge URL")

    # PR subcommand
    pr_parser = subparsers.add_parser("pr", help="Analyze a GitHub Pull Request")
    pr_parser.add_argument("--repo", help="Repository in owner/repo format")
    pr_parser.add_argument("--pr", type=int, help="Pull request number")
    pr_parser.add_argument("--token", help="GitHub Personal Access Token")
    pr_parser.add_argument("--post-comment", action="store_true", default=True, help="Post/update PR comment")
    pr_parser.add_argument("--set-status", action="store_true", default=True, help="Update Commit Status API")
    pr_parser.add_argument("--fail-on-errors", action="store_true", default=True, help="Exit 1 if Red Badge")

    # Serve subcommand
    serve_parser = subparsers.add_parser("serve", help="Launch FastAPI webhook server")
    serve_parser.add_argument("--host", default="0.0.0.0", help="Host address to bind")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port to listen on")

    args = parser.parse_args()

    if args.command == "scan":
        sys.exit(run_scan_command(args))
    elif args.command == "pr":
        sys.exit(run_pr_command(args))
    elif args.command == "serve":
        sys.exit(run_serve_command(args))


if __name__ == "__main__":
    cli()
