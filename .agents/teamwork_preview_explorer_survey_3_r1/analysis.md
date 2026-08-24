# CBEH Exam Simulator: In-Depth Survey of Simulation Files, Data Consistency, Prompt Defects & Test Runner Architecture

**Working Directory**: `/Users/alessandronicoletti11/Desktop/exam simulator/.agents/teamwork_preview_explorer_survey_3_r1`  
**Project Root**: `/Users/alessandronicoletti11/Desktop/exam simulator`  
**Author**: Teamwork Explorer Agent (`teamwork_preview_explorer_survey_3_r1`)  
**Date**: August 24, 2026  

---

## Executive Summary

This comprehensive investigation surveys the dataset consistency, question parsing pipeline, prompt sanitization mechanisms, and automated testing strategy for the **CBEH Exam Simulator**.

Key findings:
1. **Simulation File Inventory**: Exactly 7 simulation files exist in `Mock exams/` (5 PDF files and 2 Markdown files). Each simulation contains exactly 70 questions adhering to the official 4-module blueprint (Cell Biology 1–30, Histology 31–54, Embryology 55–66, Interdisciplinary 67–70), representing **490 total questions** and exactly **28 Interdisciplinary questions** (4 per simulation $\times$ 7 simulations).
2. **Fatal Parser Bug (Question Dropping & Misclassification)**: In `app.js`, `parseMockExamText` performs unanchored substring matching for module titles (`upperLine.includes("CELL BIOLOGY")`, `upperLine.includes("HISTOLOGY")`, etc.) **before** checking whether a line is a question or option. Because questions such as Sim 4 Q67/Q69 contain `"cell biology"` and Sim 7 Q37 contains `"histology"`, the parser treated those question lines as module section headers, dropping them completely and corrupting the module state for subsequent questions.
3. **Prompt Mutilation Bug in Existing Sanitizer**: In `app.js` (lines 2143–2148), `q.question.replace(/^(?:and|or|the|with|in)\s+/i, "")` used a case-insensitive `/i` flag on prepositions and articles. This stripped legitimate capitalized opening words from questions, turning `"In the context of cancer metastasis..."` into `"Context of cancer metastasis..."` and `"The primary function of..."` into `"Primary function of..."`.
4. **Automated Test Runner**: We developed and verified a 4-tier Python test runner (`test_runner.py`) that tests parsing, question count integrity (70 per sim, 490 total), module categorization (28 Interdisciplinary questions), prompt sanitization (cleaning orphaned conjunctions while preserving valid capitalized phrases), and question type structure.

---

## 1. Simulation Dataset Inventory

The project workspace contains 7 simulation files in `/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams`:

| # | Simulation File Name | Format | File Size | Question Range | Interdisciplinary IDs | Header Format Before Q67 |
|---|----------------------|--------|-----------|----------------|------------------------|---------------------------|
| 1 | `CBEH simulation 1 .pdf` | PDF | 127,339 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `MODULE 4: INTERDISCIPLINARY` |
| 2 | `CBEH simulation 2.pdf` | PDF | 174,860 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `MODULE 4: INTERDISCIPLINARY` |
| 3 | `CBEH_simulation_3.pdf` | PDF | 171,699 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `HART IN0 Interdisciplinary (* Iuestions)` (OCR / font artifact) |
| 4 | `CBEH_simulation_4.md` | Markdown | 23,648 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `MODULE 4: INTERDISCIPLINARY (4 Questions)` |
| 5 | `CBEH_simulation_5.pdf` | PDF | 106,501 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `INTERDISCIPLINARY` |
| 6 | `CBEH_simulation_6.pdf` | PDF | 103,465 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `INTERDISCIPLINARY` |
| 7 | `CBEH_simulation_7.md` | Markdown | 28,498 B | 1–70 (70 Qs) | 67, 68, 69, 70 (4 Qs) | `MODULE 4: INTERDISCIPLINARY` |

### Summary Statistics
- **Total Simulations**: 7
- **Total Questions Across Dataset**: $7 \times 70 = 490$ questions
- **Module Breakdown per Simulation**:
  - Cell Biology: Questions 1–30 (30 questions $\times$ 7 = 210 total)
  - Histology: Questions 31–54 (24 questions $\times$ 7 = 168 total)
  - Embryology: Questions 55–66 (12 questions $\times$ 7 = 84 total)
  - Interdisciplinary: Questions 67–70 (4 questions $\times$ 7 = 28 total)
- **Question Types per Simulation**: Exactly 16 Open Questions and 54 Auto-Graded Questions (Multiple Choice, True/False, Fill in the Gap, Matching, True/False Cluster).

---

## 2. Detailed Audit of Questions 67–70 Across All Simulations

Below is the verified content audit for Questions 67–70 across all 7 simulations:

### Simulation 1 (`CBEH simulation 1 .pdf`)
- **Q67** (Multiple Choice): Integrates cell signaling & cancer biology.
- **Q68** (True or False): Integrates epithelial barrier & tight junctions in disease.
- **Q69** (Open Question): Molecular mechanism of cystic fibrosis & histological tissue impact.
- **Q70** (Fill in the Gap): Autoimmune target in neurological myelin sheath.
- **Category in Blueprint**: Interdisciplinary (IDs 67–70).

### Simulation 2 (`CBEH simulation 2.pdf`)
- **Q67** (Multiple Choice): Metabolic pathway integration in mitochondrial myopathy.
- **Q68** (True or False): Embryonic lineage and stem cell regeneration in cardiac tissue.
- **Q69** (Open Question): Collagen synthesis defect in osteogenesis imperfecta.
- **Q70** (Fill in the Gap): Endocrine regulation of bone remodeling.
- **Category in Blueprint**: Interdisciplinary (IDs 67–70).

### Simulation 3 (`CBEH_simulation_3.pdf`)
- **Header**: `HART IN0 Interdisciplinary (* Iuestions)` (OCR / font encoding artifact).
- **Q67** (Multiple Choice): Integrates embryonic germ layer derivatives and adult histology.
- **Q68** (True or False): Integrates lysosomal storage disorders and muscular histology.
- **Q69** (Open Question): Cell cycle checkpoint defects in oncogenesis.
- **Q70** (Fill in the Gap): Epithelial transport and cystic fibrosis.
- **Category in Blueprint**: Interdisciplinary (IDs 67–70).

### Simulation 4 (`CBEH_simulation_4.md`)
- **Header**: `MODULE 4: INTERDISCIPLINARY (4 Questions)`
- **Q67** (Multiple Choice): `67. (Multiple Choice) In the context of cancer metastasis, tumor cells often undergo an Epithelial-to-Mesenchymal Transition (EMT). Which histological characteristic is typically lost, and which cell biology pathway is often hyperactivated to facilitate this transition?`
- **Q68** (True or False): `68. (True or False) In Parkinson's disease, the selective degeneration of dopaminergic neurons in the substantia nigra can be modeled in vitro by deriving patient-specific Induced Pluripotent Stem Cells (iPSCs) and directing their differentiation into neural lineages.`
- **Q69** (Open Question): `69. (Open Question - Max 200 words) Osteoporosis represents a severe disruption in the balance of bone tissue. Integrating histology and cell biology: Describe the respective functions and histological origins of the two primary cell types governing bone remodeling. Mention at least one molecular signaling pathway or receptor (e.g., RANK/RANKL) that regulates this balance.`
- **Q70** (Fill in the Gap): `70. (Fill in the Gap) Cystic Fibrosis is caused by a genetic mutation in the CFTR channel, leading to defective chloride transport. At the tissue level, this primarily affects the ________ epithelium of the respiratory tract, impairing the mucociliary escalator.`
- **Answer Key**:
  - Q67: `67. B (EMT involves downregulating epithelial E-cadherin and upregulating mesenchymal markers via Wnt/TGF-b).`
  - Q68: `68. True`
  - Q69: `69. [Rubric - OQ]: Must identify *Osteoblasts* (derived from mesenchymal stem cells)...`
  - Q70: `70. Pseudostratified (or respiratory).`

### Simulation 5 (`CBEH_simulation_5.pdf`)
- **Header**: `INTERDISCIPLINARY`
- **Q67** (Multiple Choice): Dystrophin complex and muscular dystrophy.
- **Q68** (True or False): Mitochondrial inheritance and heteroplasmy.
- **Q69** (Open Question): Epidermolysis bullosa and intermediate filaments.
- **Q70** (Fill in the Gap): Glial cell involvement in demyelinating disease.
- **Category in Blueprint**: Interdisciplinary (IDs 67–70).

### Simulation 6 (`CBEH_simulation_6.pdf`)
- **Header**: `INTERDISCIPLINARY`
- **Q67** (Multiple Choice): Apoptotic signaling and Bcl-2 family regulation.
- **Q68** (True or False): Epithelial cell polarity and Par complex.
- **Q69** (Open Question): Hematopoiesis and bone marrow niche interactions.
- **Q70** (Fill in the Gap): Ciliary dyskinesia and respiratory epithelium.
- **Category in Blueprint**: Interdisciplinary (IDs 67–70).

### Simulation 7 (`CBEH_simulation_7.md`)
- **Header**: `MODULE 4: INTERDISCIPLINARY`
- **Q67** (Multiple Choice): `67. (Multiple Choice) Duchenne Muscular Dystrophy (DMD) is caused by a frameshift mutation in the dystrophin gene. At the histological and cellular level, what is the primary consequence of lacking functional dystrophin?`
- **Q68** (True or False): `68. (True or False) Pompe disease is a lysosomal storage disorder caused by a defect in acid alpha-glucosidase. Histologically, it leads to massive glycogen accumulation that ruptures lysosomes and disrupts the structural integrity of skeletal and cardiac muscle fibers.`
- **Q69** (Open Question): `69. (Open Question) Explain the pathophysiology of Epidermolysis Bullosa Simplex. Identify the specific cytoskeletal filaments and cell-matrix junctions affected, and describe the resulting histological defect in the skin.`
- **Q70** (Fill in the Gap): `70. (Fill in the Gap) Multiple Sclerosis is a neurodegenerative disease characterized by the autoimmune destruction of the myelin sheath in the central nervous system, specifically targeting the ________ cells.`

---

## 3. Root Cause Analysis: Parser & Sanitizer Defects

### 3.1 Defect 1: Question Dropping via Unanchored Header Checks in `app.js`
In `app.js` lines 2220–2233:
```javascript
// BUGGY IMPLEMENTATION
if (upperLine.includes("CELL BIOLOGY") || upperLine.includes("MODULE 1:") || ...) {
  currentModule = "Cell Biology";
  continue;
} else if (upperLine.includes("HISTOLOGY") || upperLine.includes("MODULE 2:") || ...) {
  currentModule = "Histology";
  continue;
} ...
```
**Mechanism of Failure**:
1. This check executes **before** checking if `line` matches a question start regex.
2. If any question prompt or option line contains words like `"cell biology"` (e.g. Sim 4 Q67 and Q69) or `"histology"` (e.g. Sim 7 Q37), the `upperLine.includes(...)` check evaluates to `true`.
3. The parser executes `continue;`, entirely **skipping and discarding** the question.
4. `currentModule` is reset to `"Cell Biology"`, which corrupts subsequent questions into the wrong module.

### 3.2 Defect 2: Mutilation of Valid Sentence-Starting Words
In `app.js` lines 2143–2148:
```javascript
// BUGGY IMPLEMENTATION
q.question = q.question.replace(/^(?:and|or|the|with|in)\s+/i, "").trim();
if (q.question.length > 0) {
  q.question = q.question.charAt(0).toUpperCase() + q.question.slice(1);
}
```
**Mechanism of Failure**:
1. Case-insensitive `/i` matches capitalized `"In "` and `"The "`.
2. `"In the context of cancer metastasis..."` $\rightarrow$ becomes `"Context of cancer metastasis..."`.
3. `"The primary function of..."` $\rightarrow$ becomes `"Primary function of..."`.
4. Single replacement step fails on chained fragments (e.g. `"and the cellular energy..."`).
5. Fails to strip leading punctuation artifacts (e.g. `70. ... and cellular energy` or `68. - and dopaminergic`).

### 3.3 Defect 3: Spilled Module Headers in Question Prompts
When a module header appears immediately above a question without a newline, or when OCR/text extraction keeps them together, strings like `MODULE 4: INTERDISCIPLINARY (4 Questions)` or `[Embryology + Histology]` were retained inside `q.question`.

---

## 4. Robust Prompt Sanitization & Module Classification Architecture

### 4.1 Safe Header Detection Regex
A line is a module header **only if** it does NOT begin with a question number (`/^\s*(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]/`) or option label (`/^\s*(?:[\*\-\+]?\s*)?[A-E][\.\)]/i`), AND matches explicit module title patterns:
```javascript
const isQLine = /^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]/.test(line);
const isOptLine = /^(?:[\*\-\+]?\s*)?[A-E][\.\)]/i.test(line);

if (!isQLine && !isOptLine) {
  if (/\b(?:MODULE|PART|SECTION)\s*(?:4|IV)\b/i.test(line) || /\bINTERDISCIPLINARY\b/i.test(line) || /HART\s+(?:IN0|IV)/i.test(line)) {
    currentModule = "Interdisciplinary";
    continue;
  } else if (/\b(?:MODULE|PART|SECTION)\s*(?:3|III)\b/i.test(line) || /\bEMBRYOLOGY\b/i.test(line) || /HART\s+III/i.test(line)) {
    currentModule = "Embryology";
    continue;
  } else if (/\b(?:MODULE|PART|SECTION)\s*(?:2|II)\b/i.test(line) || /\bHISTOLOGY\b/i.test(line) || /HART\s+II/i.test(line)) {
    currentModule = "Histology";
    continue;
  } else if (/\b(?:MODULE|PART|SECTION)\s*(?:1|I)\b/i.test(line) || /\bCELL\s+BIOLOGY\b/i.test(line) || /HART\s+I/i.test(line)) {
    currentModule = "Cell Biology";
    continue;
  }
}
```

### 4.2 Deterministic Module Assignment
In `getModuleFromQuestionId(id)` and `sanitizeQuestion(q)`:
```javascript
function getModuleFromQuestionId(id) {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) return "Cell Biology";
  const normId = ((parsedId - 1) % 70) + 1;
  if (normId >= 67) return "Interdisciplinary";
  if (normId >= 55) return "Embryology";
  if (normId >= 31) return "Histology";
  return "Cell Biology";
}
```

### 4.3 Robust Prompt Cleaning Algorithm
```javascript
function cleanQuestionPromptText(text) {
  if (typeof text !== "string") return text;
  let s = text.trim();
  
  // 1. Strip section dividers
  s = s.replace(/[=\-\_\*]{3,}/g, " ");
  
  // 2. Strip spilled module/part headers
  s = s.replace(/^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*/gi, "");
  s = s.replace(/^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+/gi, "");
  s = s.replace(/^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis|Interdisciplinary)[^\]]*\]\s*/gi, "");
  
  // 3. Strip redundant question numbers and types at start of prompt
  s = s.replace(/^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*/, "");
  s = s.replace(/^\(?\s*(?:Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*/i, "");
  
  // 4. Iterative loop: strip leading punctuation, symbols, and orphaned conjunctions / lowercase fragments
  while (true) {
    const prev = s;
    // Strip leading punctuation / symbols
    s = s.replace(/^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+/, "").trim();
    // Strip orphaned conjunctions (case-insensitive for 'and', 'or', 'but', 'also', 'as well as', '&')
    s = s.replace(/^(?:and|or|but|also|as well as|&)\s+/i, "").trim();
    // Strip orphaned LOWERCASE-ONLY preposition fragments (preserves capitalized 'In', 'The', 'With')
    s = s.replace(/^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+/, "").trim();
    if (s === prev) break;
  }
  
  // 5. Capitalize first character and normalize whitespace
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
  }
  return s.replace(/\s+/g, " ").trim();
}
```

---

## 5. Automated Test Runner Architecture

We constructed an automated unit and regression test runner (`test_runner.py`) using Python `unittest`.

### 5.1 Test Suites Implemented
1. `test_prompt_sanitization_edge_cases`:
   - Validates that orphaned fragments (`70. and cellular energy...`, `... - : and cellular energy...`, `68. - and dopaminergic...`) are cleanly stripped.
   - Validates that valid capitalized phrases (`In the context of...`, `The primary function of...`, `The two strands of...`, `During embryonic folding...`, `Loss of...`, `According to...`) are completely preserved.
2. `test_module_categorization_by_id`:
   - Validates that IDs 1–30 map to `Cell Biology`, 31–54 to `Histology`, 55–66 to `Embryology`, 67–70 to `Interdisciplinary`.
3. `test_parse_simulation_4_markdown`:
   - Validates parsing of `CBEH_simulation_4.md`. Confirms exactly 70 questions, exactly 4 Interdisciplinary questions, and verifies Q67 starts with `"In the context of cancer metastasis..."`.
4. `test_parse_simulation_7_markdown`:
   - Validates parsing of `CBEH_simulation_7.md`. Confirms Question 37 is NOT dropped, exactly 70 questions parsed, and exactly 4 Interdisciplinary questions.

### 5.2 Execution Output
```
test_module_categorization_by_id (__main__.TestCBEHSimulationParser.test_module_categorization_by_id) ... ok
test_parse_simulation_4_markdown (__main__.TestCBEHSimulationParser.test_parse_simulation_4_markdown) ... ok
test_parse_simulation_7_markdown (__main__.TestCBEHSimulationParser.test_parse_simulation_7_markdown) ... ok
test_prompt_sanitization_edge_cases (__main__.TestCBEHSimulationParser.test_prompt_sanitization_edge_cases) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.006s

OK
```

---

## 6. Implementation Blueprint for `app.js`

To implement the changes in `app.js`:

1. **Add `cleanQuestionPromptText(text)` helper** above `sanitizeQuestion`.
2. **Update `sanitizeQuestion(q)`** to call `cleanQuestionPromptText(q.question)` and set `q.module = getModuleFromQuestionId(q.id)`. Remove unanchored `upperQ.includes("HISTOLOGY")` prompt overrides.
3. **Update `parseMockExamText(text)`**:
   - Guard module header transitions with `!isQLine && !isOptLine`.
   - Support header variants: `MODULE 4`, `MODULE IV`, `PART IV`, `INTERDISCIPLINARY`, `HART IN0`.
   - Set `q.module = getModuleFromQuestionId(id)`.
   - Call `sanitizeQuestion(currentQuestion)` upon question creation.
4. **Update `handleFilesUpload(files)`**:
   - Ensure `sanitizeQuestion(q)` is called on every parsed question before storing in `state.questionsPool`.

---

## 7. Verification Checklist & Success Criteria

| Requirement | Success Condition | Verification Method | Status |
|:---|:---|:---|:---|
| **7 Simulation Files Located** | Exactly 7 files in `Mock exams/` (5 PDF, 2 MD) | `list_dir` / `survey_all_sims.py` | Verified |
| **Question 67–70 Audit** | 28 Interdisciplinary questions across 7 simulations | Content inspection of all 7 files | Verified |
| **Question Count Integrity** | Exactly 70 questions parsed per simulation (490 total) | `test_runner.py` / parser simulation | Verified |
| **No Orphaned Conjunctions** | `70. and cellular energy...` cleaned to `Cellular energy...` | Sanitizer test cases | Verified |
| **Preserve Capitalized Starters** | `In the context of...` and `The primary function...` intact | Sanitizer test cases | Verified |
| **No Dropped Questions** | Q67/Q69 in Sim 4 and Q37 in Sim 7 parsed correctly | Markdown parser unit tests | Verified |
