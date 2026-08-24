# Handoff Report: Parser & Data Architecture Investigation

## 1. Observation

1. **Unanchored Header Matching Drops Questions in `parseMockExamText`**:
   - File: `/Users/alessandronicoletti11/Desktop/exam simulator/app.js`, Lines 2226–2239:
     ```javascript
     if (upperLine.includes("CELL BIOLOGY") || upperLine.includes("MODULE 1:") || upperLine.includes("PART I:") || upperLine.includes("PART 1:") || upperLine.includes("SECTION I") || upperLine.includes("SECTION 1")) {
       currentModule = "Cell Biology";
       continue;
     } else if (upperLine.includes("HISTOLOGY") || upperLine.includes("MODULE 2:") || upperLine.includes("PART II:") || upperLine.includes("PART 2:") || upperLine.includes("SECTION II") || upperLine.includes("SECTION 2")) {
       currentModule = "Histology";
       continue;
     } else if (upperLine.includes("EMBRYOLOGY") || upperLine.includes("MODULE 3:") || upperLine.includes("PART III:") || upperLine.includes("PART 3:") || upperLine.includes("SECTION III") || upperLine.includes("SECTION 3")) {
       currentModule = "Embryology";
       continue;
     } else if (upperLine.includes("INTERDISCIPLINARY") || upperLine.includes("MODULE 4:") || upperLine.includes("PART IV:") || upperLine.includes("PART 4:") || upperLine.includes("SECTION IV") || upperLine.includes("SECTION 4")) {
       currentModule = "Interdisciplinary";
       continue;
     }
     ```
   - In `/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_4.md`, Line 252:
     `67. (Multiple Choice) In the context of cancer metastasis, tumor cells often undergo an Epithelial-to-Mesenchymal Transition (EMT). Which histological characteristic is typically lost, and which cell biology pathway is often hyperactivated to facilitate this transition?`
   - Because Line 252 contains `"cell biology"`, `upperLine.includes("CELL BIOLOGY")` matched, set `currentModule = "Cell Biology"`, executed `continue;`, and completely dropped Question 67 from the parsed exam. Similarly, Question 69 (Line 260) containing `"Integrating histology and cell biology"` was dropped, resulting in only 68 questions parsed and 0 Interdisciplinary questions.

2. **Dangerous Keyword Override in `sanitizeQuestion` Misclassifies Questions**:
   - File: `/Users/alessandronicoletti11/Desktop/exam simulator/app.js`, Lines 2134–2140:
     ```javascript
     if (upperQ.includes("INTERDISCIPLINARY") || upperQ.includes("MODULE 4:")) {
       q.module = "Interdisciplinary";
     } else if (upperQ.includes("EMBRYOLOGY") || upperQ.includes("MODULE 3:")) {
       q.module = "Embryology";
     } else if (upperQ.includes("HISTOLOGY") || upperQ.includes("MODULE 2:")) {
       q.module = "Histology";
     }
     ```
   - When a Question 67–70 prompt contains the word `"histology"` (e.g. Q69 in Sim 4, Q70 in Sim 5, Q67 in Sim 3) or `"embryology"` (e.g. Q67–70 in Sim 3), `upperQ.includes("HISTOLOGY")` or `upperQ.includes("EMBRYOLOGY")` evaluates to `true` and overwrites `q.module` to `"Histology"` or `"Embryology"`, overriding the ID range assignment.

3. **Overly Broad Leading Word Stripping Mutilates Valid Questions**:
   - File: `/Users/alessandronicoletti11/Desktop/exam simulator/app.js`, Line 2150:
     ```javascript
     q.question = q.question.replace(/^(?:and|or|the|with|in)\s+/i, "").trim();
     ```
   - Using `/i` with `the` and `in` strips legitimate English openings like `"In the context of cancer metastasis..."` -> `"Context of cancer metastasis..."`, and `"The primary function..."` -> `"Primary function..."`.

4. **Missing Header Variants in Module Detection**:
   - In `app.js` line 2236, `upperLine.includes("MODULE 4:")` requires a colon, failing on `MODULE 4`, `MODULE IV`, `PART IV`, `SECTION IV`, or standalone `INTERDISCIPLINARY` headers.
   - In `Mock exams/CBEH_simulation_3.pdf`, PDF extraction yielded font artifact `HART IN0 Interdisciplinary`. In `CBEH_simulation_5.pdf` and `6.pdf`, `MODULE` and `INTERDISCIPLINARY` appear on separate lines.

5. **Master Pool & Persistence Lifecycle**:
   - `handleFilesUpload` (lines 2541–2558) pushes parsed questions to `state.questionsPool` and saves via `saveQuestionsPool()` to `localStorage["cbeh_questions_pool_v1"]`.
   - `loadAppState()` (lines 2717–2825) sanitizes both `state.questionsPool` and `state.questions` on startup.

---

## 2. Logic Chain

1. **Premise**: CBEH Blueprint specifies standard 70-question exams partitioned into 1–30 Cell Biology, 31–54 Histology, 55–66 Embryology, and 67–70 Interdisciplinary.
2. **Observation 1** shows that `parseMockExamText` currently tests lines for module names before testing for question patterns. Any question prompt containing `"Cell Biology"`, `"Histology"`, or `"Embryology"` gets caught by the header transition check and discarded via `continue;`, resetting `currentModule` for all following questions.
3. **Observation 2** shows that `sanitizeQuestion` checks `upperQ.includes("HISTOLOGY")` and `upperQ.includes("EMBRYOLOGY")` on the prompt string, overwriting the module for interdisciplinary questions that mention those subjects.
4. **Inference**: Therefore, module header matching in `parseMockExamText` MUST guard against question and option lines (e.g. `!/^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]/` and `!/^(?:[\*\-\+]?\s*)?[A-E][\.\)]/i`), and `sanitizeQuestion` MUST remove the prompt-content keyword overwrite.
5. **Observation 3** shows that `/^(?:and|or|the|with|in)\s+/i` strips `"In "` and `"The "` from valid prompts.
6. **Inference**: Prompt cleaning must only strip orphaned conjunctions (`and`, `or`, `but`, `&`) or lowercase fragment prepositions (`with`, `in`, `to`, `for`, `of`, `by`, `at`, `on`, `from`, `that`, `which`), and must loop to clean chained fragments while preserving capitalized words like `"In "` and `"The "`.

---

## 3. Caveats

- **Caveat 1**: Custom non-standard exams uploaded by users that do not follow 70-question CBEH blueprints will rely on explicit module headers. If headers are present, header detection takes priority; if absent, standard ID range fallback applies.
- **Caveat 2**: All 7 simulation files in `Mock exams/` (5 PDFs, 2 MDs) follow the 70-question format. With these fixes, exactly 28 Interdisciplinary questions (4 per file) are guaranteed.

---

## 4. Conclusion

To achieve 100% accurate classification (28 Interdisciplinary questions across 7 simulations) and clean prompt sanitization:
1. **Refactor `parseMockExamText` Module Detection**:
   - Ensure header check ignores lines matching question regex or option regex.
   - Expand regex to recognize `MODULE 4`, `MODULE IV`, `PART IV`, `PART 4`, `SECTION IV`, `SECTION 4`, `INTERDISCIPLINARY`, and OCR variants (`HART IN0`).
   - Assign fallback module by question ID (1–30 Cell Biology, 31–54 Histology, 55–66 Embryology, 67–70 Interdisciplinary).
2. **Refactor `sanitizeQuestion`**:
   - Enforce ID-based module assignment (67–70 -> Interdisciplinary).
   - Eliminate prompt-content keyword overrides (`upperQ.includes("HISTOLOGY")`, etc.).
   - Strip spilled headers and topic tags from `q.question`.
   - Implement looping orphan cleaner that removes leading punctuation and orphaned conjunctions/lowercase fragments (`and cellular energy...` -> `Cellular energy...`) while preserving legitimate capitalized phrases (`In the context of...`).
3. **Update Upload Handler**:
   - In `handleFilesUpload`, call `sanitizeQuestion(q)` on every newly parsed question before saving.

---

## 5. Verification Method

1. **Automated Verification Script**:
   Run python/node verification script parsing all 7 simulation files in `Mock exams/`:
   ```bash
   python3 -c "
   # Parse and verify all 7 simulation files
   # Assert total parsed == 490 questions
   # Assert total Interdisciplinary == 28 questions (IDs 67-70 in every simulation)
   # Assert no prompt begins with orphaned 'and ', 'or ', etc.
   # Assert prompts starting with 'In the...' and 'The...' are preserved
   "
   ```
2. **Browser Validation**:
   - Upload all 7 files from `Mock exams/` via the web UI.
   - Inspect `state.questionsPool` in browser devtools:
     - `state.questionsPool.length` == 490
     - `state.questionsPool.filter(q => q.module === "Interdisciplinary").length` == 28
   - Start an "Interdisciplinary Focus" exam and verify all 20 selected questions have `module === "Interdisciplinary"`.
   - Check Results Screen review tab to verify clean prompts without orphaned prefixes.
