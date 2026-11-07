import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLoc,
  calculateAccuracyScore,
  evaluateTrustFlagsRule,
  analyzePythonCode,
} from './trustflags-core.ts';

test('LOC calculation breaks down total, code, blank, and comment lines', () => {
  const sample = `"""Docstring module"""

def add(a, b):
    # Sum two numbers
    return a + b
`;
  const loc = calculateLoc(sample);
  assert.equal(loc.totalLoc, 6);
  assert.equal(loc.blankLines, 2);
  assert.equal(loc.commentLines, 2);
  assert.equal(loc.codeLines, 2);
});

test('Accuracy score calculation yields 100% when 0 error lines', () => {
  const score = calculateAccuracyScore(100, 0);
  assert.equal(score, 100.0);
});

test('Accuracy score calculation calculates correct percentage with error lines', () => {
  const score = calculateAccuracyScore(100, 5);
  assert.equal(score, 95.0);
});

test('TrustFlags 100% rule awards Green badge only on 0 errors and 100% score', () => {
  const passed = evaluateTrustFlagsRule(0, 100.0);
  assert.equal(passed.passed, true);
  assert.equal(passed.badgeStatus, 'TRUSTED');
  assert.equal(passed.badgeColor, 'brightgreen');

  const failedWithErrors = evaluateTrustFlagsRule(1, 99.0);
  assert.equal(failedWithErrors.passed, false);
  assert.equal(failedWithErrors.badgeStatus, 'FLAGGED');
  assert.equal(failedWithErrors.badgeColor, 'red');
});

test('Analyzer catches eval() security vulnerability and awards Red badge', () => {
  const vulnCode = `def run_payload(data):
    return eval(data)
`;
  const report = analyzePythonCode('auth.py', vulnCode, 'developer');
  assert.equal(report.passed, false);
  assert.equal(report.badgeStatus, 'FLAGGED');
  assert.equal(report.securityIssues, 1);
  assert.equal(report.issues[0].ruleId, 'B307');
});

test('Analyzer passes clean Python code and awards Green 100% badge', () => {
  const cleanCode = `"""Clean calculator module."""

def multiply(x: int, y: int) -> int:
    """Return product."""
    return x * y
`;
  const report = analyzePythonCode('calc.py', cleanCode, 'maintainer');
  assert.equal(report.passed, true);
  assert.equal(report.badgeStatus, 'TRUSTED');
  assert.equal(report.accuracyScore, 100.0);
  assert.equal(report.totalErrors, 0);
});

test('Analyzer detects failing unit test assertions and awards Red badge', () => {
  const brokenMath = `import unittest

def add_numbers(a, b):
    return a * b

class TestAddNumbers(unittest.TestCase):
    def test_add_positive_numbers(self):
        self.assertEqual(add_numbers(3, 5), 8)
`;
  const report = analyzePythonCode('test_calc.py', brokenMath, 'developer');
  assert.equal(report.passed, false);
  assert.equal(report.badgeStatus, 'FLAGGED');
  assert.equal(report.testFailures, 1);
  assert.equal(report.issues[0].ruleId, 'TEST_FAIL');
  assert.equal(report.issues[0].category, 'test');
});
