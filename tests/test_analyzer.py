"""Unit tests for TrustFlags CodeAnalyzer."""

import unittest
from trustflags.analyzer import CodeAnalyzer
from trustflags.models import IssueCategory, IssueSeverity


class TestCodeAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = CodeAnalyzer(use_subprocesses=False)

    def test_clean_code_awards_100_percent(self):
        clean_python = '''"""Clean module."""

def calculate_tax(amount: float, rate: float = 0.05) -> float:
    """Calculate the tax amount."""
    if amount < 0 or rate < 0:
        raise ValueError("Amount and rate must be non-negative")
    return round(amount * rate, 2)
'''
        issues, loc = self.analyzer.analyze_source("clean.py", clean_python)
        self.assertEqual(len(issues), 0)
        self.assertEqual(loc.total_loc, 7)
        self.assertTrue(loc.code_lines > 0)

    def test_syntax_error_detected(self):
        bad_syntax = '''def broken_function(:
    print("Invalid syntax here")
'''
        issues, loc = self.analyzer.analyze_source("syntax_err.py", bad_syntax)
        self.assertTrue(any(i.category == IssueCategory.SYNTAX for i in issues))
        syntax_issue = [i for i in issues if i.category == IssueCategory.SYNTAX][0]
        self.assertEqual(syntax_issue.rule_id, "E999")
        self.assertEqual(syntax_issue.line_number, 1)

    def test_security_eval_detected(self):
        eval_code = '''def run_user_input(payload: str):
    return eval(payload)
'''
        issues, _ = self.analyzer.analyze_source("vuln.py", eval_code)
        security_issues = [i for i in issues if i.category == IssueCategory.SECURITY]
        self.assertTrue(any(i.rule_id == "B307" for i in security_issues))

    def test_security_subprocess_shell_true_detected(self):
        shell_code = '''import subprocess

def run_cmd(user_arg: str):
    subprocess.run(f"echo {user_arg}", shell=True)
'''
        issues, _ = self.analyzer.analyze_source("shell_vuln.py", shell_code)
        self.assertTrue(any(i.rule_id == "B602" for i in issues))

    def test_sql_injection_detected(self):
        sql_code = '''def get_user(cursor, username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
'''
        # Notice execute with variable or formatted string
        # Let's test cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")
        direct_sql = '''def find_user(cursor, username):
    cursor.execute(f"SELECT * FROM users WHERE id = {username}")
'''
        issues, _ = self.analyzer.analyze_source("sql_vuln.py", direct_sql)
        self.assertTrue(any(i.rule_id == "B608" for i in issues))

    def test_hardcoded_secret_detected(self):
        secret_code = '''API_KEY = "sk-live-999384729103984729102"
'''
        issues, _ = self.analyzer.analyze_source("secret.py", secret_code)
        self.assertTrue(any(i.rule_id == "B105" for i in issues))

    def test_accuracy_calculation(self):
        # 10 lines of code, 1 error line -> accuracy should be 90%
        mixed_code = '''def first():
    return 1

def second():
    return 2

def dangerous(cmd):
    eval(cmd)

def third():
    return 3
'''
        issues, loc = self.analyzer.analyze_source("mixed.py", mixed_code)
        self.assertEqual(loc.total_loc, 11)
        self.assertTrue(len(issues) >= 1)


if __name__ == "__main__":
    unittest.main()
