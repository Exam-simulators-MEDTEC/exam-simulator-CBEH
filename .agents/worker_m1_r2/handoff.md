# Milestone 1: Worker M1 (Iteration 2) Handoff Report

## Verdict: RESOLVED / READY_FOR_REVIEW

---

## 1. Observation

Adversarial execution and regression testing against `app.js` across all 7 CBEH mock exam simulations (`Mock exams/*`) and test suites (`test_empirical_challenger.js`, `test_all_mock_exams_empirical.py`) verified the resolution of all empirical failure modes:

### 1.1 Matching Question Left Items Handled Accurately
- **Observation**: In `app.js` `parseMockExamText`, when `currentQuestion && currentQuestion.type === "matching" && currentQuestion.leftItems.length < 4`, lines beginning with numbers (e.g. `1. Protein Kinase A (PKA)`, `6. Microtubules`) without explicit question type tags are now routed to `currentQuestion.leftItems.push(line)` rather than being silently dropped or inflating the question count into duplicate/phantom questions.
- **Empirical Proof**:
  - `CBEH simulation 1 .pdf`: 4/4 Matching questions populated with non-empty `leftItems`.
  - `CBEH simulation 2.pdf`: 7/7 Matching questions populated with non-empty `leftItems`.
  - `CBEH_simulation_3.pdf`: 9/9 Matching questions populated with non-empty `leftItems`.
  - `CBEH_simulation_5.pdf`: 6/6 Matching questions populated with non-empty `leftItems`.
  - `CBEH_simulation_6.pdf`: 5/5 Matching questions populated with non-empty `leftItems`.
  - `CBEH_simulation_7.md`: 9/9 Matching questions populated with non-empty `leftItems`.
  - `test_empirical_challenger.js` Suite 4 Q68: Parsed with 4 `leftItems` and 4 `rightItems`.

### 1.2 Answer Key Header Detection Anchored Against Preambles
- **Observation**: Replaced substring check `lines[i].toUpperCase().includes("ANSWER KEY")` with anchored regex:
  `/^(?:#{1,3}\s*)?(?:(?:PART|SECTION)\s+(?:5|V)\b|CORRECT\s+ANSWERS\b|ANSWER\s+KEY\b)/i`
- **Empirical Proof**:
  - `CBEH simulation 1 .pdf`: Introductory preamble on line 6 mentioning `"...predictable patterns in the answer key."` is ignored. The true section header on line 353 (`"ANSWER KEY"`) is detected, parsing all 70 questions without premature truncation.

### 1.3 Strict Preservation of Fill-in-the-Gap Blanks (`________`)
- **Observation**:
  - Replaced destructive global divider replacement `/[=\-\_\*]{3,}/g` in `cleanQuestionPromptText` with line-anchored divider removal `s.replace(/^(?:[=\-\*]{3,}\s*)+/, "")` and `s.replace(/^(?:[=\-\_\*]{3,}\s*)+(?=(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)])/, "")`.
  - Fixed prompt cleaner leading punctuation regex from `^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s=]+` to `^[\:\.\,\-\–—\*\•\#\>\~\]\)\/\s=]+` (omitting `\_`) to protect question prompts that begin directly with an underline blank (`________ glands lack a duct system...`).
  - Fixed unconstrained `[^)]*` consumption in question type header stripping to prevent eating text up to subsequent parentheticals (e.g. `(sgRNA)`, `(hormones)`).
- **Empirical Proof**:
  - All 13 Fill-in-the-Gap questions in `CBEH_simulation_4.md`, all 13 in `CBEH_simulation_7.md`, all 11 in `CBEH simulation 1 .pdf`, all 11 in `CBEH simulation 2.pdf`, all 11 in `CBEH_simulation_3.pdf`, all 12 in `CBEH_simulation_5.pdf`, and all 13 in `CBEH_simulation_6.pdf` retain their blanks (`________`).

### 1.4 Chained-Loop Logic Fixed for Conjunction & Preposition Stripping
- **Observation**:
  - In `cleanQuestionPromptText`, orphaned leading conjunctions (`and`, `or`, `but`, `also`, `as well as`, `&`) are cleanly stripped with `/^(?:and|or|but|also|as well as|&)(?:\s+|$)/i` without cascading into subsequent valid interrogatives or articles (`which of the following`, `the presence of`, `the second meiotic arrest`, `the blood-brain barrier`).
- **Empirical Proof**:
  - `68. or which of the following signaling cascades...` -> `"Which of the following signaling cascades regulates stem cell self-renewal?"` (Test Case 22 PASS).
  - `69. but the presence of Nissl bodies...` -> `"The presence of Nissl bodies in neurons indicates active protein synthesis."` (Test Case 23 PASS).
  - `70. also the second meiotic arrest...` -> `"The second meiotic arrest occurs at metaphase II."` (Test Case 24 PASS).
  - `70. as well as the blood-brain barrier...` -> `"The blood-brain barrier which is formed by astrocyte end-feet."` (Test Case 25 PASS).
  - Pure conjunction inputs (e.g. `"and and and and and"`) return `""` (Test Case 47 PASS).
  - Pure preposition chains (e.g. `"in with to for of by at on"`) return `""` (Test Case 48 PASS).

### 1.5 Question Type Normalization & Cluster Answer Ingestion
- **Observation**:
  - Questions labeled `(Multiple Choice - Matching)` or `(Multiple Choice)` are classified as `multiple-choice` when they possess standard choices A–E.
  - In `parseMockExamText`, True/False Cluster questions now support both separate-line answers (`A) True`, `B) False`) and inline answer keys (`6. A-True, B-False, C-True, D-True`) with bullet prefix matching (`o A) True`, `• A) True`).
  - Standardized 70-question simulation alignment so that questions 1–70 match Answer Key items 1–70 across all simulations without ID drift or missing answers.

---

## 2. Logic Chain

1. **Matching Ingestion**:
   - `qMatch` captures lines starting with numbers.
   - When inside a matching question and `leftItems.length < 4`, unless the line carries an explicit question type header (`hasTypeTag`), it is identified as a concept item and pushed to `currentQuestion.leftItems`.
   - Once 4 left items are collected, subsequent option lines `A.` through `D.` are routed to `rightItems`.
   - When the next question starts (e.g. `6. (True or False Cluster)` or `10. (True or False Cluster)`), `hasTypeTag` is true, encapsulating and pushing the completed matching question.

2. **Divider and Blank Preservation**:
   - Underline blanks `________` only represent fill-in-the-gap blanks when inside sentences or at the start of a fill-in prompt.
   - Restricting divider stripping to non-underscore bars (`[=\-\*]{3,}`) and underscore bars preceding question numbers prevents any alteration of prompt blanks.

3. **Conjunction Stripping Without Over-Stripping**:
   - Orphaned conjunctions are stripped at the start of prompts.
   - Common interrogatives and determiners (`which of the following`, `the`, `a`, `in vivo`) are preserved as valid sentence starts.
   - Only nonsensical multi-preposition prefixes (e.g. `with in for of by...`) are stripped.

4. **Empirical Validation**:
   - Running the test suites directly against `app.js` demonstrates 100% test pass on all unit assertions and all 7 real mock exam files.

---

## 3. Caveats

- In `test_all_mock_exams_empirical.py`, the Python test harness was updated to use macOS PDFKit text extraction to match browser PDF text decoding, ensuring reliable validation of PDF mock exam files.
- All core application logic changes are contained within `app.js`.

---

## 4. Conclusion

- Milestone 1 (Parser & Prompt Sanitization) is complete, robust, and verified across all 7 mock exam simulations:
  - **490 / 490 Total Questions Parsed (100%)**
  - **28 / 28 Interdisciplinary Questions (IDs 67–70 across all 7 simulations)**
  - **0 Empty Matching Left Items**
  - **0 Missing Fill-in-the-Gap Blanks**
  - **552 / 552 Challenger Unit Tests Passing (0 Failures)**

---

## 5. Verification Method

To independently verify these results:

1. **Run Challenger Test Suite (JavaScriptCore / osascript)**:
   ```bash
   osascript -l JavaScript "/Users/alessandronicoletti11/Desktop/exam simulator/test_empirical_challenger.js"
   ```
   *Result*: `Passed: 552, Failed: 0. SUCCESS`.

2. **Run Full Mock Exam Empirical Suite (Python / PDFKit)**:
   ```bash
   python3 "/Users/alessandronicoletti11/Desktop/exam simulator/test_all_mock_exams_empirical.py"
   ```
   *Result*: All 7 simulations pass with exactly 70 questions each (total 490 questions, 28 interdisciplinary questions, all matching questions populated, all fill-in blanks preserved).
