<div align="center">

# 🛡️ TrustFlags

### **Automated Code Quality & Security Verification Engine for GitHub**

[![TrustFlags](https://img.shields.io/badge/TrustFlags-TRUSTED_(100%25)-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/marketplace/actions/trustflags-verifier)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-orange.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/trustflags/trustflags/pulls)

**Guarantee 100% code accuracy and zero security vulnerabilities before merging.**  
TrustFlags evaluates every commit and Pull Request, runs AST syntax checks, Bandit security scans, and Radon LOC metrics, and awards contributors a **Green Badge (100% Accurate)** or blocks merging with a **Red Badge (Flagged)**.

[Quick Start](#-quick-start) • [GitHub Action](#-github-action-integration) • [Badge Rules](#-the-trustflags-100-rule) • [CLI Usage](#-cli-usage) • [Contributing](#-contributing)

</div>

---

## 🌟 Why TrustFlags?

Traditional CI workflows run fragmented linters with cluttered logs that contributors often ignore. **TrustFlags** introduces a definitive, gamified verification standard:

- 🔒 **Zero Vulnerability Tolerance:** Deep security inspection detects SQL injection, hardcoded secrets, unsafe `eval`/`exec`, `pickle` deserialization, and dangerous `subprocess` calls.
- ⚡ **Instant AST Syntax Catch:** Catches broken syntax before wasting compute on remote linters.
- 📏 **Radon-Grade LOC Accounting:** Accurately measures physical LOC, executable lines, comments, and blank lines to calculate precision accuracy scores.
- 🏅 **Visual Accountability:** Awards a crisp Green Badge on 100% flaw-free PRs, or marks the commit status as failed and posts a collapsible debugging table directly in the PR.

---

## 🎖️ The TrustFlags 100% Rule

| Badge Status | Visual | Criteria | GitHub Merge Gate |
| :--- | :--- | :--- | :--- |
| **TRUSTED** | `![TrustFlags](https://img.shields.io/badge/TrustFlags-TRUSTED_(100%25)-brightgreen)` | **0 errors, 0 security warnings, 100.0% accuracy** | 🟢 **PASS** (Merge Allowed) |
| **FLAGGED** | `![TrustFlags](https://img.shields.io/badge/TrustFlags-FLAGGED_(Issues)-red)` | **≥ 1 syntax error, lint bug, or security vulnerability** | 🔴 **BLOCKED** (Merge Restricted) |

Accuracy score formula:
$$\text{Accuracy Score} = \left(\frac{\text{Total LOC} - \text{Lines with Errors}}{\text{Total LOC}}\right) \times 100$$

---

## 🚀 Quick Start

### Installation

Install TrustFlags via pip:

```bash
pip install trustflags
```

Or install with all security analysis tools (`bandit`, `ruff`, `radon`, `rich`):

```bash
pip install "trustflags[full]"
```

---

## 💻 CLI Usage

### 1. Scan Local Repository or Files
```bash
# Scan current directory with rich terminal output
trustflags scan .

# Scan specific files and generate report artifacts
trustflags scan src/ tests/ --fail-on-errors --json report.json --svg badge.svg
```

### 2. Verify a GitHub Pull Request Directly
```bash
trustflags pr --repo owner/my-repo --pr 42 --token $GITHUB_TOKEN --set-status
```

### 3. Launch the Webhook Server
```bash
# Start the FastAPI background verification server
trustflags serve --host 0.0.0.0 --port 8000
```

---

## 🤖 GitHub Action Integration

Add TrustFlags to your repository in **5 lines of YAML** by creating `.github/workflows/trustflags.yml`:

```yaml
name: TrustFlags Verification

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trustflags/trustflags@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          fail_on_errors: true
```

### PR Comment Preview

Whenever a contributor submits a PR, TrustFlags automatically posts a real-time audit report:

```markdown
## 🟢 TrustFlags Verification Report

[![TrustFlags Status](https://img.shields.io/badge/TrustFlags-TRUSTED_(100%25)-brightgreen?style=for-the-badge)]()

**Committer:** `@contributor` | **Status:** **PASS: 100% ACCURATE / TRUSTED**

### 📊 Code Quality & Security Metrics
| Metric | Value | Threshold / Standard |
| :--- | :--- | :--- |
| **Accuracy Score** | **100%** | **100.0% Required** |
| **Total Lines of Code (LOC)** | `342` lines | Radon Metrics |
| **Syntax Errors (AST)** | `0` | 0 allowed |
| **Lint Issues (Ruff / Flake8)** | `0` | 0 allowed |
| **Security Issues (Bandit)** | `0` | 0 allowed |
| **Merge Gate Verdict** | ✅ **MERGE ALLOWED** | Enforced by Branch Protection |
```

---

## 📁 Repository Structure

```text
trustflags/
├── trustflags/                   # Core Python Package
│   ├── __init__.py               # Package public API exports
│   ├── models.py                 # Pydantic schemas (Report, Issue, LocMetrics)
│   ├── analyzer.py               # AST parser, Bandit security rules, LOC counter
│   ├── reporter.py               # Shields.io URL, local SVG badge, Markdown builder
│   ├── github_client.py          # PyGithub client (PR comments, Commit Status API)
│   ├── server.py                 # FastAPI webhook server & dynamic badge endpoint
│   └── main.py                   # Rich CLI runner & Action runner
├── tests/                        # Comprehensive Test Suite
│   ├── test_analyzer.py          # AST & security detection test cases
│   └── test_reporter.py          # Badge generation & Markdown tests
├── .github/workflows/            # CI/CD Workflows
│   └── trustflags.yml            # Automated dogfooding verification workflow
├── action.yml                    # Reusable GitHub Action definition
├── Dockerfile                    # Container definition for CI and Webhook
├── pyproject.toml                # Standard PEP 517/621 build configuration
└── README.md                     # Documentation & usage guide
```

---

## 🔒 Built-in Security Rules Covered

TrustFlags actively monitors for and prevents the following high-risk patterns:

- **B101:** Assert statements used in production logic
- **B102 / B307:** `eval()` or `exec()` execution of untrusted input
- **B105 / B106:** Hardcoded passwords, API keys, or JWT tokens in source code
- **B301:** Unsafe deserialization using `pickle` or `shelve`
- **B506:** Insecure YAML parsing (`yaml.load()` without SafeLoader)
- **B602:** `subprocess` executions using `shell=True`
- **B608:** SQL injection vectors via format string or string concatenation

---

## 🤝 Contributing

We welcome contributions from the open-source security community!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/cool-rule`)
3. Run tests with `python -m unittest discover -s tests`
4. Ensure your PR achieves a **Green Badge** with 100% accuracy!
5. Submit a Pull Request.

---

## 📄 License

Distributed under the Apache-2.0 License. See `LICENSE` for details.
