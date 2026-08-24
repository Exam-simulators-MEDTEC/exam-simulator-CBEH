# Milestone 1 Challenger Handoff Report: Parser & Prompt Sanitization

**Verdict**: `REQUEST_CHANGES`

---

## 1. Observation

Adversarial stress-testing and empirical execution of `test_empirical_challenger.js` and `test_all_mock_exams_empirical.py` on `/Users/alessandronicoletti11/Desktop/exam simulator/app.js` revealed **5 distinct empirical failure modes / bugs**:

### 1.1 [CRITICAL] Dropped Left-Items in Matching Questions (`parseMockExamText`)
- **File & Lines**: `app.js` lines 2265–2345
- **Direct Observation**:
  In `parseMockExamText`, when a matching question contains numbered left-hand items (e.g. `1. Protein Kinase A (PKA)`, `2. Protein Kinase C (PKC)`), the line is matched by `qMatch` (`/^(?:#+\s*)?(?:[\*\-\+]?\s*)?(\d+)[\.\)].../`).
  Inside `if (qMatch && qMatch[1])`, `isNewQ` evaluates to `false` because `1 !== (currentQuestion.id + 1)` and the prompt doesn't start with new-question trigger keywords.
  Because there is no `else` block inside `if (qMatch && qMatch[1])`, the line is **silently ignored and discarded**. It never reaches the `else if (currentQuestion)` block where `conceptMatch` is handled.
- **Empirical Proof**:
  In `CBEH_simulation_7.md`, all 9 matching questions (Q5, Q11, Q19, Q29, Q35, Q43, Q51, Q59, Q66) produce `leftItems: []`. When rendered in the exam UI, the left matching column is completely blank, rendering these questions unanswerable.

### 1.2 [CRITICAL] Fill-in-the-Gap Blanks Erased by Global Divider Regex (`cleanQuestionPromptText`)
- **File & Lines**: `app.js` line 2130:
  ```javascript
  // 1. Strip section dividers (e.g. ===, ---, ___, ***)
  s = s.replace(/[=\-\_\*]{3,}/g, " ");
  ```
- **Direct Observation**:
  The global `/g` flag replaces any sequence of 3 or more underscores (`_____`), dashes (`---`), or asterisks anywhere in the prompt with a space.
- **Empirical Proof**:
  - `cleanQuestionPromptText("70. (Fill in the gap): Microtubules are composed of polymers of _____ and beta-tubulin.")`
    Returns: `"Microtubules are composed of polymers of and beta-tubulin."` (gap `_____` erased).
  - All 13 Fill-in-the-Gap questions in `CBEH_simulation_4.md` (Q4, Q10, Q16, Q22, Q27, Q34, Q40, Q44, Q49, Q54, Q62, Q66, Q70) and all 13 in `CBEH_simulation_7.md` (Q4, Q9, Q15, Q20, Q25, Q34, Q39, Q45, Q49, Q54, Q58, Q64, Q70) have their underline blanks completely destroyed.

### 1.3 [HIGH] Over-aggressive Consecutively Stripped Articles/Interrogatives (`cleanQuestionPromptText`)
- **File & Lines**: `app.js` lines 2143–2152:
  ```javascript
  while (true) {
    const prev = s;
    s = s.replace(/^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+/, "").trim();
    s = s.replace(/^(?:and|or|but|also|as well as|&)\s+/i, "").trim();
    s = s.replace(/^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+/, "").trim();
    if (s === prev) break;
  }
  ```
- **Direct Observation**:
  When a question prompt starts with an orphaned conjunction (e.g. `or`, `but`, `also`, `as well as`), the conjunction is stripped on loop iteration 1. On subsequent loop iterations, because the next words are lowercase, the cleaner sequentially strips valid English articles, interrogatives, and prepositions (`which`, `of`, `the`, `in`, `to`, `for`).
- **Empirical Proof**:
  - `68. or which of the following signaling cascades...` -> Strips `or`, then `which`, then `of`, then `the` -> Result: `"Following signaling cascades..."` (mutilated question prompt).
  - `69. but the presence of Nissl bodies...` -> Strips `but`, then `the` -> Result: `"Presence of Nissl bodies..."`.
  - `70. also the second meiotic arrest...` -> Strips `also`, then `the` -> Result: `"Second meiotic arrest..."`.
  - `70. as well as the blood-brain barrier...` -> Strips `as well as`, then `the` -> Result: `"Blood-brain barrier..."`.

### 1.4 [MEDIUM] Regex Word Boundary Requires Trailing Space (`cleanQuestionPromptText`)
- **File & Lines**: `app.js` lines 2148–2150
- **Direct Observation**:
  The regexes `replace(/^(?:and|or|but|also|as well as|&)\s+/i, "")` and `replace(/^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+/, "")` require `\s+` (trailing whitespace). If a prompt consists solely of orphaned conjunctions or prepositions (e.g. `"and and and"` or `"with in at"`), the last word has no trailing whitespace and is not removed, returning `"And"` or `"At"`.

### 1.5 [MEDIUM] `(Multiple Choice - Matching)` Misclassification (`parseMockExamText`)
- **File & Lines**: `app.js` line 2282:
  ```javascript
  if (typeStr.includes("matching") || /^match\b/i.test(promptText)) type = "matching";
  ```
- **Direct Observation**:
  In `CBEH_simulation_4.md`, Question 6 header is `6. (Multiple Choice - Matching)`. Because `typeStr.includes("matching")` matches before `multiple-choice`, it is parsed as `type = "matching"`. However, its answer key is a single letter `6. D (BiP is a prominent...)` and options are standard A–D choices. Because it is classified as `matching`, it fails to store options as choices, leaving `leftItems: []` and no answer.

---

## 2. Logic Chain

1. **Matching Item Parser Logic**:
   - `line.match(/^\d+[\.\)]/)` captures both main questions (`5. (Matching)...`) and left concept items (`1. Protein Kinase A`).
   - When a numbered left item is read, `isNewQ` is evaluated. Because `id !== currentQuestion.id + 1` (e.g. 1 !== 6), `isNewQ` is false.
   - Without an `else` clause inside `if (qMatch && qMatch[1])`, any line matching `qMatch` that fails `isNewQ` is dropped on the floor.
   - Consequently, all numbered left items in all matching questions across any mock exam are lost.

2. **Divider vs Fill-in Blank Collision**:
   - In markdown and text representations, Fill-in-the-Gap questions denote missing words with `________` (underscores).
   - Using `s = s.replace(/[=\-\_\*]{3,}/g, " ")` with `/g` applies the divider replacement globally to the question body, obliterating every gap blank in the exam.

3. **Iterative Cleaning Loop Flaw**:
   - The loop in `cleanQuestionPromptText` does not distinguish between a true orphaned leading prefix and the remainder of a valid grammatical sentence once the leading conjunction is removed.
   - Because `which`, `of`, `the` are in the lowercase word list and follow lowercase in a sentence fragment, the while loop cascades and deletes them all sequentially.

---

## 3. Caveats

- Module mapping (`getModuleFromQuestionId`) and unanchored header guards for question prompts (preventing questions mentioning "histology", "embryology", "cell biology" from being dropped) were verified to work accurately.
- Capitalized opening phrases (`In vivo`, `The following`, `During`, `Loss of`, `According to`, `At physiological pH`, `Because`, `Whereas`, `While`) are properly preserved when not preceded by conjunctions.
- This challenger report tests the JavaScript engine directly via `osascript -l JavaScript` against `app.js`.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Worker M1 must address the following required fixes:

1. **Fix `parseMockExamText` matching item ingestion**:
   In `app.js` (inside `if (qMatch && qMatch[1])`), if `!isNewQ` and `currentQuestion && currentQuestion.type === "matching"`, push `line` to `currentQuestion.leftItems` instead of dropping it.
2. **Fix `cleanQuestionPromptText` divider stripping**:
   Change divider stripping from global `/[=\-\_\*]{3,}/g` to line-anchored `/^[=\-\_\*]{3,}\s*/` so that `________` fill-in blanks inside question prompts are preserved.
3. **Fix `cleanQuestionPromptText` article/interrogative over-stripping**:
   Do not iteratively strip `which`, `of`, `the`, `in`, `for` in a loop after conjunction removal. Ensure words like `which`, `of`, `the` in `"or which of the following..."` or `"but the presence of..."` are retained once the initial `or ` / `but ` is stripped.
4. **Fix regex word boundary**:
   Change `\s+` to `(?:\s+|$)` in word boundary regexes so trailing single words are stripped if the entire prompt consists of conjunctions.
5. **Fix Multiple Choice - Matching classification**:
   Ensure questions labeled `(Multiple Choice - Matching)` or `(Multiple Choice)` with options A–E are classified as `multiple-choice`.

---

## 5. Verification Method

To independently verify all findings and validate fixes:

1. **Run Empirical Challenger Test Suite**:
   ```bash
   osascript -l JavaScript "/Users/alessandronicoletti11/Desktop/exam simulator/test_empirical_challenger.js"
   ```
   *Current Result*: `Passed: 541, Failed: 11` (Reproduces all 5 bugs).
   *Expected Result after fixes*: `Passed: 552, Failed: 0 (SUCCESS)`.

2. **Run Full Mock Exam Parser Suite**:
   ```bash
   python3 "/Users/alessandronicoletti11/Desktop/exam simulator/test_all_mock_exams_empirical.py"
   ```
   *Current Result*: Shows `leftItems: []` on all 9 matching questions in Simulation 7 and destroyed blanks across all Fill-in-the-Gap questions.
   *Expected Result after fixes*: All matching questions have non-empty `leftItems`, and all Fill-in-the-Gap prompts retain `________` blanks.
