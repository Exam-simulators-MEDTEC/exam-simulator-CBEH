## 2026-08-24T06:44:29Z
You are a Worker agent assigned to Milestone 1: Parser & Prompt Sanitization for the CBEH Exam Simulator.

Working directory: /Users/alessandronicoletti11/Desktop/exam simulator/.agents/worker_m1
Project root: /Users/alessandronicoletti11/Desktop/exam simulator
Original Request: /Users/alessandronicoletti11/Desktop/exam simulator/.agents/ORIGINAL_REQUEST.md
Scope & Architecture: /Users/alessandronicoletti11/Desktop/exam simulator/PROJECT.md
Explorer Reports:
- /Users/alessandronicoletti11/Desktop/exam simulator/.agents/teamwork_preview_explorer_survey_1/analysis.md
- /Users/alessandronicoletti11/Desktop/exam simulator/.agents/teamwork_preview_explorer_survey_3_r1/analysis.md
Test Runner:
- /Users/alessandronicoletti11/Desktop/exam simulator/.agents/teamwork_preview_explorer_survey_3_r1/test_runner.py

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope / File Ownership:
You own `app.js` (specifically `parseMockExamText`, `sanitizeQuestion`, and `handleFilesUpload`).

Requirements for Milestone 1:
1. Standard CBEH ID range fallback:
   - Implement `getModuleFromQuestionId(id)` helper: 1–30 -> "Cell Biology", 31–54 -> "Histology", 55–66 -> "Embryology", 67–70 -> "Interdisciplinary".
2. Header detection in `parseMockExamText`:
   - Guard module header detection so it NEVER matches lines that are question prompts or option lines (e.g. `!isQLine && !isOptLine`).
   - Recognize module header variants: `MODULE 4`, `MODULE IV`, `PART IV`, `PART 4`, `SECTION IV`, `SECTION 4`, `INTERDISCIPLINARY`, `HART IN0`, etc.
   - When a question object is finalized, if no module was set by header, assign module via `getModuleFromQuestionId(q.id)`.
3. `sanitizeQuestion(q)` enhancements:
   - For question IDs 1–70, enforce module classification using standard CBEH ranges (specifically IDs 67–70 -> "Interdisciplinary").
   - Remove unanchored keyword overrides on prompt content (`upperQ.includes("HISTOLOGY")` etc.) that misclassify questions.
   - Clean prompt text: strip leaked module headers (`MODULE 4: INTERDISCIPLINARY`, `TOPIC: ...`).
   - Implement iterative/looping orphan cleaner that strips leading punctuation/bullets and orphaned conjunctions (`and`, `or`, `but`, `also`, `as well as`, `&`) and lowercase-only fragment prepositions (`with`, `in`, `to`, `for`, `of`, `by`, `at`, `on`, `from`, `that`, `which`), while strictly PRESERVING capitalized legitimate phrases like `In the context of...` and `The primary function...`.
4. In `handleFilesUpload`, ensure `sanitizeQuestion(q)` is called on every parsed question before adding to pool.
5. Verification:
   - Run python/node tests against simulation files and test runner to confirm that all 7 simulation files parse to exactly 490 questions, all 28 Interdisciplinary questions (IDs 67–70) are classified as Interdisciplinary, and prompt strings are cleaned correctly.
6. Write your handoff report to `/Users/alessandronicoletti11/Desktop/exam simulator/.agents/worker_m1/handoff.md` and send a message when complete.
