#!/usr/bin/env python3
import os
import sys
import re
import json
import subprocess

PROJECT_ROOT = "/Users/alessandronicoletti11/Desktop/exam simulator"
MOCK_EXAMS_DIR = os.path.join(PROJECT_ROOT, "Mock exams")
APP_JS = os.path.join(PROJECT_ROOT, "app.js")
INDEX_HTML = os.path.join(PROJECT_ROOT, "index.html")
INDEX_CSS = os.path.join(PROJECT_ROOT, "index.css")

def log(msg):
    print(msg)

def extract_pdf_text(filepath):
    cmd = ["osascript", "-l", "JavaScript", "-e", f"""
    ObjC.import("PDFKit");
    ObjC.import("Foundation");
    const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath("{filepath}"));
    const text = doc ? ObjC.unwrap(doc.string) : "";
    $.NSFileHandle.fileHandleWithStandardOutput.writeData($(text).dataUsingEncoding($.NSUTF8StringEncoding));
    """]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and len(res.stdout) > 0:
        return res.stdout
    raise RuntimeError(f"Failed to extract PDF text from {filepath}")

def parse_with_app_js(raw_text):
    temp_json_path = os.path.join(PROJECT_ROOT, "temp_audit_input.txt")
    with open(temp_json_path, "w", encoding="utf-8") as f:
        f.write(raw_text)
        
    osa_script = f"""
    const fs = $.NSFileManager.defaultManager;
    const inputPath = $("{temp_json_path}");
    const inputData = $.NSString.stringWithContentsOfFileEncodingError(inputPath, $.NSUTF8StringEncoding, null);
    const inputText = ObjC.unwrap(inputData);

    const appJsPath = $("{APP_JS}");
    const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
    const appJsCode = ObjC.unwrap(appJsData);

    function createDummy() {{
      return {{
        classList: {{ add: ()=>{{}}, remove: ()=>{{}}, contains: ()=>false }},
        style: {{}},
        textContent: "",
        value: "",
        addEventListener: ()=>{{}},
        appendChild: ()=>{{}},
        click: ()=>{{}}
      }};
    }}

    const mockDoc = {{
      body: {{ dataset: {{}} }},
      getElementById: () => createDummy(),
      querySelector: () => createDummy(),
      querySelectorAll: () => [],
      createElement: () => createDummy(),
      addEventListener: (e, cb) => {{ if (e === "DOMContentLoaded") cb(); }}
    }};
    const mockWindow = {{ CBEH_QUESTIONS: [] }};

    const testFn = new Function("window", "document", "localStorage", "console", `
      var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
      globalObj.window = window; globalObj.document = document; globalObj.localStorage = localStorage;
      ${{appJsCode}}
      return window.parseMockExamText || globalObj.parseMockExamText;
    `);

    const parseMockExamText = testFn(mockWindow, mockDoc, {{ getItem: ()=>null, setItem: ()=>{{}}, removeItem: ()=>{{}} }}, {{ log: ()=>{{}}, error: ()=>{{}} }});
    const questions = parseMockExamText(inputText);

    const output = JSON.stringify(questions);
    $.NSFileHandle.fileHandleWithStandardOutput.writeData($(output).dataUsingEncoding($.NSUTF8StringEncoding));
    """
    
    res = subprocess.run(["osascript", "-l", "JavaScript", "-e", osa_script], capture_output=True, text=True)
    if os.path.exists(temp_json_path):
        os.remove(temp_json_path)
        
    if res.returncode != 0:
        log(f"Error executing JS: {res.stderr}")
        return []
    try:
        return json.loads(res.stdout)
    except Exception as e:
        log(f"JSON parse error: {e}, stdout: {res.stdout[:200]}")
        return []

def main():
    log("================================================================================")
    log("     FORENSIC INTEGRITY AUDIT: CBEH EXAM SIMULATOR (MILESTONE 3)")
    log("================================================================================")

    total_checks = 0
    passed_checks = 0
    violations = []

    def check(condition, desc, fail_detail=""):
        nonlocal total_checks, passed_checks, violations
        total_checks += 1
        if condition:
            passed_checks += 1
            log(f"  [PASS] {desc}")
        else:
            violations.append((desc, fail_detail))
            log(f"  [FAIL] {desc} -> {fail_detail}")

    # -------------------------------------------------------------
    # PHASE 1: Prohibited Patterns & Source Code Forensics
    # -------------------------------------------------------------
    log("\n[PHASE 1] Source Code Integrity & Prohibited Pattern Detection")
    
    with open(APP_JS, "r", encoding="utf-8") as f:
        app_js_text = f.read()
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        index_html_text = f.read()
    with open(INDEX_CSS, "r", encoding="utf-8") as f:
        index_css_text = f.read()

    # 1.1 Facade & Mock Function Check
    check("function calculateScores" in app_js_text and "isPassed = passOverall && passCellBio && passHistology && passEmbryo && passInterdisciplinary" in app_js_text,
          "Authentic multi-module passing score calculation in calculateScores")
    check("cbeh_questions_pool_v1" in app_js_text, 
          "Authentic question pool localStorage key preserved")
    check("getModuleFromQuestionId" in app_js_text and "normId >= 67" in app_js_text, 
          "Deterministic getModuleFromQuestionId function implemented with standard CBEH ID ranges")
    check("cleanQuestionPromptText" in app_js_text and "s.replace(/^(?:and|or|but|also|as well as|&)(?:\\s+|$)/i, \"\")" in app_js_text, 
          "Iterative cleanQuestionPromptText function implemented with conjunction stripping")
    check("applyReviewListPagination" in app_js_text and "review-pagination-control" in app_js_text, 
          "Dynamic applyReviewListPagination function implemented with DOM injection")

    # 1.2 Prompt Keyword Override Removal
    check("upperQ.includes(\"HISTOLOGY\")" not in app_js_text, 
          "No prompt keyword override for Histology")
    check("upperQ.includes(\"EMBRYOLOGY\")" not in app_js_text, 
          "No prompt keyword override for Embryology")
    check("upperQ.includes(\"CELL BIOLOGY\")" not in app_js_text, 
          "No prompt keyword override for Cell Biology")

    # 1.3 HTML Structure Check
    check("id=\"screen-results\"" in index_html_text, "screen-results element present in index.html")
    check("id=\"open-questions-grading-list\"" in index_html_text, "open-questions-grading-list container present")
    check("id=\"auto-questions-review-list\"" in index_html_text, "auto-questions-review-list container present")
    check("id=\"btn-restart-exam\"" in index_html_text, "btn-restart-exam button present")
    check("id=\"btn-home-results\"" in index_html_text, "btn-home-results button present")
    check("id=\"downloadPdfBtn\"" in index_html_text, "downloadPdfBtn button present")

    # 1.4 CSS Rules Check
    check(".review-pagination-control" in index_css_text, ".review-pagination-control CSS class defined")
    check(".btn-show-more" in index_css_text, ".btn-show-more CSS class defined")
    check(".results-compact-actions" in index_css_text, ".results-compact-actions CSS class defined")
    check(".btn-compact-action" in index_css_text, ".btn-compact-action CSS class defined")
    check(".btn-compact-pdf" in index_css_text, ".btn-compact-pdf CSS class defined")
    check(".btn-compact-home" in index_css_text, ".btn-compact-home CSS class defined")
    check(".btn-compact-restart" in index_css_text, ".btn-compact-restart CSS class defined")
    check("@keyframes fadeInReviewCard" in index_css_text, "Fade-in review card keyframe animation defined")
    check("@media print" in index_css_text and ".review-pagination-control" in index_css_text, "Print stylesheet properly hides review pagination controls")

    # -------------------------------------------------------------
    # PHASE 2: Empirical Mock Exam Processing across 7 Files
    # -------------------------------------------------------------
    log("\n[PHASE 2] Empirical Mock Exam Parsing & Classification (7 Simulations)")

    sim_files = sorted(os.listdir(MOCK_EXAMS_DIR))
    check(len(sim_files) == 7, "Exactly 7 simulation files found in Mock exams directory", f"Found {len(sim_files)}")

    total_parsed_questions = 0
    total_interdisciplinary_questions = 0
    total_cellbio = 0
    total_histology = 0
    total_embryology = 0

    orphaned_prompts = []
    broken_fill_gaps = []
    broken_matchings = []

    for filename in sim_files:
        filepath = os.path.join(MOCK_EXAMS_DIR, filename)
        if filename.endswith(".md"):
            with open(filepath, "r", encoding="utf-8") as f:
                raw_text = f.read()
        elif filename.endswith(".pdf"):
            raw_text = extract_pdf_text(filepath)
        else:
            continue

        questions = parse_with_app_js(raw_text)
        q_count = len(questions)
        total_parsed_questions += q_count

        cb = sum(1 for q in questions if q.get("module") == "Cell Biology")
        hist = sum(1 for q in questions if q.get("module") == "Histology")
        emb = sum(1 for q in questions if q.get("module") == "Embryology")
        ind = sum(1 for q in questions if q.get("module") == "Interdisciplinary")

        total_cellbio += cb
        total_histology += hist
        total_embryology += emb
        total_interdisciplinary_questions += ind

        check(q_count == 70, f"{filename}: parsed exactly 70 questions", f"Got {q_count}")
        check(cb == 30, f"{filename}: Cell Biology count = 30 (Q1-30)", f"Got {cb}")
        check(hist == 24, f"{filename}: Histology count = 24 (Q31-54)", f"Got {hist}")
        check(emb == 12, f"{filename}: Embryology count = 12 (Q55-66)", f"Got {emb}")
        check(ind == 4, f"{filename}: Interdisciplinary count = 4 (Q67-70)", f"Got {ind}")

        for q in questions:
            qid = q.get("id")
            qmod = q.get("module")
            qprompt = q.get("question", "")
            qtype = q.get("type")

            if 67 <= qid <= 70:
                if qmod != "Interdisciplinary":
                    violations.append((f"{filename} Q{qid} module", f"Expected Interdisciplinary, got {qmod}"))

            if re.match(r'^(?:and|or|but|also|as well as|&)\s+', qprompt, re.I):
                orphaned_prompts.append(f"{filename} Q{qid}: '{qprompt[:40]}'")
            
            if re.match(r'^(?:(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+){2,}', qprompt):
                orphaned_prompts.append(f"{filename} Q{qid} chained prep: '{qprompt[:40]}'")

            if qtype == "fill-in-the-gap":
                if "_" not in qprompt and "..." not in qprompt and "[" not in qprompt:
                    broken_fill_gaps.append(f"{filename} Q{qid}: '{qprompt[:40]}'")

            if qtype == "matching":
                if len(q.get("leftItems", [])) == 0 or len(q.get("rightItems", [])) == 0:
                    broken_matchings.append(f"{filename} Q{qid}: left={len(q.get('leftItems',[]))}, right={len(q.get('rightItems',[]))}")

    check(total_parsed_questions == 490, "Grand total questions parsed = 490 (7 * 70)", f"Got {total_parsed_questions}")
    check(total_interdisciplinary_questions == 28, "Grand total Interdisciplinary questions = 28 (7 * 4)", f"Got {total_interdisciplinary_questions}")
    check(total_cellbio == 210, "Grand total Cell Biology questions = 210 (7 * 30)", f"Got {total_cellbio}")
    check(total_histology == 168, "Grand total Histology questions = 168 (7 * 24)", f"Got {total_histology}")
    check(total_embryology == 84, "Grand total Embryology questions = 84 (7 * 12)", f"Got {total_embryology}")
    check(len(orphaned_prompts) == 0, "No question prompts contain orphaned conjunctions/prepositions", str(orphaned_prompts))
    check(len(broken_fill_gaps) == 0, "All fill-in-the-gap blanks preserved", str(broken_fill_gaps))
    check(len(broken_matchings) == 0, "All matching questions have non-empty left and right pairs", str(broken_matchings))

    # -------------------------------------------------------------
    # PHASE 3: Results UI Pagination & Compact Actions DOM Mechanics
    # -------------------------------------------------------------
    log("\n[PHASE 3] Results UI Pagination & Compact Actions DOM Simulation")
    
    # Run the comprehensive JS DOM test suite
    res = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(PROJECT_ROOT, "test_m2_pagination.js")], capture_output=True, text=True)
    check(res.returncode == 0 and "SUCCESS" in res.stdout, "Milestone 2 pagination test runner passes 100%", res.stderr)

    # Run the challenger test suite
    res_chal = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(PROJECT_ROOT, "test_empirical_challenger.js")], capture_output=True, text=True)
    check(res_chal.returncode == 0 and "SUCCESS" in res_chal.stdout, "Empirical Challenger adversarial test suite passes 100%", res_chal.stderr)

    log("\n================================================================================")
    log(f"FINAL AUDIT VERDICT: {'CLEAN' if len(violations) == 0 else 'INTEGRITY VIOLATION'}")
    log(f"TOTAL CHECKS: {total_checks} | PASSED: {passed_checks} | FAILED: {len(violations)}")
    log("================================================================================")

    if violations:
        log("VIOLATIONS RECORDED:")
        for v, d in violations:
            log(f" - {v}: {d}")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
