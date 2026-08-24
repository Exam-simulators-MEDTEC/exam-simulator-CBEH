# Project: CBEH Exam Simulator Enhancement

## Architecture
- Client-side Single Page Application (HTML5, Vanilla JS, CSS3).
- Data Flow:
  1. Exam Upload & Parsing: `handleFilesUpload` -> `parseMockExamText` -> `sanitizeQuestion` -> `state.questionsPool` -> `localStorage["cbeh_questions_pool_v1"]`.
  2. Question Generation & Exam Engine: `generateExam` / `startExamMode` -> `renderQuestion` -> `submitAnswer` -> `calculateScores`.
  3. Results & Self-Grading: `calculateScores` -> `initializeSelfGradingList` (16 open questions) & `renderAutoReviewCard` (54 auto questions) -> `applyReviewListPagination`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Standard ID Range Module Fallback | Deterministically classify questions 1–30 Cell Biology, 31–54 Histology, 55–66 Embryology, 67–70 Interdisciplinary | M1 | ORIGINAL_REQUEST R1 |
| 2 | Robust Header Detection | Parse `MODULE 4`, `MODULE IV`, `PART IV`, `INTERDISCIPLINARY`, and OCR variants without dropping question lines | M1 | ORIGINAL_REQUEST R1 |
| 3 | Remove Prompt Keyword Overrides | Prevent `upperQ.includes("HISTOLOGY")` in `sanitizeQuestion` from misclassifying Interdisciplinary prompts | M1 | ORIGINAL_REQUEST R1 |
| 4 | Safe Iterative Prompt Sanitization | Strip orphaned conjunctions and fragments (e.g. `70. and cellular energy...` -> `Cellular energy...`) while preserving `In the...` and `The...` | M1 | ORIGINAL_REQUEST R1 |
| 5 | Review Card Pagination Selector Fix | Fix class selector in `applyReviewListPagination` to include `.review-item-card` so auto-graded review tab paginates 3 preview cards | M2 | ORIGINAL_REQUEST R2 |
| 6 | Compact Action Buttons Below Preview | Place "Show More Questions" and primary action buttons (Return Home, Retake Another Exam, Download Study Summary (PDF)) directly below the 3 preview cards | M2 | ORIGINAL_REQUEST R2 |
| 7 | Seamless Toggle Interaction & State | Clicking "Show More Questions" smoothly expands all review cards; state persists across scoring recalculations | M2 | ORIGINAL_REQUEST R2 |
| 8 | 28 Interdisciplinary Verification & Regression Test Suite | Verify all 7 simulation files parse to 490 questions with exactly 28 Interdisciplinary questions (4 per sim) and 100% test pass | M3 | ORIGINAL_REQUEST AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Parser & Prompt Sanitization | Refactor `parseMockExamText`, `sanitizeQuestion`, and `handleFilesUpload` in `app.js` | None | IN_PROGRESS |
| 2 | Results Screen UI Pagination & Compact Actions | Fix `applyReviewListPagination`, update layout & styling in `app.js`, `index.html`, and `index.css` | M1 | PLANNED |
| 3 | E2E Verification & Forensic Integrity Audit | Execute automated test runner, verify 28 Interdisciplinary questions across 7 sims, verify UI behavior, and run Forensic Integrity Audit | M1, M2 | PLANNED |

## Code Layout
- `app.js`: Core exam engine, parser, sanitizers, results rendering, and pagination logic.
- `index.html`: DOM structure for simulator screens, header, navbar, results tabs, and controls.
- `index.css`: Design system, screen transitions, review list styling, compact action button styling.
- `Mock exams/`: 7 CBEH simulation mock exam files (5 PDF, 2 MD).
- `test_runner.py` / tests: Automated verification test suites.

## Interface Contracts
### `parseMockExamText(text, fileName)` -> `Array<Question>`
- Line-by-line parser.
- Guarantees lines matching question/option regex are never dropped by header detection.
- Normalizes module header matches.
- Returns normalized question objects with fallback module classification by ID range.

### `sanitizeQuestion(q)` -> `Question`
- Enforces module assignment based on ID when in range 1–70 (67–70 -> "Interdisciplinary").
- Strips leaked module headers from prompt text.
- Strips orphaned conjunctions and leading artifacts iteratively while preserving capital words (`In...`, `The...`).
- Guarantees no keyword overrides overwrite `q.module`.

### `applyReviewListPagination(listContainerId)` -> `void`
- Matches `.review-item-card`, `.grading-item-card`, and `.question-card`.
- Displays initial preview of 3 cards.
- Injects `.review-pagination-control` containing toggle button ("Show More Questions (N remaining)") and compact primary action buttons.
