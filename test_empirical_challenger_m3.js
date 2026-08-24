// Milestone 3 Master E2E Empirical Verification & Adversarial Stress Suite
// Executed via JavaScriptCore (osascript -l JavaScript)

function runMilestone3Verification() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
  // Read app.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  let passed = 0;
  let failed = 0;
  const failureReports = [];

  const mockConsole = {
    log: function(msg) { $.NSFileHandle.fileHandleWithStandardOutput.writeData($(msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
    error: function(msg) { $.NSFileHandle.fileHandleWithStandardError.writeData($("ERR: " + msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
    warn: function(msg) { $.NSFileHandle.fileHandleWithStandardError.writeData($("WARN: " + msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); }
  };

  function assert(condition, message, details) {
    if (condition) {
      passed++;
    } else {
      failed++;
      failureReports.push({ message: message, details: details || "Assertion failed" });
      mockConsole.error("FAIL: " + message + (details ? " | " + details : ""));
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual === expected) {
      passed++;
    } else {
      failed++;
      const detail = "Expected: " + JSON.stringify(expected) + " | Got: " + JSON.stringify(actual);
      failureReports.push({ message: message, details: detail });
      mockConsole.error("FAIL: " + message + " -> " + detail);
    }
  }

  mockConsole.log("================================================================================");
  mockConsole.log("        MILESTONE 3: COMPREHENSIVE E2E & ADVERSARIAL STRESS SUITE");
  mockConsole.log("================================================================================");

  // Helper to extract text from PDF via PDFKit
  function extractPdfText(filePath) {
    ObjC.import("PDFKit");
    ObjC.import("Foundation");
    const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(filePath));
    return doc ? ObjC.unwrap(doc.string) : "";
  }

  // DOM Mock Implementation
  class MockElement {
    constructor(tagName = "div") {
      this.tagName = tagName.toUpperCase();
      this.id = "";
      this.classList = {
        _classes: new Set(),
        add: (...cls) => { cls.forEach(c => this.classList._classes.add(c)); },
        remove: (...cls) => { cls.forEach(c => this.classList._classes.delete(c)); },
        contains: (c) => this.classList._classes.has(c),
        toggle: (c) => {
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            return false;
          } else {
            this.classList._classes.add(c);
            return true;
          }
        }
      };
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.children = [];
      this.parentElement = null;
      this._textContent = "";
      this._innerHTML = "";
      this.listeners = {};
    }

    get textContent() {
      if (this._textContent) return this._textContent;
      if (this._innerHTML) return this._innerHTML.replace(/<[^>]+>/g, "");
      return this.children.map(c => c.textContent).join(" ");
    }
    set textContent(val) {
      this._textContent = val;
    }

    get className() { return Array.from(this.classList._classes).join(" "); }
    set className(val) {
      this.classList._classes.clear();
      if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList._classes.add(c));
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
    }

    setAttribute(name, val) { this.attributes[name] = String(val); }
    getAttribute(name) { return this.attributes[name] || null; }
    removeAttribute(name) { delete this.attributes[name]; }

    appendChild(child) {
      if (!child) return;
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        child.parentElement = null;
        this.children.splice(idx, 1);
      }
      return child;
    }

    remove() {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      }
    }

    addEventListener(event, handler) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    }

    click() {
      if (this.listeners["click"]) {
        this.listeners["click"].forEach(fn => fn({ target: this, preventDefault: ()=>{} }));
      }
    }

    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      const isClass = selector.startsWith(".");
      const isId = selector.startsWith("#");
      const target = selector.substring(1);

      function traverse(node) {
        for (const child of node.children) {
          if (isClass && child.classList.contains(target)) results.push(child);
          else if (isId && child.id === target) results.push(child);
          else if (!isClass && !isId && child.tagName.toLowerCase() === selector.toLowerCase()) results.push(child);
          traverse(child);
        }
      }
      traverse(this);
      return results;
    }

    scrollIntoView(options) { this._scrolled = options || true; }
  }

  const mockLocalStorage = {};
  const mockElementsById = {};
  const mockDoc = {
    body: new MockElement("body"),
    getElementById: function(id) {
      if (!mockElementsById[id]) {
        const el = new MockElement("div");
        el.id = id;
        mockElementsById[id] = el;
      }
      return mockElementsById[id];
    },
    querySelector: function(sel) {
      if (sel.startsWith("#")) return mockDoc.getElementById(sel.substring(1));
      return mockDoc.body.querySelector(sel) || new MockElement("div");
    },
    querySelectorAll: function(sel) { return mockDoc.body.querySelectorAll(sel); },
    createElement: function(tag) { return new MockElement(tag); },
    addEventListener: function(evt, cb) {
      if (evt === "DOMContentLoaded") {
        try { cb(); } catch(e) {}
      }
    }
  };

  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    addEventListener: function(event, cb) {}
  };

  const testFn = new Function("window", "document", "localStorage", "console", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    ${appJsCode}
    return {
      getModuleFromQuestionId: window.getModuleFromQuestionId || globalObj.getModuleFromQuestionId,
      cleanQuestionPromptText: window.cleanQuestionPromptText || globalObj.cleanQuestionPromptText,
      cleanOptionPrefix: window.cleanOptionPrefix || globalObj.cleanOptionPrefix,
      sanitizeQuestion: window.sanitizeQuestion || globalObj.sanitizeQuestion,
      sanitizeQuestionPool: window.sanitizeQuestionPool || globalObj.sanitizeQuestionPool,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText,
      applyReviewListPagination: window.applyReviewListPagination || globalObj.applyReviewListPagination,
      calculateScores: window.calculateScores || globalObj.calculateScores
    };
  `);

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const { getModuleFromQuestionId, cleanQuestionPromptText, cleanOptionPrefix, sanitizeQuestion, sanitizeQuestionPool, parseMockExamText, applyReviewListPagination } = exports;

  // ============================================================================
  // TEST SUITE 1: EMPIRICAL VALIDATION OF ALL 7 SIMULATION FILES
  // ============================================================================
  mockConsole.log("\n[SUITE 1] Empirical Validation of All 7 Simulation Files (490 Questions Total)");

  const mockDir = projectRoot + "/Mock exams";
  const simFiles = [
    { name: "CBEH simulation 1 .pdf", type: "pdf" },
    { name: "CBEH simulation 2.pdf", type: "pdf" },
    { name: "CBEH_simulation_3.pdf", type: "pdf" },
    { name: "CBEH_simulation_4.md", type: "md" },
    { name: "CBEH_simulation_5.pdf", type: "pdf" },
    { name: "CBEH_simulation_6.pdf", type: "pdf" },
    { name: "CBEH_simulation_7.md", type: "md" }
  ];

  let grandTotalQuestions = 0;
  let grandTotalInterdisciplinary = 0;
  let grandTotalCellBio = 0;
  let grandTotalHistology = 0;
  let grandTotalEmbryology = 0;

  simFiles.forEach((fileInfo, simIdx) => {
    const filePath = mockDir + "/" + fileInfo.name;
    let rawText = "";
    if (fileInfo.type === "pdf") {
      rawText = extractPdfText(filePath);
    } else {
      const nsPath = $(filePath);
      const nsData = $.NSString.stringWithContentsOfFileEncodingError(nsPath, $.NSUTF8StringEncoding, null);
      rawText = ObjC.unwrap(nsData);
    }

    assert(rawText && rawText.length > 500, `Simulation ${simIdx+1} file text extracted successfully (${fileInfo.name})`);

    const questions = parseMockExamText(rawText);
    assertEqual(questions.length, 70, `Simulation ${simIdx+1} contains exactly 70 questions`);
    grandTotalQuestions += questions.length;

    // Check module counts
    const cb = questions.filter(q => q.module === "Cell Biology");
    const hist = questions.filter(q => q.module === "Histology");
    const emb = questions.filter(q => q.module === "Embryology");
    const ind = questions.filter(q => q.module === "Interdisciplinary");

    assertEqual(cb.length, 30, `Sim ${simIdx+1} Cell Biology count is 30`);
    assertEqual(hist.length, 24, `Sim ${simIdx+1} Histology count is 24`);
    assertEqual(emb.length, 12, `Sim ${simIdx+1} Embryology count is 12`);
    assertEqual(ind.length, 4, `Sim ${simIdx+1} Interdisciplinary count is 4`);

    grandTotalCellBio += cb.length;
    grandTotalHistology += hist.length;
    grandTotalEmbryology += emb.length;
    grandTotalInterdisciplinary += ind.length;

    // Check exact question ID to module mapping & question structure
    questions.forEach((q, idx) => {
      const expectedId = idx + 1;
      assertEqual(q.id, expectedId, `Sim ${simIdx+1} Q${expectedId} ID is correct`);

      if (expectedId >= 1 && expectedId <= 30) {
        assertEqual(q.module, "Cell Biology", `Sim ${simIdx+1} Q${expectedId} is Cell Biology`);
      } else if (expectedId >= 31 && expectedId <= 54) {
        assertEqual(q.module, "Histology", `Sim ${simIdx+1} Q${expectedId} is Histology`);
      } else if (expectedId >= 55 && expectedId <= 66) {
        assertEqual(q.module, "Embryology", `Sim ${simIdx+1} Q${expectedId} is Embryology`);
      } else if (expectedId >= 67 && expectedId <= 70) {
        assertEqual(q.module, "Interdisciplinary", `Sim ${simIdx+1} Q${expectedId} is Interdisciplinary`);
      }

      // Verify question prompt does not contain orphaned prefixes
      assert(!/^(?:and|or|but|also|as well as|&)\s+/i.test(q.question), `Sim ${simIdx+1} Q${expectedId} prompt has no orphaned conjunction prefix: "${q.question.substring(0, 30)}"`);
      assert(!/^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)/i.test(q.question), `Sim ${simIdx+1} Q${expectedId} prompt does not leak module headers`);
      assert(q.question.length > 5, `Sim ${simIdx+1} Q${expectedId} prompt is non-empty`);

      // Verify question structure based on type
      if (q.type === "multiple-choice") {
        assert(Array.isArray(q.options) && q.options.length >= 2, `Sim ${simIdx+1} Q${expectedId} MCQ options valid (${q.options.length})`);
        assert(["A","B","C","D","E"].includes(q.correctAnswer), `Sim ${simIdx+1} Q${expectedId} MCQ correctAnswer is in A-E: ${q.correctAnswer}`);
      } else if (q.type === "true-false") {
        assert(["True", "False"].includes(q.correctAnswer), `Sim ${simIdx+1} Q${expectedId} TF correctAnswer is True/False: ${q.correctAnswer}`);
      } else if (q.type === "true-false-cluster") {
        assert(Array.isArray(q.statements) && q.statements.length >= 2, `Sim ${simIdx+1} Q${expectedId} TF Cluster has >= 2 statements`);
      } else if (q.type === "fill-in-the-gap") {
        assert(typeof q.correctAnswer === "string" && q.correctAnswer.length > 0, `Sim ${simIdx+1} Q${expectedId} Fill-in-the-gap has correctAnswer`);
        assert(/[_\[\.]/.test(q.question), `Sim ${simIdx+1} Q${expectedId} Fill-in-the-gap preserves blank placeholder`);
      } else if (q.type === "matching") {
        assert(Array.isArray(q.leftItems) && q.leftItems.length >= 2, `Sim ${simIdx+1} Q${expectedId} Matching leftItems length >= 2 (${q.leftItems.length})`);
        assert(Array.isArray(q.rightItems) && q.rightItems.length >= 2, `Sim ${simIdx+1} Q${expectedId} Matching rightItems length >= 2 (${q.rightItems.length})`);
        assert(q.correctAnswers && Object.keys(q.correctAnswers).length > 0, `Sim ${simIdx+1} Q${expectedId} Matching has correctAnswers mapping`);
      } else if (q.type === "open") {
        assert(typeof q.modelAnswer === "string" && q.modelAnswer.length > 0, `Sim ${simIdx+1} Q${expectedId} Open Question has modelAnswer`);
      }
    });
  });

  assertEqual(grandTotalQuestions, 490, "Grand total across all 7 simulations is 490 questions");
  assertEqual(grandTotalCellBio, 210, "Grand total Cell Biology is 210 (30 x 7)");
  assertEqual(grandTotalHistology, 168, "Grand total Histology is 168 (24 x 7)");
  assertEqual(grandTotalEmbryology, 84, "Grand total Embryology is 84 (12 x 7)");
  assertEqual(grandTotalInterdisciplinary, 28, "Grand total Interdisciplinary is exactly 28 (4 x 7)");

  // ============================================================================
  // TEST SUITE 2: ADVERSARIAL STRESS TESTING OF SANITIZER & RANGE CLASSIFICATION
  // ============================================================================
  mockConsole.log("\n[SUITE 2] Adversarial Stress Testing of Sanitizer & Classification");

  // 1. Keyword Overrides Immunity
  const adversarialPrompts = [
    { q: "Cell biology mechanisms in histology and embryology integration.", id: 67, expectedMod: "Interdisciplinary" },
    { q: "Histological features of embryological cardiac neural crest cells.", id: 68, expectedMod: "Interdisciplinary" },
    { q: "Embryology and Cell Biology aspects of mitochondrial inheritance.", id: 69, expectedMod: "Interdisciplinary" },
    { q: "Histology staining procedures in clinical pathology.", id: 70, expectedMod: "Interdisciplinary" },
    { q: "Interdisciplinary overlap in mitochondrial respiration.", id: 5, expectedMod: "Cell Biology" },
    { q: "Embryology and interdisciplinary stem cell models.", id: 35, expectedMod: "Histology" },
    { q: "Cell biology of somite differentiation during embryonic folding.", id: 60, expectedMod: "Embryology" }
  ];

  adversarialPrompts.forEach(item => {
    const qObj = { id: item.id, question: item.q, module: "WrongModule" };
    sanitizeQuestion(qObj);
    assertEqual(qObj.module, item.expectedMod, `Q${item.id} with misleading keywords correctly classified as ${item.expectedMod}`);
  });

  // 2. Orphaned Conjunction and Fragment Stripping Stress Cases
  const promptCleaningCases = [
    { input: "70. and cellular energy production occurs in mitochondria.", expected: "Cellular energy production occurs in mitochondria." },
    { input: "68. or both primary cilia and flagella contain axonemes.", expected: "Both primary cilia and flagella contain axonemes." },
    { input: "69. as well as apoptosis pathways in developmental remodeling.", expected: "Apoptosis pathways in developmental remodeling." },
    { input: "MODULE IV: INTERDISCIPLINARY 67. Explain how glycolysis couples to TCA cycle.", expected: "Explain how glycolysis couples to TCA cycle." },
    { input: "PART 4: INTERDISCIPLINARY (4 Questions) 68. What is the role of cadherins?", expected: "What is the role of cadherins?" },
    { input: "70. ... and but also The primary site of fertilization is the ampulla.", expected: "The primary site of fertilization is the ampulla." },
    { input: "In the human embryo, which structure gives rise to the notochord?", expected: "In the human embryo, which structure gives rise to the notochord?" },
    { input: "The inner cell mass gives rise to which embryonic lineage?", expected: "The inner cell mass gives rise to which embryonic lineage?" },
    { input: "Which of the following describes the function of tight junctions?", expected: "Which of the following describes the function of tight junctions?" }
  ];

  promptCleaningCases.forEach((tc, idx) => {
    const cleaned = cleanQuestionPromptText(tc.input);
    assertEqual(cleaned, tc.expected, `Prompt cleaning test case ${idx + 1}`);
  });

  // ============================================================================
  // TEST SUITE 3: RESULTS SCREEN UI PAGINATION & COMPACT ACTIONS E2E
  // ============================================================================
  mockConsole.log("\n[SUITE 3] Results Screen UI Pagination & Compact Actions E2E");

  // Create a container with 54 auto-graded review cards
  const autoContainer = mockDoc.getElementById("auto-review-list-test");
  autoContainer.children = [];
  for (let i = 1; i <= 54; i++) {
    const card = mockDoc.createElement("div");
    card.className = "review-item-card";
    card.id = `auto-card-${i}`;
    card.textContent = `Auto Review Question ${i}`;
    autoContainer.appendChild(card);
  }

  // Apply pagination
  applyReviewListPagination("auto-review-list-test");

  // Check card visibility (first 3 visible, remaining 51 hidden)
  assertEqual(autoContainer.children[0].style.display, "flex", "Card 1 is visible");
  assertEqual(autoContainer.children[1].style.display, "flex", "Card 2 is visible");
  assertEqual(autoContainer.children[2].style.display, "flex", "Card 3 is visible");
  assertEqual(autoContainer.children[3].style.display, "none", "Card 4 is hidden");
  assertEqual(autoContainer.children[53].style.display, "none", "Card 54 is hidden");

  // Check pagination control element
  const pagControl = autoContainer.querySelector(".review-pagination-control");
  assert(pagControl !== null, "Pagination control was created and appended");

  const btnShowMore = pagControl.querySelector(".btn-show-more");
  assert(btnShowMore !== null, "Toggle button .btn-show-more exists");
  assert(btnShowMore.textContent.includes("51 remaining"), "Toggle button displays correct remaining count: 51");
  assertEqual(btnShowMore.getAttribute("aria-expanded"), "false", "aria-expanded is initially false");

  // Check compact action buttons
  const compactActions = pagControl.querySelector(".results-compact-actions");
  assert(compactActions !== null, "Compact action buttons container exists");

  const btnHome = compactActions.querySelector(".btn-compact-home");
  const btnRestart = compactActions.querySelector(".btn-compact-restart");
  const btnPdf = compactActions.querySelector(".btn-compact-pdf");

  assert(btnHome !== null, "Compact Return Home button exists");
  assert(btnRestart !== null, "Compact Retake Another Exam button exists");
  assert(btnPdf !== null, "Compact Download Study Summary button exists");

  // Click toggle button to expand
  btnShowMore.click();
  assertEqual(btnShowMore.getAttribute("aria-expanded"), "true", "aria-expanded is true after click");
  assertEqual(autoContainer.children[3].style.display, "flex", "Card 4 is now visible");
  assertEqual(autoContainer.children[53].style.display, "flex", "Card 54 is now visible");
  assert(btnShowMore.textContent.includes("Show Fewer Questions"), "Toggle button text updated to 'Show Fewer Questions'");

  // Click toggle button to collapse
  btnShowMore.click();
  assertEqual(btnShowMore.getAttribute("aria-expanded"), "false", "aria-expanded is false after second click");
  assertEqual(autoContainer.children[3].style.display, "none", "Card 4 is hidden again after collapse");
  assert(btnShowMore.textContent.includes("51 remaining"), "Toggle button shows remaining count again");

  // Re-apply pagination to simulate re-render (e.g. self-grading score change)
  applyReviewListPagination("auto-review-list-test");
  const controlsCount = autoContainer.querySelectorAll(".review-pagination-control").length;
  assertEqual(controlsCount, 1, "Duplicate pagination controls are prevented on re-render");

  // Test small list container (<= 3 cards, should not have pagination control)
  const smallContainer = mockDoc.getElementById("small-review-list-test");
  smallContainer.children = [];
  for (let i = 1; i <= 3; i++) {
    const card = mockDoc.createElement("div");
    card.className = "grading-item-card";
    smallContainer.appendChild(card);
  }
  applyReviewListPagination("small-review-list-test");
  assertEqual(smallContainer.querySelectorAll(".review-pagination-control").length, 0, "No pagination control created for lists <= 3 items");
  assertEqual(smallContainer.children[0].style.display, "flex", "Card 1 in small list is visible");
  assertEqual(smallContainer.children[1].style.display, "flex", "Card 2 in small list is visible");
  assertEqual(smallContainer.children[2].style.display, "flex", "Card 3 in small list is visible");

  // ============================================================================
  // SUMMARY
  // ============================================================================
  mockConsole.log("================================================================================");
  mockConsole.log(`MILESTONE 3 VERIFICATION SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  if (failed === 0) {
    mockConsole.log("VERDICT: ALL ADVERSARIAL & EMPIRICAL ASSERTIONS PASSED (APPROVE)");
  } else {
    mockConsole.log("VERDICT: FAILURES ENCOUNTERED (REQUEST_CHANGES)");
    failureReports.forEach((f, i) => {
      mockConsole.log(`  [${i+1}] ${f.message} -> ${f.details}`);
    });
  }

  return { passed, failed, failureReports };
}

runMilestone3Verification();
