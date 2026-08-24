# Original User Request

## 2026-08-24T06:35:44Z

<USER_REQUEST>
Audit and enhance the CBEH Exam Simulator web application located in `/Users/alessandronicoletti11/Desktop/exam simulator` to fix Interdisciplinary question misclassification and add a compact review pagination UI on the Exam Results page.

Working directory: `/Users/alessandronicoletti11/Desktop/exam simulator`
Integrity mode: development

## Requirements

### R1. Interdisciplinary Question Categorization & Parser Audit
- Ensure all 70-question simulations correctly categorize Questions 67–70 as `Interdisciplinary` (expecting 28 total Interdisciplinary questions across 7 uploaded simulations).
- Enhance `parseMockExamText` and `sanitizeQuestion` to fallback-classify questions by standard CBEH ID ranges (1–30 Cell Biology, 31–54 Histology, 55–66 Embryology, 67–70 Interdisciplinary) and handle header variants (`MODULE 4`, `MODULE IV`, `PART IV`, `INTERDISCIPLINARY`).
- Sanitize question prompts to clean truncated leading words (e.g. `70. and cellular energy...`).

### R2. "Show More" Review Pagination & Compact Action Buttons on Results Page
- On the Exam Results page (`screen-results`), initially display a preview of 3 questions in the review list.
- Position a "Show More Questions" toggle button and primary action buttons (**Return Home**, **Retake Another Exam**, **Download Study Summary (PDF)**) directly below the initial preview cards.
- Clicking "Show More Questions" reveals the full list of remaining question review cards without needing to scroll to the bottom of the page.

## Acceptance Criteria

### Verification & Functionality
- [ ] Uploading or sanitizing the 7 simulation files results in exactly 28 Interdisciplinary questions in the question database (4 per simulation).
- [ ] No question prompt starts with orphaned leading words like `and cellular energy...`.
- [ ] On the results review tab, only 3 question cards are initially visible, followed by "Show More Questions" and the navigation buttons.
- [ ] Clicking "Show More Questions" displays all review questions smoothly.
- [ ] Code passes syntax validation and preserves all local storage state.
</USER_REQUEST>
