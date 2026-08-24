# Milestone 1: Parser & Prompt Sanitization Handoff Report

## 1. Observation
1. **Unanchored Header Matching & Dropped Questions in `app.js`**:
   - In `app.js` (lines 2244–2257), `parseMockExamText` matched module header strings like `upperLine.includes("CELL BIOLOGY")` and `upperLine.includes("HISTOLOGY")` before testing whether the line was a question line or option line.
   - For question 67 in `CBEH_simulation_4.md` (`67. (Multiple Choice) In the context of cancer metastasis... which cell biology pathway is often hyperactivated...`) and question 37 in `CBEH_simulation_7.md` (`37. (Multiple Choice) The periodic acid-Schiff (PAS) stain is widely used in histology...`), the unanchored check matched `"CELL BIOLOGY"` and `"HISTOLOGY"`, triggering `continue;`, dropping those questions entirely and corrupting the current module state for subsequent questions.
2. **Premature Matching Left-Item Interception in `app.js`**:
   - In `parseMockExamText` (lines 2264–2271), an unanchored left-item check ran before `qMatch`: `if (currentQuestion && currentQuestion.type === "matching" && currentQuestion.leftItems.length < 4)`. When Question 6 in Simulation 4 (`Match the molecular chaperone...`) was classified as matching, subsequent questions 7, 8, 9, and 10 (`7. (Open Question...)`, `8. (True or False...)`, etc.) were intercepted as left items instead of new questions, dropping all four questions.
3. **Mutilation of Valid Sentence-Starting Words in `sanitizeQuestion`**:
   - The regex `q.question.replace(/^(?:and|or|the|with|in)\s+/i, "")` used a case-insensitive `/i` flag, converting `"In the context of cancer metastasis..."` to `"Context of cancer metastasis..."` and `"The primary function of..."` to `"Primary function of..."`.
4. **Prompt Keyword Overrides Overwriting Interdisciplinary Modules**:
   - In `sanitizeQuestion`, checks like `upperQ.includes("HISTOLOGY")` or `upperQ.includes("EMBRYOLOGY")` overwrote the module of Interdisciplinary questions that mentioned histology or embryology in their prompt text.
5. **Validation Test Results**:
   - Running `test_runner.py`:
     ```
     Ran 4 tests in 0.006s
     OK
     ```
   - Running JavaScript test suite `test_js_implementation.js` via JavaScriptCore:
     ```
     RESULTS: Passed: 106, Failed: 0
     SUCCESS
     ```

---

## 2. Logic Chain
1. **Guarding Header Transitions**:
   - Added guards `const isQLine = /^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]/.test(line)` and `const isOptLine = /^(?:[\*\-\+]?\s*)?[A-E][\.\)]/i.test(line)` before evaluating module headers.
   - Enhanced module header regexes to support variants: `MODULE 4`, `MODULE IV`, `PART IV`, `PART 4`, `SECTION IV`, `SECTION 4`, `INTERDISCIPLINARY`, and OCR artifacts like `HART IN0` / `HART IV`.
   - By ensuring header transitions only trigger when `!isQLine && !isOptLine`, question prompts mentioning `"cell biology"`, `"histology"`, etc. are never dropped.
2. **Eliminating Premature Left-Item Interception**:
   - Removed the duplicate left-item interceptor before `qMatch`. Numbered lines with explicit question types or matching standard question prefixes are parsed as new questions first. Left and right matching items are handled strictly within the active matching question body.
3. **Safe Iterative Prompt Cleaner (`cleanQuestionPromptText`)**:
   - Implemented an iterative cleaning loop in `cleanQuestionPromptText(text)`:
     1. Strips horizontal separator lines (`===`, `---`, `___`, `***`).
     2. Strips leaked headers (`MODULE 4: INTERDISCIPLINARY`, `TOPIC: ...`, bracket tags like `[Embryology + Histology]`).
     3. Strips redundant leading question numbers/types (`70. (Open Question - Max 200 words)`).
     4. Repeatedly strips leading punctuation/bullets (`... - : `) and orphaned conjunctions (`and`, `or`, `but`, `also`, `as well as`, `&` case-insensitive).
     5. Repeatedly strips lowercase-only preposition and article fragments (`with`, `in`, `to`, `for`, `of`, `by`, `at`, `on`, `from`, `that`, `which`, `whereas`, `while`, `because`, `the`, `a`, `an`), strictly preserving capitalized sentence starters (`"In "`, `"The "`, `"During "`, `"Loss "`, `"According "`, `"At "`).
     6. Capitalizes the first character and normalizes internal whitespace.
4. **Deterministic CBEH Blueprint Module Mapping**:
   - Implemented `getModuleFromQuestionId(id)`:
     - 1–30 -> `"Cell Biology"`
     - 31–54 -> `"Histology"`
     - 55–66 -> `"Embryology"`
     - 67–70 -> `"Interdisciplinary"`
   - Updated `sanitizeQuestion(q)` to deterministically assign `q.module = getModuleFromQuestionId(q.id)`. Removed all unanchored prompt-content keyword overrides.
5. **Upload Pipeline Integration**:
   - In `handleFilesUpload`, ensured `sanitizeQuestion(q)` is called on every parsed question alongside `cleanQuestionText(q)` before appending to `state.questionsPool`.
6. **Cross-Environment Export Safety**:
   - Assigned testing/debugging helpers to `globalContext` (`typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this)`) to support both browser DOM and automated JavaScript test runners without throwing ReferenceErrors.

---

## 3. Caveats
- PDF text extraction in automated non-browser CLI environments depends on PDF.js font table decoding when dealing with custom embedded TrueType/Type3 fonts. In the browser runtime, PDF.js provides complete text streams to `parseMockExamText`.
- No caveats regarding parser correctness or prompt sanitization logic.

---

## 4. Conclusion
Milestone 1 is complete. All 7 simulation files correctly parse into 70 questions each (490 questions total), all 28 Interdisciplinary questions (IDs 67–70 across all 7 simulations) are classified as `"Interdisciplinary"`, prompt strings are cleanly sanitized of orphaned conjunctions and leading artifacts while preserving valid capitalized opening phrases, and all 106 JavaScript unit tests pass with 0 failures.

---

## 5. Verification Method
1. **Run Automated Python Test Suite**:
   ```bash
   python3 "/Users/alessandronicoletti11/Desktop/exam simulator/.agents/teamwork_preview_explorer_survey_3_r1/test_runner.py"
   ```
   *Expected Output*: `Ran 4 tests ... OK`
2. **Run Native JavaScriptCore Test Suite**:
   ```bash
   osascript -l JavaScript "/Users/alessandronicoletti11/Desktop/exam simulator/.agents/worker_m1/test_js_implementation.js"
   ```
   *Expected Output*: `RESULTS: Passed: 106, Failed: 0 -> SUCCESS`
3. **Inspect Modified Files**:
   - `/Users/alessandronicoletti11/Desktop/exam simulator/app.js` (lines 2115–2350, 2570–2590, 4095–4115).
