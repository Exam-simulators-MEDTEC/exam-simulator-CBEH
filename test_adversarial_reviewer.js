// Adversarial Reviewer Comprehensive Stress Test Suite
// Run with: osascript -l JavaScript test_adversarial_reviewer.js

function runAdversarialTestSuite() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
  // Read app.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  // Read index.css
  const cssPath = $(projectRoot + "/index.css");
  const cssData = $.NSString.stringWithContentsOfFileEncodingError(cssPath, $.NSUTF8StringEncoding, null);
  const cssCode = ObjC.unwrap(cssData);

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

      function matchesSelector(child) {
        if (isId) {
          return child.id === selector.substring(1);
        } else if (isClass) {
          const classes = selector.split(".").filter(Boolean);
          return classes.every(c => child.classList.contains(c));
        } else {
          return child.tagName.toLowerCase() === selector.toLowerCase();
        }
      }

      function traverse(node) {
        for (const child of node.children) {
          if (matchesSelector(child)) results.push(child);
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
    addEventListener: function(event, cb) {},
    scrollTo: function() {}
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
      formatQuestionTypeLabel: window.formatQuestionTypeLabel || globalObj.formatQuestionTypeLabel,
      getModuleClass: window.getModuleClass || globalObj.getModuleClass,
      cleanQuestionPromptText: window.cleanQuestionPromptText || globalObj.cleanQuestionPromptText,
      sanitizeQuestion: window.sanitizeQuestion || globalObj.sanitizeQuestion,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText,
      initializeSelfGradingList: window.initializeSelfGradingList || globalObj.initializeSelfGradingList,
      renderAutoReviewCard: window.renderAutoReviewCard || globalObj.renderAutoReviewCard,
      applyReviewListPagination: window.applyReviewListPagination || globalObj.applyReviewListPagination,
      calculateScores: window.calculateScores || globalObj.calculateScores,
      evaluateQuestionResult: window.evaluateQuestionResult || globalObj.evaluateQuestionResult,
      state: window.state || globalObj.state
    };
  `);

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = String(v); },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const {
    getModuleFromQuestionId,
    formatQuestionTypeLabel,
    getModuleClass,
    cleanQuestionPromptText,
    sanitizeQuestion,
    parseMockExamText,
    initializeSelfGradingList,
    renderAutoReviewCard,
    applyReviewListPagination,
    calculateScores,
    evaluateQuestionResult,
    state
  } = exports;

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 1: DETERMINISTIC 1-70 POSITION MODULE RULES");
  mockConsole.log("================================================================================");

  assert(typeof getModuleFromQuestionId === "function", "getModuleFromQuestionId exists");

  // Standard boundary testing (1-70)
  assertEqual(getModuleFromQuestionId(1), "Cell Biology", "Q1 -> Cell Biology");
  assertEqual(getModuleFromQuestionId(15), "Cell Biology", "Q15 -> Cell Biology");
  assertEqual(getModuleFromQuestionId(30), "Cell Biology", "Q30 -> Cell Biology");
  assertEqual(getModuleFromQuestionId(31), "Histology", "Q31 -> Histology");
  assertEqual(getModuleFromQuestionId(45), "Histology", "Q45 -> Histology");
  assertEqual(getModuleFromQuestionId(54), "Histology", "Q54 -> Histology");
  assertEqual(getModuleFromQuestionId(55), "Embryology", "Q55 -> Embryology");
  assertEqual(getModuleFromQuestionId(60), "Embryology", "Q60 -> Embryology");
  assertEqual(getModuleFromQuestionId(66), "Embryology", "Q66 -> Embryology");
  assertEqual(getModuleFromQuestionId(67), "Interdisciplinary", "Q67 -> Interdisciplinary");
  assertEqual(getModuleFromQuestionId(68), "Interdisciplinary", "Q68 -> Interdisciplinary");
  assertEqual(getModuleFromQuestionId(69), "Interdisciplinary", "Q69 -> Interdisciplinary");
  assertEqual(getModuleFromQuestionId(70), "Interdisciplinary", "Q70 -> Interdisciplinary");

  // Extended pool & adversarial modulo testing (71..700+)
  assertEqual(getModuleFromQuestionId(71), "Cell Biology", "Q71 -> Cell Biology (Sim 2 Q1)");
  assertEqual(getModuleFromQuestionId(100), "Cell Biology", "Q100 -> Cell Biology (Sim 2 Q30)");
  assertEqual(getModuleFromQuestionId(101), "Histology", "Q101 -> Histology (Sim 2 Q31)");
  assertEqual(getModuleFromQuestionId(124), "Histology", "Q124 -> Histology (Sim 2 Q54)");
  assertEqual(getModuleFromQuestionId(125), "Embryology", "Q125 -> Embryology (Sim 2 Q55)");
  assertEqual(getModuleFromQuestionId(136), "Embryology", "Q136 -> Embryology (Sim 2 Q66)");
  assertEqual(getModuleFromQuestionId(137), "Interdisciplinary", "Q137 -> Interdisciplinary (Sim 2 Q67)");
  assertEqual(getModuleFromQuestionId(140), "Interdisciplinary", "Q140 -> Interdisciplinary (Sim 2 Q70)");
  assertEqual(getModuleFromQuestionId(490), "Interdisciplinary", "Q490 -> Interdisciplinary (Sim 7 Q70)");

  // Edge cases: strings, zero, negative, NaN
  assertEqual(getModuleFromQuestionId("1"), "Cell Biology", "String '1' -> Cell Biology");
  assertEqual(getModuleFromQuestionId("45"), "Histology", "String '45' -> Histology");
  assertEqual(getModuleFromQuestionId("67"), "Interdisciplinary", "String '67' -> Interdisciplinary");
  assertEqual(getModuleFromQuestionId(0), "Cell Biology", "Q0 fallback -> Cell Biology");
  assertEqual(getModuleFromQuestionId(-10), "Cell Biology", "Negative ID fallback -> Cell Biology");
  assertEqual(getModuleFromQuestionId(NaN), "Cell Biology", "NaN ID fallback -> Cell Biology");
  assertEqual(getModuleFromQuestionId(undefined), "Cell Biology", "Undefined ID fallback -> Cell Biology");

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 2: SANITIZER & PROMPT HARDENING STRESS TESTS");
  mockConsole.log("================================================================================");

  // Stripping leaked headers and keywords
  assertEqual(
    cleanQuestionPromptText("MODULE 1: CELL BIOLOGY 1. (Multiple Choice) Which organelle synthesizes ATP?"),
    "Which organelle synthesizes ATP?",
    "Leaked module header + question number + type stripped"
  );
  assertEqual(
    cleanQuestionPromptText("[Embryology: Chapter 3] Which germ layer forms the neural tube?"),
    "Which germ layer forms the neural tube?",
    "Leaked square bracket chapter topic stripped"
  );
  assertEqual(
    cleanQuestionPromptText("=== SECTION II: HISTOLOGY === 31. (Open Question - Max 50 words) Describe the layers of the epidermis."),
    "Describe the layers of the epidermis.",
    "Section divider + word limit tag stripped"
  );
  assertEqual(
    cleanQuestionPromptText("67. (Fill in Northern the Gap) The blood-testis barrier is formed by ________ junctions."),
    "The blood-testis barrier is formed by ________ junctions.",
    "Fill in the gap blank line preserved with corrupted type tag stripped"
  );

  // Adversarial question sanitization: module overwrite immunity
  const testQ = {
    id: 68,
    module: "Cell Biology",
    question: "MODULE 1: 68. (True or False) A mutated gene in mitochondrial DNA affects metabolic pathway.",
    type: "true-false",
    options: ["True", "False"]
  };
  sanitizeQuestion(testQ);
  assertEqual(testQ.module, "Interdisciplinary", "sanitizeQuestion corrected module to Interdisciplinary by ID 68");
  assertEqual(testQ.question, "A mutated gene in mitochondrial DNA affects metabolic pathway.", "Prompt cleanly sanitized");

  // Fill-in-the-gap with hyphen and True/False with slash
  assertEqual(
    cleanQuestionPromptText("15. (Fill-in-the-gap) The major structural protein of tight junctions is ________."),
    "The major structural protein of tight junctions is ________.",
    "Hyphenated Fill-in-the-gap tag cleanly stripped while preserving blanks"
  );
  assertEqual(
    cleanQuestionPromptText("22. (True/False) Mitochondria replicate independently via binary fission."),
    "Mitochondria replicate independently via binary fission.",
    "True/False with slash cleanly stripped"
  );

  // Parsing exam with hyphenated fill-in, true/false with slash, and bracketed inline options
  const mockAdvExam = `
1. (Fill-in-the-gap) Nuclear pores allow passive diffusion of molecules smaller than ________ kDa.
2. (True/False) The nuclear lamina is composed of intermediate filaments called lamins.
3. (Multiple Choice) Which organelle is responsible for lipid synthesis?
(A) Smooth ER
(B) Rough ER
(C) Golgi apparatus
(D) Lysosome

ANSWER KEY
1. 40
2. True
3. A
`;
  const parsedAdvExam = parseMockExamText(mockAdvExam);
  assertEqual(parsedAdvExam.length, 3, "Adversarial exam parsed 3 questions");
  assertEqual(parsedAdvExam[0].type, "fill-in-the-gap", "Q1 type is fill-in-the-gap");
  assertEqual(parsedAdvExam[1].type, "true-false", "Q2 type is true-false");
  assertEqual(parsedAdvExam[2].type, "multiple-choice", "Q3 type is multiple-choice");
  assertEqual(parsedAdvExam[2].options.length, 4, "Q3 parsed 4 bracketed options");
  assertEqual(parsedAdvExam[2].options[0], "Smooth ER", "Q3 Option A correctly parsed as cleaned text");

  // Matching left items not misparsed
  const mockMatchingText = `
60. (Matching) Match each stage of embryonic development with its key event:
1. Zygote
2. Morula
3. Blastocyst
4. Gastrula
A. Solid ball of 16-32 cells
B. Single diploid cell formed by fertilization
C. Formation of three primary germ layers
D. Structure containing inner cell mass and trophoblast

ANSWER KEY
60. 1-B, 2-A, 3-D, 4-C
`;
  const parsedMatching = parseMockExamText(mockMatchingText);
  assertEqual(parsedMatching.length, 1, "Matching question parsed as single question");
  assertEqual(parsedMatching[0].id, 60, "Matching question ID is 60");
  assertEqual(parsedMatching[0].type, "matching", "Question type is matching");
  assertEqual(parsedMatching[0].module, "Embryology", "Module is Embryology by ID 60");
  assertEqual(parsedMatching[0].leftItems.length, 4, "Matching question has exactly 4 left items");
  assertEqual(parsedMatching[0].rightItems.length, 4, "Matching question has exactly 4 right items");

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 3: OPEN QUESTION REVIEW CARD UI & DOM INTEGRITY");
  mockConsole.log("================================================================================");

  assert(typeof initializeSelfGradingList === "function", "initializeSelfGradingList exists");

  state.questions = [
    {
      id: 30,
      module: "Cell Biology",
      type: "open",
      question: "Explain the role of p53 in DNA damage response and cell cycle arrest.",
      modelAnswer: "p53 acts as a tumor suppressor by upregulating p21 (CDKN1A), which inhibits CDK2/CDK4 to arrest cells in G1 phase for repair or trigger apoptosis via BAX."
    },
    {
      id: 54,
      module: "Histology",
      type: "open",
      question: "Describe the structural differences between continuous, fenestrated, and sinusoidal capillaries.",
      modelAnswer: "Continuous: tight junctions, continuous basement membrane. Fenestrated: pores with diaphragms. Sinusoidal: large gaps, discontinuous basement membrane."
    }
  ];
  state.answers = {
    30: "p53 induces p21 to block CDK and stops cell cycle at G1.",
    54: ""
  };
  state.selfGradedScores = {};

  const gradingContainer = mockDoc.getElementById("open-questions-grading-list");
  gradingContainer.innerHTML = "";

  initializeSelfGradingList();

  const openCards = gradingContainer.children.filter(c => c.classList.contains("grading-item-card"));
  assertEqual(openCards.length, 2, "Grading list contains 2 open question cards");

  // Test Card 1 (Q30)
  const card1 = openCards[0];
  assertEqual(card1.id, "grading-card-30", "Card 1 has ID grading-card-30");

  const header1 = card1.querySelector(".review-card-header");
  assert(header1 !== null, "Card 1 contains .review-card-header");

  const meta1 = header1.querySelector(".review-card-meta");
  assert(meta1 !== null, "Header 1 contains .review-card-meta");

  const idBadge1 = meta1.querySelector(".review-card-id");
  assert(idBadge1 !== null && idBadge1.textContent === "Question 30", "ID Badge shows 'Question 30'");

  const modPill1 = meta1.querySelector(".review-module-pill");
  assert(modPill1 !== null && modPill1.textContent === "Cell Biology", "Module pill shows 'Cell Biology'");
  assert(modPill1.classList.contains("pill-cellbio"), "Module pill has class 'pill-cellbio'");

  const typePill1 = meta1.querySelector(".review-type-pill");
  assert(typePill1 !== null && typePill1.textContent === "Open Question", "Type pill shows 'Open Question'");

  const statusPill1 = header1.querySelector(".review-status-pill");
  assert(statusPill1 !== null, "Status pill exists in header 1");
  assert(statusPill1.classList.contains("graded-incorrect"), "Status pill initially shows graded-incorrect (0 pts default)");

  const modelBox1 = card1.querySelector(".model-answer-box");
  assert(modelBox1 !== null, "Card 1 contains .model-answer-box");

  const actions1 = modelBox1.querySelector(".grading-actions");
  assert(actions1 !== null, "Model box contains .grading-actions");

  const btnIncorrect1 = actions1.querySelector(".btn.grading-btn.incorrect");
  const btnCorrect1 = actions1.querySelector(".btn.grading-btn.correct");
  assert(btnIncorrect1 !== null, "Incorrect action button exists");
  assert(btnCorrect1 !== null, "Correct action button exists");
  assertEqual(btnIncorrect1.textContent, "Incorrect (0 pts)", "Incorrect button text is 'Incorrect (0 pts)'");
  assertEqual(btnCorrect1.textContent, "Correct (1 pt)", "Correct button text is 'Correct (1 pt)'");

  btnCorrect1.click();
  assert(btnCorrect1.classList.contains("active"), "Correct button marked active on click");
  assert(!btnIncorrect1.classList.contains("active"), "Incorrect button no longer active");
  assert(card1.classList.contains("graded-correct"), "Card updated to .graded-correct");
  assert(statusPill1.classList.contains("graded-correct"), "Status pill updated to .graded-correct");
  assertEqual(statusPill1.textContent, "✓ Graded: 1 pt", "Status pill text updated to '✓ Graded: 1 pt'");

  btnIncorrect1.click();
  assert(btnIncorrect1.classList.contains("active"), "Incorrect button active on click");
  assert(!btnCorrect1.classList.contains("active"), "Correct button inactive");
  assert(card1.classList.contains("graded-incorrect"), "Card updated to .graded-incorrect");
  assert(statusPill1.classList.contains("graded-incorrect"), "Status pill updated to .graded-incorrect");
  assertEqual(statusPill1.textContent, "✗ Graded: 0 pts", "Status pill text updated to '✗ Graded: 0 pts'");

  // Adversarial History Deduplication: multiple clicks update same attempt session
  state.history = [];
  state.currentAttemptTimestamp = null;
  calculateScores();
  const initialHistoryLen = state.history.length;
  assertEqual(initialHistoryLen, 1, "Initial calculateScores creates 1 history record");

  btnCorrect1.click();
  assertEqual(state.history.length, 1, "Clicking Correct updates existing record, no duplicate added");
  assertEqual(state.history[0].totalScore, 1, "History record score updated to 1");

  btnIncorrect1.click();
  assertEqual(state.history.length, 1, "Clicking Incorrect updates existing record, history length remains 1");
  assertEqual(state.history[0].totalScore, 0, "History record score updated to 0");

  const card2 = openCards[1];
  const modPill2 = card2.querySelector(".review-module-pill");
  assert(modPill2 !== null && modPill2.textContent === "Histology", "Card 2 Module pill shows 'Histology'");
  assert(modPill2.classList.contains("pill-histology"), "Card 2 Module pill has class 'pill-histology'");

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 4: AUTO-GRADED REVIEW CARD UI & DOM INTEGRITY");
  mockConsole.log("================================================================================");

  assert(typeof renderAutoReviewCard === "function", "renderAutoReviewCard exists");

  const autoContainer = mockDoc.getElementById("auto-questions-review-list");
  autoContainer.innerHTML = "";

  const qTFCluster = {
    id: 67,
    module: "Interdisciplinary",
    type: "true-false-cluster",
    question: "Assess the following statements regarding diabetic microangiopathy:",
    statements: [
      { id: "A", text: "Thickening of the capillary basement membrane is a hallmark.", correctAnswer: "True" },
      { id: "B", text: "Endothelial cell proliferation leads to increased capillary lumen diameter.", correctAnswer: "False" }
    ],
    explanation: "Diabetic microangiopathy causes diffuse thickening of basement membranes and microvascular occlusion."
  };

  const autoCard = renderAutoReviewCard(qTFCluster, true, { A: "True", B: "False" });
  assert(autoCard !== null, "Auto review card returned");
  assert(autoCard.classList.contains("review-item-card"), "Auto card has class 'review-item-card'");
  assert(autoCard.classList.contains("correct"), "Auto card has class 'correct'");

  const autoHeader = autoCard.querySelector(".review-card-header");
  assert(autoHeader !== null, "Auto card contains .review-card-header");

  const autoId = autoHeader.querySelector(".review-card-id");
  assertEqual(autoId.textContent, "Question 67", "Auto card ID shows 'Question 67'");

  const autoModPill = autoHeader.querySelector(".review-module-pill");
  assertEqual(autoModPill.textContent, "Interdisciplinary", "Auto card module pill shows 'Interdisciplinary'");
  assert(autoModPill.classList.contains("pill-interdisciplinary"), "Auto card module pill has 'pill-interdisciplinary'");

  const autoTypePill = autoHeader.querySelector(".review-type-pill");
  assertEqual(autoTypePill.textContent, "True / False Cluster", "Auto card type pill shows 'True / False Cluster'");

  const autoStatusPill = autoHeader.querySelector(".review-status-pill");
  assert(autoStatusPill.classList.contains("status-correct"), "Auto status pill has 'status-correct'");
  assertEqual(autoStatusPill.textContent, "✓ Correct (+1 pt)", "Auto status pill shows '✓ Correct (+1 pt)'");

  const solutionWrapper = autoCard.querySelector(".review-solution-wrapper");
  assert(solutionWrapper !== null, "Auto card contains .review-solution-wrapper");
  const toggleBtn = solutionWrapper.querySelector(".btn-review-toggle");
  assert(toggleBtn !== null, "Solution wrapper contains .btn-review-toggle");

  // Adversarial Custom Focus Mode & Bookmarks Quiz: Module Retention Test
  const histFocusQuestions = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    module: "Histology",
    type: "multiple-choice",
    question: `Histology question ${i + 1} regarding epithelial tissue.`,
    options: ["A. Simple squamous", "B. Stratified columnar", "C. Pseudostratified", "D. Transitional"],
    correctAnswer: "A"
  }));
  
  histFocusQuestions.forEach(q => {
    const trueModule = q.module;
    if (typeof q.question === "string") q.question = cleanQuestionPromptText(q.question);
    q.module = trueModule;
  });

  state.questions = histFocusQuestions;
  state.answers = {};
  histFocusQuestions.forEach(q => { state.answers[q.id] = "A"; });
  calculateScores();

  assertEqual(state.questions.every(q => q.module === "Histology"), true, "All 20 focus questions retain 'Histology' module");
  const histCard = renderAutoReviewCard(state.questions[0], true, "A");
  const histModPill = histCard.querySelector(".review-module-pill");
  assertEqual(histModPill.textContent, "Histology", "Focus quiz card shows 'Histology' module pill");
  assert(histModPill.classList.contains("pill-histology"), "Focus quiz card has 'pill-histology'");

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 5: EMPIRICAL VALIDATION ACROSS ALL 7 SIMULATION FILES");
  mockConsole.log("================================================================================");

  function extractPdfText(filePath) {
    ObjC.import("PDFKit");
    ObjC.import("Foundation");
    const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(filePath));
    return doc ? ObjC.unwrap(doc.string) : "";
  }

  function readTextFile(filePath) {
    const p = $(filePath);
    const data = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null);
    return ObjC.unwrap(data);
  }

  const mockFiles = [
    { name: "CBEH simulation 1 .pdf", isPdf: true },
    { name: "CBEH simulation 2.pdf", isPdf: true },
    { name: "CBEH_simulation_3.pdf", isPdf: true },
    { name: "CBEH_simulation_4.md", isPdf: false },
    { name: "CBEH_simulation_5.pdf", isPdf: true },
    { name: "CBEH_simulation_6.pdf", isPdf: true },
    { name: "CBEH_simulation_7.md", isPdf: false }
  ];

  let totalPoolQuestions = [];
  const moduleTotals = {
    "Cell Biology": 0,
    "Histology": 0,
    "Embryology": 0,
    "Interdisciplinary": 0
  };

  mockFiles.forEach((fileInfo, simIdx) => {
    const fullPath = projectRoot + "/Mock exams/" + fileInfo.name;
    const rawText = fileInfo.isPdf ? extractPdfText(fullPath) : readTextFile(fullPath);
    
    assert(rawText.length > 500, `Raw text extracted from ${fileInfo.name}`);

    const parsed = parseMockExamText(rawText);
    assertEqual(parsed.length, 70, `File ${fileInfo.name} parses exactly 70 questions`);

    const ids = parsed.map(q => q.id);
    const expectedIds = Array.from({ length: 70 }, (_, i) => i + 1);
    assertEqual(JSON.stringify(ids), JSON.stringify(expectedIds), `File ${fileInfo.name} has contiguous IDs 1..70`);

    const simCounts = { "Cell Biology": 0, "Histology": 0, "Embryology": 0, "Interdisciplinary": 0 };
    parsed.forEach(q => {
      simCounts[q.module] = (simCounts[q.module] || 0) + 1;
      moduleTotals[q.module] = (moduleTotals[q.module] || 0) + 1;
    });

    assertEqual(simCounts["Cell Biology"], 30, `${fileInfo.name} has 30 Cell Biology questions`);
    assertEqual(simCounts["Histology"], 24, `${fileInfo.name} has 24 Histology questions`);
    assertEqual(simCounts["Embryology"], 12, `${fileInfo.name} has 12 Embryology questions`);
    assertEqual(simCounts["Interdisciplinary"], 4, `${fileInfo.name} has 4 Interdisciplinary questions`);

    totalPoolQuestions.push(...parsed);
  });

  assertEqual(totalPoolQuestions.length, 490, "Master pool total questions is 490 (7 * 70)");
  assertEqual(moduleTotals["Cell Biology"], 210, "Master pool Cell Biology total is exactly 210");
  assertEqual(moduleTotals["Histology"], 168, "Master pool Histology total is exactly 168");
  assertEqual(moduleTotals["Embryology"], 84, "Master pool Embryology total is exactly 84");
  assertEqual(moduleTotals["Interdisciplinary"], 28, "Master pool Interdisciplinary total is exactly 28");

  mockConsole.log("================================================================================");
  mockConsole.log("       ADVERSARIAL SUITE 6: CSS LAYOUT & NO-OVERLAP STYLE VALIDATION");
  mockConsole.log("================================================================================");

  assert(cssCode.includes(".review-card-header"), "CSS contains .review-card-header");
  assert(cssCode.includes("justify-content: space-between"), "CSS header uses space-between flex layout");
  assert(cssCode.includes(".grading-actions"), "CSS contains .grading-actions");
  assert(cssCode.includes("flex-direction: row"), "CSS grading actions has horizontal flex-direction");
  assert(cssCode.includes(".grading-btn"), "CSS contains .grading-btn");
  assert(cssCode.includes(".response-comparison"), "CSS contains .response-comparison");
  assert(cssCode.includes("grid-template-columns: 1fr 1fr"), "CSS comparison uses 2 equal columns");
  assert(cssCode.includes(".review-module-pill"), "CSS contains .review-module-pill");
  assert(cssCode.includes(".pill-cellbio"), "CSS contains .pill-cellbio");
  assert(cssCode.includes(".pill-histology"), "CSS contains .pill-histology");
  assert(cssCode.includes(".pill-embryology"), "CSS contains .pill-embryology");
  assert(cssCode.includes(".pill-interdisciplinary"), "CSS contains .pill-interdisciplinary");
  assert(cssCode.includes("@media (max-width: 600px)"), "CSS contains mobile media query (600px)");
  assert(cssCode.includes("flex: 1 1 0"), "CSS mobile grading buttons flex evenly");

  mockConsole.log("================================================================================");
  mockConsole.log(`ADVERSARIAL VERIFICATION SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  return { passed, failed, failureReports };
}

const result = runAdversarialTestSuite();
if (result.failed > 0) {
  $.NSFileHandle.fileHandleWithStandardError.writeData($("ADVERSARIAL SUITE FAILED: " + result.failed + " failures\n").dataUsingEncoding($.NSUTF8StringEncoding));
} else {
  $.NSFileHandle.fileHandleWithStandardOutput.writeData($("ALL ADVERSARIAL STRESS TESTS PASSED\n").dataUsingEncoding($.NSUTF8StringEncoding));
}
