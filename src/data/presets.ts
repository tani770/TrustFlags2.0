export interface CodePreset {
  id: string;
  name: string;
  badgeType: 'green' | 'red';
  tag: string;
  filename: string;
  description: string;
  code: string;
}

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'clean',
    name: '100% Flawless Python Module',
    badgeType: 'green',
    tag: 'TRUSTED • 100% ACCURATE',
    filename: 'auth_service.py',
    description: 'Cryptographically sound password hashing, strict type annotations, docstrings, and parameterized queries.',
    code: `"""Secure Authentication Service.

Enforces zero security vulnerabilities, standard PEP 8 conventions,
and 100% test accuracy under the TrustFlags engine.
"""

import hashlib
import hmac
import secrets
from typing import Optional, Tuple


class AuthService:
    """Production-grade user authentication and signature validator."""

    def __init__(self, secret_salt: Optional[str] = None):
        # Generate dynamic high-entropy cryptographic salt
        self.salt = secret_salt or secrets.token_hex(32)

    def hash_password(self, password: str) -> str:
        """Securely hash password using SHA-256 with dynamic salt."""
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        encoded_pw = password.encode("utf-8")
        encoded_salt = self.salt.encode("utf-8")
        digest = hashlib.pbkdf2_hmac("sha256", encoded_pw, encoded_salt, 100000)
        return digest.hex()

    def verify_password(self, password: str, expected_hash: str) -> bool:
        """Constant-time comparison preventing timing side-channel attacks."""
        computed_hash = self.hash_password(password)
        return hmac.compare_digest(computed_hash, expected_hash)

    def execute_user_query(self, cursor, user_id: int) -> Optional[Tuple]:
        """Parameterized query safely immune to SQL injection."""
        query = "SELECT id, username, email FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        return cursor.fetchone()
`,
  },
  {
    id: 'broken_unittest',
    name: 'Broken Logic (Failing Tests)',
    badgeType: 'red',
    tag: 'FLAGGED • 3 UNIT TEST FAILURES',
    filename: 'test_calculator.py',
    description: 'Code has valid syntax and no security flaws, but fails 3 unit test assertions (AssertionError: 15 != 8).',
    code: `import unittest

# 1. The BROKEN code being tested (Multiplies instead of adds)
def add_numbers(a, b):
    """Returns the sum of two numbers (Intentionally broken!)."""
    return a * b  # <-- This bug will cause the tests to fail

# 2. The test suite (Stays exactly the same)
class TestAddNumbers(unittest.TestCase):
    
    def test_add_positive_numbers(self):
        # 3 * 5 will equal 15, but the test expects 8
        result = add_numbers(3, 5)
        self.assertEqual(result, 8)

    def test_add_negative_numbers(self):
        # -1 * -1 will equal 1, but the test expects -2
        result = add_numbers(-1, -1)
        self.assertEqual(result, -2)

    def test_add_float_numbers(self):
        # 1.5 * 2.5 will equal 3.75, but the test expects 4.0
        result = add_numbers(1.5, 2.5)
        self.assertEqual(result, 4.0)

# 3. Execution block
if __name__ == '__main__':
    unittest.main()
`,
  },
  {
    id: 'security_exploits',
    name: 'Critical Security Vulnerabilities',
    badgeType: 'red',
    tag: 'FLAGGED • 4 HIGH RISK VULNERABILITIES',
    filename: 'vulnerable_api.py',
    description: 'Contains Bandit B307 (eval), B608 (SQL injection), B602 (shell=True), and B105 (hardcoded secret).',
    code: `"""Insecure API handler containing multiple high-severity vulnerabilities."""

import os
import subprocess

# B105: Hardcoded sensitive API credential
api_key = "sk_live_99482710384729103847"

def run_arbitrary_code(user_input: str):
    # B307: Unsafe dynamic evaluation of unverified user input
    return eval(user_input)

def search_users(cursor, search_term: str):
    # B608: Direct SQL Injection through f-string interpolation
    query = f"SELECT * FROM users WHERE username = '{search_term}' OR role = 'admin'"
    cursor.execute(query)
    return cursor.fetchall()

def execute_system_backup(target_dir: str):
    # B602: Subprocess executed with shell=True allowing command injection
    subprocess.run(f"tar -czf backup.tar.gz {target_dir}", shell=True)
`,
  },
  {
    id: 'syntax_error',
    name: 'Broken AST Syntax',
    badgeType: 'red',
    tag: 'FLAGGED • AST SYNTAX ERROR',
    filename: 'broken_parser.py',
    description: 'Fails immediate Python AST compilation with malformed function signature and missing colon.',
    code: `"""Broken Python module that fails AST parse immediately."""

def calculate_analytics_metrics(data_points: list(:
    # SyntaxError: invalid syntax near '(:'
    total = sum(data_points)
    return total / len(data_points)

print("This line will never execute")
`,
  },
  {
    id: 'lint_smells',
    name: 'Flake8 / Ruff Code Smells',
    badgeType: 'red',
    tag: 'FLAGGED • LINTING BUGS & PEP 8 VIOLATIONS',
    filename: 'bad_practices.py',
    description: 'Wildcard imports (F403), bare except clauses (E722), and line length exceeding 120 characters (E501).',
    code: `"""Module illustrating common code quality smells and lint bugs."""

# F403: Wildcard import hides namespace and causes undefined name bugs
from math import *

def parse_config_file(filepath: str):
    try:
        with open(filepath, "r") as f:
            return f.read()
    # E722: Bare except hides SystemExit and KeyboardInterrupt
    except:
        return None

# E501: Line length severely exceeds PEP 8 limit (>120 characters)
very_long_audit_log_message_string = "This line is intentionally constructed to exceed the standard Python PEP 8 line length limit by a substantial amount for testing purposes"
`,
  },
];
