"""Unit tests for TrustFlags Reporter and Badge Generator."""

import unittest
from trustflags.models import TrustFlagsReport, LocMetrics, CodeIssue, IssueCategory, IssueSeverity
from trustflags.reporter import BadgeGenerator, ReportGenerator


class TestReportGenerator(unittest.TestCase):
    def test_green_badge_100_percent_rule(self):
        report = TrustFlagsReport(
            committer="octocat",
            total_loc=150,
            syntax_errors=0,
            lint_errors=0,
            security_issues=0,
            total_errors=0,
            accuracy_score=100.0,
            passed=True,
            loc_breakdown=LocMetrics(total_loc=150, code_lines=120, blank_lines=20, comment_lines=10),
        )
        shields_url = BadgeGenerator.get_shields_url(report)
        self.assertIn("TRUSTED", shields_url)
        self.assertIn("brightgreen", shields_url)

        svg = BadgeGenerator.generate_svg(report)
        self.assertIn("TRUSTED 100%", svg)
        self.assertIn("#10b981", svg)

        markdown = ReportGenerator.format_pr_comment(report)
        self.assertIn("🟢 TrustFlags Verification Report", markdown)
        self.assertIn("MERGE ALLOWED", markdown)
        self.assertIn("100.0% Required", markdown)

    def test_red_badge_on_any_error(self):
        issue = CodeIssue(
            file_path="app/auth.py",
            line_number=42,
            column=5,
            rule_id="B307",
            message="Use of possibly insecure function - eval() detected.",
            category=IssueCategory.SECURITY,
            severity=IssueSeverity.CRITICAL,
            code_snippet="eval(user_payload)",
        )
        report = TrustFlagsReport(
            committer="developer123",
            total_loc=50,
            syntax_errors=0,
            lint_errors=0,
            security_issues=1,
            total_errors=1,
            accuracy_score=98.0,
            passed=False,
            issues=[issue],
            loc_breakdown=LocMetrics(total_loc=50, code_lines=40, blank_lines=5, comment_lines=5),
        )
        shields_url = BadgeGenerator.get_shields_url(report)
        self.assertIn("FLAGGED", shields_url)
        self.assertIn("red", shields_url)

        svg = BadgeGenerator.generate_svg(report)
        self.assertIn("FLAGGED 1 ISSUES", svg)
        self.assertIn("#ef4444", svg)

        markdown = ReportGenerator.format_pr_comment(report)
        self.assertIn("🔴 TrustFlags Verification Report", markdown)
        self.assertIn("MERGE BLOCKED", markdown)
        self.assertIn("app/auth.py:42:5", markdown)
        self.assertIn("B307", markdown)


if __name__ == "__main__":
    unittest.main()
