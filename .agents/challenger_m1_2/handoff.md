# Milestone 1: Challenger 2 Empirical Assessment Report

## Verdict: REQUEST_CHANGES

---

## 1. Observation

Direct empirical execution of the parser (`parseMockExamText`, `sanitizeQuestion`, `cleanQuestionPromptText`, `cleanOptionPrefix`) in `app.js` against all 7 simulation files (`Mock exams/*`) via macOS PDFKit and JavaScriptCore revealed critical regressions and failures:

### Observation 1.1: Complete Parsing Failure on Simulation 1 (0 / 70 Questions Parsed)
- **File**: `app.js` (lines 2220–2226), `Mock exams/CBEH simulation 1 .pdf`
- **Code**:
  ```javascript
  // Find ANSWER KEY index
  let answerKeyStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().includes("ANSWER KEY")) {
      answerKeyStartIndex = i;
      break;
    }
  }
  ```
- **Execution**: In `CBEH simulation 1 .pdf`, line 6 of the introductory preamble reads:
  `"...predictable patterns in the answer key."`
  The substring search `lines[i].toUpperCase().includes("ANSWER KEY")` matched line 6. As a result, `answerKeyStartIndex` became 6 (lines 0–5 only), slicing out the entire exam body.
- **Empirical Result**: `parseMockExamText` returned `0` questions for `CBEH simulation 1 .pdf`. When uploaded in the app, this throws an unhandled error: `"Parsed 0 questions. Verify PDF formatting matches mock exam templates."`

### Observation 1.2: 100% Data Loss of Left Items Across All Matching Questions (`leftItems: []`)
- **File**: `app.js` (lines 2265–2344)
- **Code Structure**:
  ```javascript
  const qMatch = line.match(/^(?:#+\s*)?(?:[\*\-\+]?\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|...|Matching|...)\)?\:?\s*)?(.*)/i);
  if (qMatch && qMatch[1]) {
    // isNewQ evaluation
    if (isNewQ) {
      ...
      continue;
    }
    // <-- BUG: No else branch here!
  } else if (currentQuestion) {
    if (currentQuestion.type === "matching") {
      const conceptMatch = line.match(/^(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(.*)/);
      if (conceptMatch) currentQuestion.leftItems.push(line);
      ...
    }
  }
  ```
- **Execution**: For every matching question across all 7 simulations (e.g. Q5 in Sim 2, Q12 in Sim 3, Q5 in Sim 7), left items are formatted as `1. Concept Name`, `2. Concept Name`, `3. Concept Name`, `4. Concept Name`.
- Because each left item line starts with `\d+[\.\)]`, `if (qMatch && qMatch[1])` evaluates to `true`.
- Because `isNewQ` is `false` (e.g. `1 !== 5 + 1`), `if (isNewQ)` does not execute.
- Because `else if (currentQuestion)` is attached to `if (qMatch && qMatch[1])`, the line **never** reaches the matching handler (`conceptMatch`).
- **Empirical Result**: Every single matching question across all simulation files has `leftItems: []` (empty array) and `rightItems: [A, B, C, D]`. Matching questions are broken and non-renderable.

### Observation 1.3: Question Bloat and Answer Key Desynchronization in Simulations 5 & 6 (94 and 90 Questions)
- **File**: `app.js` (lines 2265–2275), `Mock exams/CBEH_simulation_5.pdf`, `Mock exams/CBEH_simulation_6.pdf`
- **Execution**: In Simulations 5 and 6, matching question sub-items in the exam body are numbered sequentially continuing from the question ID (e.g. Question 5 is `5. (Matching)`, and its left items are `6. Microtubules`, `7. Microfilaments`, `8. Intermediate Filaments`, `9. Thick Filaments`).
- In `app.js` line 2273:
  `const isNewQ = qMatch[2] || /^(match|evaluate|...)/i.test(promptText) || !currentQuestion || id === (currentQuestion.id + 1);`
- When `6. Microtubules` is encountered after Question 5, `id === currentQuestion.id + 1` evaluates to `6 === 5 + 1` -> `true`.
- The parser spawns fake standalone questions for sub-items `6`, `7`, `8`, `9`.
- When the next module header (`MODULE 2: HISTOLOGY`) appears, it restarts numbering at 31, creating duplicate question IDs and inflating the question count in Sim 5 to 94 questions and in Sim 6 to 90 questions.
- Furthermore, because the Answer Key is strictly 1–70 (where Question 5 has Answer 5 `1-A, 2-C, 3-B, 4-D`, and the subsequent question in Answer Key is #6), all questions in the pool are offset and receive wrong answers and explanations.

### Observation 1.4: Destruction of Fill-in-the-Gap Prompt Blanks (`________` -> ` `)
- **File**: `app.js` (line 2130)
- **Code**:
  ```javascript
  // 1. Strip section dividers (e.g. ===, ---, ___, ***)
  s = s.replace(/[=\-\_\*]{3,}/g, " ");
  ```
- **Execution**: Fill-in-the-gap prompts contain blank lines represented as `________` or `_____` (e.g. `"...is called a ________ (or Haversian system)."`).
- `s.replace(/[=\-\_\*]{3,}/g, " ")` performs a global replacement inside sentences, turning `________` into a single space.
- **Empirical Result**: Question prompts lose their fill-in-the-gap blanks entirely (e.g. `"...is called a (or Haversian system)."`).

### Observation 1.5: Truncation of Acronyms by `cleanOptionPrefix`
- **File**: `app.js` (lines 2107–2109)
- **Code**:
  ```javascript
  if (/^[A-E][A-Z][a-z]/.test(text)) {
    text = text.substring(1).trim();
  }
  ```
- **Execution**: While intended to clean glued prefixes like `"ASertoli"` or `"BActin"`, `/^[A-E][A-Z][a-z]/` matches valid biological terms starting with A–E followed by a capitalized letter and lowercase letter without punctuation, such as `"ACh receptors"` (Acetylcholine receptors), truncating it to `"Ch receptors"`.

### Observation 1.6: Summary of Empirical Results Across 7 Simulations
| Simulation File | Type | Expected Qs | Actual Parsed Qs | Interdisciplinary Qs | Status |
|---|---|---|---|---|---|
| `CBEH simulation 1 .pdf` | PDF | 70 | 0 | 0 | ❌ FAILED (Preamble Answer Key match) |
| `CBEH simulation 2.pdf` | PDF | 70 | 70 | 4 | ⚠️ Degraded (leftItems empty on all 7 matching Qs) |
| `CBEH_simulation_3.pdf` | PDF | 70 | 70 | 4 | ⚠️ Degraded (leftItems empty on all 9 matching Qs) |
| `CBEH_simulation_4.md` | MD | 70 | 70 | 4 | ⚠️ Degraded (leftItems empty on Q6) |
| `CBEH_simulation_5.pdf` | PDF | 70 | 94 | 8 | ❌ FAILED (Matching sub-items inflated to Qs) |
| `CBEH_simulation_6.pdf` | PDF | 70 | 90 | 8 | ❌ FAILED (Matching sub-items inflated to Qs) |
| `CBEH_simulation_7.md` | MD | 70 | 70 | 4 | ⚠️ Degraded (leftItems empty on all 9 matching Qs) |
| **TOTAL** | | **490** | **464** | **32 / 28** | ❌ **FAILED (26 missing, 0 on Sim 1, duplicate IDs)** |

---

## 2. Logic Chain

1. **Observation 1.1** proves that `parseMockExamText` prematurely terminates parsing on `CBEH simulation 1 .pdf` because `lines[i].toUpperCase().includes("ANSWER KEY")` matches introductory text rather than a header line (`/^\s*ANSWER KEY\b/i` or `line.trim().toUpperCase().startsWith("ANSWER KEY")`).
2. **Observation 1.2** proves that the control flow structure in `parseMockExamText` drops all numbered left items (`1.`, `2.`, `3.`, `4.`) because `qMatch` matches them, but `isNewQ` is false and there is no fallback inside the `if (qMatch && qMatch[1])` block to add them to `currentQuestion.leftItems`.
3. **Observation 1.3** proves that the unconstrained `id === currentQuestion.id + 1` condition in `isNewQ` incorrectly triggers when `currentQuestion.type === "matching"` and sub-items are numbered sequentially, breaking matching question encapsulation and corrupting question count and answer key alignment in Simulations 5 & 6.
4. **Observation 1.4** proves that unanchored divider replacement `/[=\-\_\*]{3,}/g` destroys sentence fill-in-the-gap blanks across all fill-in-the-gap questions.
5. Therefore, the worker's claim that Milestone 1 is complete and all 7 simulations parse into 490 questions with 28 Interdisciplinary questions is invalidated. The parser must be remediated.

---

## 3. Caveats

- PDF parsing in this challenge was verified using macOS Quartz/PDFKit to extract full textual representations identical to browser-side text decoding.
- Worker's unit tests in `test_js_implementation.js` and `test_runner.py` passed only because they tested exclusively against Markdown files (`CBEH_simulation_4.md` and `CBEH_simulation_7.md`) and did not assert that `leftItems` had elements.

---

## 4. Conclusion

Milestone 1 **CANNOT BE APPROVED** in its current state. 

### Required Remediations for Milestone 1:
1. **Anchor `ANSWER KEY` Header Detection**:
   In `app.js`, match only distinct header lines (e.g. `/^\s*(?:#+\s*)?ANSWER KEY\b/i` or search backwards from the end of the file) so preamble sentences mentioning "answer key" do not prematurely truncate the question list.
2. **Fix Control Flow for Matching `leftItems`**:
   Ensure lines starting with `\d+[\.\)]` that do NOT start a new question when `currentQuestion.type === "matching"` are routed to `currentQuestion.leftItems.push(line)` rather than being silently dropped.
3. **Guard Matching Sub-Item Sequence Transitions**:
   When `currentQuestion.type === "matching"` and `currentQuestion.leftItems.length < 4`, lines without an explicit question type keyword (`qMatch[2]`) or question starter words must be treated as matching left items, NOT new questions.
4. **Preserve Fill-in-the-Gap Blanks in `cleanQuestionPromptText`**:
   Replace divider lines only when matching full lines (`/^[=\-\_\*]{3,}$/`) or ensure `_{3,}` within sentences is preserved as fill-in-the-gap blanks.
5. **Safeguard Acronyms in `cleanOptionPrefix`**:
   Do not strip letters from known biological acronyms like `ACh`.

---

## 5. Verification Method

To independently verify these findings, run the following commands in terminal:

1. **Verify All 7 Simulation Files with PDFKit & App.js Parser**:
   ```bash
   osascript -l JavaScript -e '
   ObjC.import("PDFKit");
   ObjC.import("Foundation");

   const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
   const appJsData = $.NSString.stringWithContentsOfFileEncodingError($(projectRoot + "/app.js"), $.NSUTF8StringEncoding, null);
   const appJsCode = ObjC.unwrap(appJsData);

   const mockDoc = {
     body: { dataset: {} },
     getElementById: () => ({ classList: { add:()=>{}, remove:()=>{}, contains:()=>false }, style: {}, appendChild:()=>{}, addEventListener:()=>{} }),
     querySelector: () => ({ classList: { add:()=>{}, remove:()=>{}, contains:()=>false }, style: {}, appendChild:()=>{}, addEventListener:()=>{} }),
     querySelectorAll: () => [],
     createElement: () => ({ classList: { add:()=>{}, remove:()=>{}, contains:()=>false }, style: {}, appendChild:()=>{}, addEventListener:()=>{} }),
     addEventListener: (evt, cb) => { if (evt === "DOMContentLoaded") cb(); }
   };
   const mockWindow = { CBEH_QUESTIONS: [], addEventListener: () => {} };

   const testFn = new Function("window", "document", "localStorage", "console", `
     var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
     globalObj.window = window; globalObj.document = document;
     ${appJsCode}
     return { parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText };
   `);
   const { parseMockExamText } = testFn(mockWindow, mockDoc, { getItem: ()=>null, setItem: ()=>{}, removeItem: ()=>{} }, { log:()=>{}, error:()=>{}, warn:()=>{} });

   function getText(p) {
     if (p.endsWith(".pdf")) {
       const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath($(p)));
       return doc ? ObjC.unwrap(doc.string) : "";
     }
     return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(p), $.NSUTF8StringEncoding, null));
   }

   const sims = ["CBEH simulation 1 .pdf", "CBEH simulation 2.pdf", "CBEH_simulation_3.pdf", "CBEH_simulation_4.md", "CBEH_simulation_5.pdf", "CBEH_simulation_6.pdf", "CBEH_simulation_7.md"];
   sims.forEach(s => {
     const t = getText(projectRoot + "/Mock exams/" + s);
     const qs = parseMockExamText(t);
     const matchings = qs.filter(q => q.type === "matching");
     const emptyLefts = matchings.filter(q => q.leftItems.length === 0).length;
     console.log(`${s}: Parsed ${qs.length} Qs (Matching Qs: ${matchings.length}, with empty leftItems: ${emptyLefts})`);
   });
   '
   ```
   *Expected Output (demonstrating current defects)*:
   - `CBEH simulation 1 .pdf: Parsed 0 Qs`
   - `CBEH_simulation_5.pdf: Parsed 94 Qs`
   - `CBEH_simulation_6.pdf: Parsed 90 Qs`
   - `with empty leftItems: N` (all matching questions have 0 left items).
