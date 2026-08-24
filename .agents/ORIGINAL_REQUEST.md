# Original User Request

## 2026-08-24T07:28:19Z

This is a single self-contained fix; keep it small and focused.

Enhance the CBEH Exam Simulator web application located in `/Users/alessandronicoletti11/Desktop/exam simulator` by fixing open question review card UI aesthetics and enforcing strict, bug-proof question categorization based on question position (1–70).

Working directory: `/Users/alessandronicoletti11/Desktop/exam simulator`
Integrity mode: development

## Requirements

### R1. Clean, Aesthetic Review Card Layout & Elimination of Vertical Overlaps
- Redesign open question grading cards and review cards in `app.js` and `index.css` so that question numbers, module names, and question text do not overlap or wrap awkwardly.
- Move question metadata (Question ID, Module Badge, Question Type) into a clean horizontal top header bar spanning the full width of the card.
- Replace cramped vertical buttons (`Incorrect (0 pts)` / `Correct (1 pt)`) on open question cards with spacious horizontal action buttons aligned cleanly under the model answer.

### R2. Strict Bug-Proof Question Number Module Categorization (1–70 Rule)
- Make question parsing and module assignment completely deterministic based ONLY on question position within each 70-question simulation set:
  - Questions 1–30 = **Cell Biology**
  - Questions 31–54 = **Histology**
  - Questions 55–66 = **Embryology**
  - Questions 67–70 = **Interdisciplinary**
- Harden `parseMockExamText` and `sanitizeQuestion` so that numbers inside matching lists (e.g. `1. Zygote`), option texts, scale ratings, or statements are never mis-parsed as main question starts.
- Ensure every parsed 70-question simulation maps contiguously to IDs 1..70 and strictly inherits module categories by position.

## Acceptance Criteria

### Verification & Functionality
- [ ] No review card has vertical text, squeezed column buttons, or overlapping text elements.
- [ ] Question number, module name, and type pills render in a clean top horizontal bar on every review card.
- [ ] All 7 uploaded simulations yield exactly 210 Cell Biology, 168 Histology, 84 Embryology, and 28 Interdisciplinary questions in the master database pool.
- [ ] Sub-item numbers inside matching or cluster questions do not create extra question cards or alter the 70-question count per simulation.
- [ ] Code passes syntax validation and preserves saved state.

## 2026-08-24T16:56:38Z

This is a single self-contained feature; keep it small and focused.

Build an "Exam Analytics & Weak Spot Breakdown Dashboard" for the CBEH Exam Simulator web application in `/Users/alessandronicoletti11/Desktop/exam simulator`.

Working directory: `/Users/alessandronicoletti11/Desktop/exam simulator`
Integrity mode: development

## Requirements

### R1. Cumulative Performance & Module Weak-Spot Dashboard
- Provide an interactive Analytics / Performance Dashboard on the welcome screen (or dedicated tab) that aggregates historical simulation attempt records from `localStorage` (`cbeh_history`).
- Calculate and display key cumulative metrics:
  - Total Exams Taken, Overall Pass Rate (%), and Average Overall Score (%).
  - Module-by-Module Accuracy Breakdown: Percentage accuracy across Cell Biology, Histology, Embryology, and Interdisciplinary.
  - Dedicated "Weak Spot Alert" / "Focus Areas" section highlighting any module scoring below threshold (e.g. < 60% or lowest performing module) with actionable study recommendations.

### R2. Visual Score Trends & Attempt History Log
- Display a score trend timeline / progress history list showing recent exam dates, modes, total scores, pass/fail badges, and module breakdown chips.
- Include an option to clear or reset exam history safely with confirmation.

## Acceptance Criteria

### Verification & Functionality
- [ ] Analytics dashboard correctly aggregates all attempts recorded in `localStorage.getItem("cbeh_history")`.
- [ ] Module accuracy percentages accurately calculate cumulative correct answers over total questions asked per module.
- [ ] The lowest-scoring module (< 60% threshold or relative minimum) is highlighted clearly in a Weak Spot recommendation card.
- [ ] Attempt history renders timestamps, scores, and pass/fail status cleanly.
- [ ] If no exam history exists, a clean empty state with a "Take your first exam" prompt is displayed.
- [ ] UI matches the existing dark glassmorphic design system and passes syntax validation.
