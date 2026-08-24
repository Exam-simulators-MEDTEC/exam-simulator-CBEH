#!/usr/bin/env python3
"""
Independent Victory Auditor Sentinel Verification Script
Executes multi-phase forensic checks, static code analysis, and test suites.
"""

import os
import sys
import re
import json
import subprocess

PROJECT_ROOT = "/Users/alessandronicoletti11/Desktop/exam simulator"
ORIGINAL_REQUEST_PATH = os.path.join(PROJECT_ROOT, ".agents/ORIGINAL_REQUEST.md")

passed_checks = 0
failed_checks = 0
findings = []

def audit_assert(condition, check_name, details=""):
    global passed_checks, failed_checks
    if condition:
        passed_checks += 1
        print(f"  ✅ PASS: {check_name}")
    else:
        failed_checks += 1
        print(f"  ❌ FAIL: {check_name} — {details}")
        findings.append(f"{check_name}: {details}")

print("=" * 80)
print("   INDEPENDENT POST-VICTORY AUDIT SUITE (SENTINEL)")
print("=" * 80)

# ==============================================================================
# PHASE A: TIMELINE & PROVENANCE AUDIT
# ==============================================================================
print("\n[PHASE A] Timeline, Scope & Provenance Audit against ORIGINAL_REQUEST.md")

# 1. Read ORIGINAL_REQUEST.md
audit_assert(os.path.exists(ORIGINAL_REQUEST_PATH), "ORIGINAL_REQUEST.md exists")
with open(ORIGINAL_REQUEST_PATH, "r", encoding="utf-8") as f:
    req_content = f.read()

audit_assert("Exam Analytics & Weak Spot Breakdown Dashboard" in req_content, "ORIGINAL_REQUEST contains Dashboard feature")
audit_assert("R1. Cumulative Performance & Module Weak-Spot Dashboard" in req_content, "ORIGINAL_REQUEST contains R1")
audit_assert("R2. Visual Score Trends & Attempt History Log" in req_content, "ORIGINAL_REQUEST contains R2")
audit_assert("1–70 Rule" in req_content or "1-70 Rule" in req_content, "ORIGINAL_REQUEST contains 1-70 rule")

# 2. Check Git Timeline
git_proc = subprocess.run(["git", "log", "-n", "8", "--oneline"], cwd=PROJECT_ROOT, capture_output=True, text=True)
audit_assert(git_proc.returncode == 0 and len(git_proc.stdout.strip().splitlines()) >= 5, "Git history contains multiple genuine commits", git_proc.stdout)
audit_assert("feat: implement Exam Analytics & Weak Spot Breakdown Dashboard" in git_proc.stdout, "Git history records Dashboard implementation commit")

# ==============================================================================
# PHASE B: INTEGRITY FORENSICS & ANTI-CHEATING ANALYSIS
# ==============================================================================
print("\n[PHASE B] Forensic Integrity & Anti-Cheating Analysis")

app_js_path = os.path.join(PROJECT_ROOT, "app.js")
index_html_path = os.path.join(PROJECT_ROOT, "index.html")
index_css_path = os.path.join(PROJECT_ROOT, "index.css")

with open(app_js_path, "r", encoding="utf-8") as f:
    app_js = f.read()

with open(index_html_path, "r", encoding="utf-8") as f:
    index_html = f.read()

with open(index_css_path, "r", encoding="utf-8") as f:
    index_css = f.read()

# 1. Anti-cheating: No hardcoded return values in calculation functions
audit_assert("function calculateAnalyticsSummary(" in app_js, "calculateAnalyticsSummary function exists")
audit_assert("function getModuleStudyRecommendations(" in app_js, "getModuleStudyRecommendations function exists")
audit_assert("function renderAnalyticsTrendChart(" in app_js, "renderAnalyticsTrendChart function exists")
audit_assert("function updateAnalyticsUI(" in app_js, "updateAnalyticsUI function exists")
audit_assert("function isAttemptPassed(" in app_js, "isAttemptPassed function exists")
audit_assert("function getModuleScoreEntry(" in app_js, "getModuleScoreEntry function exists")
audit_assert("function formatAttemptGradeDisplay(" in app_js, "formatAttemptGradeDisplay function exists")
audit_assert("function safeGetLocalStorageArray(" in app_js, "safeGetLocalStorageArray function exists")

# Check for facade / fake implementations
audit_assert(not re.search(r"function calculateAnalyticsSummary\([^)]*\)\s*\{\s*return\s*\{[^}]*passRate:\s*75", app_js), "No hardcoded passRate in calculateAnalyticsSummary")
audit_assert("summary.passRate = summary.totalAttempts > 0 ? (summary.passCount / summary.totalAttempts) * 100 : 0;" in app_js, "Pass rate is calculated dynamically from counts")

# 2. Check HTML Structure
audit_assert('id="welcome-tab-analytics"' in index_html, "index.html has analytics tab button")
audit_assert('id="welcome-panel-analytics"' in index_html, "index.html has analytics panel container")
audit_assert('id="analytics-dynamic-content"' in index_html, "index.html has dynamic analytics content area")
audit_assert('id="btn-reset-analytics"' in index_html, "index.html has reset analytics button")

# 3. Check CSS Structure & Design System
audit_assert(".analytics-dashboard" in index_css, "index.css has .analytics-dashboard styles")
audit_assert(".analytics-metrics-grid" in index_css, "index.css has .analytics-metrics-grid styles")
audit_assert(".analytics-metric-card" in index_css, "index.css has .analytics-metric-card styles")
audit_assert(".analytics-modules-grid" in index_css, "index.css has .analytics-modules-grid styles")
audit_assert(".weakspot-card" in index_css, "index.css has .weakspot-card styles")
audit_assert(".trend-bar-fill" in index_css, "index.css has .trend-bar-fill styles")
audit_assert(".analytics-history-list" in index_css, "index.css has .analytics-history-list styles")
audit_assert(".analytics-empty-state" in index_css, "index.css has .analytics-empty-state styles")

# 4. Check Module Categorization (1-70 Rule)
audit_assert("function getModuleFromQuestionId(" in app_js, "getModuleFromQuestionId exists")
audit_assert("Cell Biology" in app_js and "Histology" in app_js and "Embryology" in app_js and "Interdisciplinary" in app_js, "All 4 modules present in code")

# ==============================================================================
# PHASE C: INDEPENDENT TEST EXECUTION
# ==============================================================================
print("\n[PHASE C] Independent Test Suite Execution")

test_commands = [
    ("Analytics Dashboard Test Suite", ["osascript", "-l", "JavaScript", "test_analytics_dashboard.js"]),
    ("Review Card UI & Categorization Suite", ["osascript", "-l", "JavaScript", "test_review_card_and_categorization.js"]),
    ("Empirical 7-Simulation PDF/MD Pool Suite", ["python3", "test_all_mock_exams_empirical.py"]),
    ("Review Pagination & Actions Suite", ["osascript", "-l", "JavaScript", "test_m2_pagination.js"]),
    ("Adversarial Reviewer Suite", ["osascript", "-l", "JavaScript", "test_adversarial_reviewer.js"]),
    ("Empirical Challenger M1 Suite", ["osascript", "-l", "JavaScript", "test_empirical_challenger.js"]),
    ("Empirical Challenger M3 E2E Suite", ["osascript", "-l", "JavaScript", "test_empirical_challenger_m3.js"]),
    ("Victory Auditor Independent Verification Suite", ["osascript", "-l", "JavaScript", ".agents/teamwork_preview_victory_auditor_1/auditor_independent_verification.js"])
]

for title, cmd in test_commands:
    res = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    is_success = res.returncode == 0 and ("SUCCESS" in res.stdout or "PASSED" in res.stdout or "GRAND TOTAL: 560" in res.stdout)
    audit_assert(is_success, title, res.stderr if res.stderr else res.stdout[-200:])

print("\n" + "=" * 80)
print(f"AUDIT SUMMARY: {passed_checks} checks passed, {failed_checks} checks failed.")
print("=" * 80)

if failed_checks == 0:
    print("VERDICT: VICTORY CONFIRMED")
    sys.exit(0)
else:
    print("VERDICT: VICTORY REJECTED")
    print("FAILURES:")
    for f in findings:
        print(" - " + f)
    sys.exit(1)
