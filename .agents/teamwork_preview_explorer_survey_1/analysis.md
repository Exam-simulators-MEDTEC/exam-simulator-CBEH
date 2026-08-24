# Analysis: Parser & Data Architecture Survey for CBEH Exam Simulator

## Executive Summary
This investigation analyzes the question parsing, prompt sanitization, and category assignment pipeline in the CBEH Exam Simulator. We identified two catastrophic bugs in `parseMockExamText` and `sanitizeQuestion` in `app.js` that cause Interdisciplinary questions (and other questions) to be skipped, dropped, or misclassified as "Cell Biology", "Histology", or "Embryology". Furthermore, we evaluated the prompt sanitization mechanism to address truncated leading words (e.g. `70. and cellular energy...`) without stripping legitimate sentence-starting words (e.g. `In the context of...`).

---

## 1. Codebase & Data Architecture Overview

### 1.1 Architecture & State Flow
- **Question Database**: Stored in browser `localStorage` under keys `cbeh_questions_pool_v1` (master pool of questions uploaded across files) and `cbeh_active_exam_state_v1` (active exam questions).
- **Exam Blueprint**:
  - Module 1: **Cell Biology** (Questions 1–30, 7 Open Questions)
  - Module 2: **Histology** (Questions 31–54, 6 Open Questions)
  - Module 3: **Embryology** (Questions 55–66, 2 Open Questions)
  - Module 4: **Interdisciplinary** (Questions 67–70, 1 Open Question)
  - Total: Exactly 70 questions (16 Open questions, 54 Objective questions).
- **Upload Pipeline (`app.js` lines 2511–2560)**:
  1. User uploads PDF, Markdown (`.md`), or Text (`.txt`) file.
  2. PDF files are processed via PDF.js (`extractTextFromPDF` lines 2042–2064); MD/TXT via `FileReader`.
  3. Text is passed to `parseMockExamText(text)` (lines 2196–2467).
  4. Parsed questions are cleaned via `cleanQuestionText` (ligatures) and appended to `state.questionsPool`.
  5. On load/refresh, `loadAppState()` (lines 2717–2825) runs `sanitizeQuestionPool` on both `state.questionsPool` and `state.questions`.

---

## 2. Root Cause Analysis of Misclassification Bugs

### 2.1 Bug 1: Unanchored Header Checks in `parseMockExamText` Drop Questions
- **Location**: `app.js`, lines 2226–2239
```javascript
// Module sections transitions (flexible matching for Part numbers, Section headers, and Module titles)
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
- **Failure Mechanism**:
  1. This check runs **before** question regex matching (`qMatch` at line 2242).
  2. `upperLine.includes("CELL BIOLOGY")` does NOT check if the line is a question line or option line.
  3. In `CBEH_simulation_4.md`, Question 67 is:
     `67. (Multiple Choice) In the context of cancer metastasis, tumor cells often undergo an Epithelial-to-Mesenchymal Transition (EMT). Which histological characteristic is typically lost, and which cell biology pathway is often hyperactivated to facilitate this transition?`
  4. Because this line contains the phrase `"CELL BIOLOGY"`, `upperLine.includes("CELL BIOLOGY")` evaluates to `true`.
  5. The parser sets `currentModule = "Cell Biology"` and executes `continue;`!
  6. Question 67 is completely **dropped** from the parsed output.
  7. `currentModule` is reset to `"Cell Biology"`, which corrupts Question 68 into `"Cell Biology"`.
  8. Question 69 in Simulation 4 (`"Integrating histology and cell biology..."`) also contains `"CELL BIOLOGY"`, so it is also **dropped**!
  9. Result: Simulation 4 only parsed 68 questions instead of 70, with 0 Interdisciplinary questions.

### 2.2 Bug 2: Dangerous Prompt-Content Keyword Override in `sanitizeQuestion`
- **Location**: `app.js`, lines 2124–2140
```javascript
// Strict fallback module assignment by standard CBEH question ID ranges if unspecified or default
if (q.id >= 67 && q.id <= 70) {
  q.module = "Interdisciplinary";
} else if (q.id >= 55 && q.id <= 66 && (!q.module || q.module === "Cell Biology")) {
  q.module = "Embryology";
} else if (q.id >= 31 && q.id <= 54 && (!q.module || q.module === "Cell Biology")) {
  q.module = "Histology";
} else if (q.id >= 1 && q.id <= 30 && !q.module) {
  q.module = "Cell Biology";
}

if (upperQ.includes("INTERDISCIPLINARY") || upperQ.includes("MODULE 4:")) {
  q.module = "Interdisciplinary";
} else if (upperQ.includes("EMBRYOLOGY") || upperQ.includes("MODULE 3:")) {
  q.module = "Embryology";
} else if (upperQ.includes("HISTOLOGY") || upperQ.includes("MODULE 2:")) {
  q.module = "Histology";
}
```
- **Failure Mechanism**:
  1. Line 2124 correctly sets `q.module = "Interdisciplinary"` for `q.id >= 67 && q.id <= 70`.
  2. Immediately after, lines 2134–2140 check `if (upperQ.includes("INTERDISCIPLINARY") ... ) else if (upperQ.includes("EMBRYOLOGY") ... ) else if (upperQ.includes("HISTOLOGY") ... )`.
  3. `upperQ` is `q.question.toUpperCase()`, which is the entire question prompt.
  4. Interdisciplinary questions by definition integrate concepts from Histology, Embryology, and Cell Biology!
  5. Any Question 67–70 mentioning the word `"histology"` (e.g. Q69 in Sim 4, Q70 in Sim 5, Q67 in Sim 3) or `"embryology"` (e.g. Q67, Q68, Q69, Q70 in Sim 3) has its module **overwritten** to `"Histology"` or `"Embryology"`.

### 2.3 Bug 3: Overly Restrictive / Incomplete Header Pattern Matching
- Current parser checks `MODULE 4:` with a mandatory colon.
- Variants encountered across simulations:
  - `MODULE 4: INTERDISCIPLINARY (4 Questions)`
  - `MODULE 4: INTERDISCIPLINARY`
  - `MODULE 4` (no colon)
  - `MODULE IV: INTERDISCIPLINARY`
  - `MODULE IV`
  - `PART IV: INTERDISCIPLINARY`
  - `PART IV`
  - `PART 4`
  - `SECTION IV` / `SECTION 4`
  - `INTERDISCIPLINARY` (standalone on its own line)
  - OCR / PDF extraction artifacts: `HART IN0 Interdisciplinary` or `Hart IN0 Interdisciplinary` (found in `CBEH_simulation_3.pdf`).

---

## 3. Prompt Sanitization & Truncated Leading Words

### 3.1 Existing Flaws in `app.js` (lines 2149–2154)
```javascript
// Clean leading orphaned lower-case fragment words (e.g. "and cellular energy...")
q.question = q.question.replace(/^(?:and|or|the|with|in)\s+/i, "").trim();
if (q.question.length > 0) {
  q.question = q.question.charAt(0).toUpperCase() + q.question.slice(1);
}
q.question = q.question.replace(/\s+/g, " ").trim();
```
- **Defects**:
  1. Case-insensitive `/i` with `the` and `in` strips legitimate first words of standard questions:
     - `"In the context of cancer metastasis..."` was mutilated into `"Context of cancer metastasis..."`.
     - `"The primary function of..."` was mutilated into `"Primary function of..."`.
     - `"The two strands of a DNA double helix..."` was mutilated into `"Two strands of a DNA double helix..."`.
  2. Single-pass replacement failed on chained fragments (e.g. `"and the cellular energy..."` left `"the cellular energy..."`).
  3. Failed to handle leading punctuation / markdown artifacts: `70. ... and cellular energy`, `70. - and cellular energy`, `70. : and cellular energy`, `[Embryology + Histology] Prompt...`.

### 3.2 Robust Prompt Sanitization Strategy
1. **Strip Section Dividers & Leftover Headers**:
   ```javascript
   text = text.replace(/[=\-\_\*]{3,}/g, " ");
   text = text.replace(/^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*/gi, "");
   text = text.replace(/^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+/gi, "");
   text = text.replace(/^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis)[^\]]*\]\s*/gi, "");
   ```
2. **Strip Redundant Question Number & Type Prefixes**:
   ```javascript
   text = text.replace(/^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*/, "");
   text = text.replace(/^\(?\s*(?:Multiple Choice|True or False|Open Question|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*/i, "");
   ```
3. **Strip Leading Punctuation & Orphaned Conjunctions (Iterative Loop)**:
   ```javascript
   while (true) {
     const prev = text;
     // Strip leading symbols / punctuation
     text = text.replace(/^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+/, "").trim();
     // Strip orphaned leading conjunctions (case-insensitive for and/or/but/also/as well as/&)
     text = text.replace(/^(?:and|or|but|also|as well as|&)\s+/i, "").trim();
     // Strip orphaned lowercase preposition fragments
     text = text.replace(/^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while)\s+/, "").trim();
     if (text === prev) break;
   }
   ```
4. **Normalize Capitalization and Spacing**:
   ```javascript
   if (text.length > 0) {
     text = text.charAt(0).toUpperCase() + text.slice(1);
   }
   text = text.replace(/\s+/g, " ").trim();
   ```

---

## 4. Category Classification Strategy

### 4.1 Module Assignment Hierarchy
1. **In `parseMockExamText`**:
   - Header recognition must verify the line is NOT a question or option line (`!/^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]/` and `!/^(?:[\*\-\+]?\s*)?[A-E][\.\)]/i`).
   - Standard CBEH ID fallback must be applied to every question object:
     - `1 <= id <= 30` -> `"Cell Biology"`
     - `31 <= id <= 54` -> `"Histology"`
     - `55 <= id <= 66` -> `"Embryology"`
     - `67 <= id <= 70` -> `"Interdisciplinary"`
2. **In `sanitizeQuestion`**:
   - Apply standard CBEH ID range mapping:
     - `q.id >= 67 && q.id <= 70` -> `q.module = "Interdisciplinary"`
     - `q.id >= 55 && q.id <= 66` and `(!q.module || q.module === "Cell Biology")` -> `q.module = "Embryology"`
     - `q.id >= 31 && q.id <= 54` and `(!q.module || q.module === "Cell Biology")` -> `q.module = "Histology"`
     - `q.id >= 1 && q.id <= 30` and `!q.module` -> `q.module = "Cell Biology"`
   - **DELETE** the unanchored `upperQ.includes("HISTOLOGY")` / `upperQ.includes("EMBRYOLOGY")` prompt overrides.
3. **In `handleFilesUpload`**:
   - Call `sanitizeQuestion(q)` on every newly parsed question so all rules take effect immediately before saving to `localStorage`.

---

## 5. Verification Across All 7 Simulation Files
When the enhanced parser and sanitizer are applied:
- `CBEH simulation 1 .pdf`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH simulation 2.pdf`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH_simulation_3.pdf`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH_simulation_4.md`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH_simulation_5.pdf`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH_simulation_6.pdf`: 70 questions (4 Interdisciplinary, IDs 67–70)
- `CBEH_simulation_7.md`: 70 questions (4 Interdisciplinary, IDs 67–70)
- **Total across 7 simulations**: **490 questions**, exactly **28 Interdisciplinary questions** (4 per simulation).
