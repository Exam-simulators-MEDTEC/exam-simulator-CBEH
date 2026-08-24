// Comprehensive Verification Test for R1 and R2
// Executed via JavaScriptCore (osascript -l JavaScript)

function runReviewCardAndCategorizationTests() {
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
  mockConsole.log("        VERIFICATION: REVIEW CARD UI & DETERMINISTIC CATEGORIZATION");
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
      sanitizeQuestion: window.sanitizeQuestion || globalObj.sanitizeQuestion,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText,
      initializeSelfGradingList: window.initializeSelfGradingList || globalObj.initializeSelfGradingList,
      renderAutoReviewCard: window.renderAutoReviewCard || globalObj.renderAutoReviewCard,
      applyReviewListPagination: window.applyReviewListPagination || globalObj.applyReviewListPagination,
      calculateScores: window.calculateScores || globalObj.calculateScores,
      state: window.state || globalObj.state
    };
  `);

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const {
    getModuleFromQuestionId,
    formatQuestionTypeLabel,
    getModuleClass,
    sanitizeQuestion,
    parseMockExamText,
    initializeSelfGradingList,
    renderAutoReviewCard,
    calculateScores,
    state
  } = exports;

  // ---------------------------------------------------------------------------
  // SUITE 1: Deterministic 1-70 Rule Verification
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Deterministic 1-70 Rule Verification");

  for (let id = 1; id <= 70; id++) {
    const mod = getModuleFromQuestionId(id);
    if (id <= 30) {
      assertEqual(mod, "Cell Biology", `ID ${id} must be Cell Biology`);
    } else if (id <= 54) {
      assertEqual(mod, "Histology", `ID ${id} must be Histology`);
    } else if (id <= 66) {
      assertEqual(mod, "Embryology", `ID ${id} must be Embryology`);
    } else {
      assertEqual(mod, "Interdisciplinary", `ID ${id} must be Interdisciplinary`);
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: Open Question Self-Grading Cards (R1)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Open Question Self-Grading Card Layout & Actions");

  const gradingListEl = mockDoc.getElementById("open-questions-grading-list");
  state.questions = [
    {
      id: 3,
      module: "Cell Biology",
      type: "open",
      question: "Explain the function of the G1/S cell cycle checkpoint.",
      modelAnswer: "CDKs phosphorylate Retinoblastoma (Rb), releasing E2F."
    },
    {
      id: 57,
      module: "Embryology",
      type: "open",
      question: "Describe the events following sperm penetration into the oocyte.",
      modelAnswer: "Cortical reaction blocks polyspermy. Male and female pronuclei form and fuse."
    },
    {
      id: 70,
      module: "Interdisciplinary",
      type: "open",
      question: "Discuss the cross-talk between mitochondrial apoptosis and cell adhesion.",
      modelAnswer: "Loss of integrin signaling triggers anoikis via Bax/Bak activation."
    }
  ];
  state.answers = { 3: "My answer for G1/S", 57: "", 70: "Integrins and apoptosis cross-talk" };
  state.selfGradedScores = {};

  initializeSelfGradingList();

  const cards = gradingListEl.children.filter(c => c.classList.contains("grading-item-card"));
  assertEqual(cards.length, 3, "3 grading cards created");

  cards.forEach((card, idx) => {
    const q = state.questions[idx];
    assertEqual(card.id, `grading-card-${q.id}`, `Card ID is grading-card-${q.id}`);

    // Check Header Bar
    const header = card.querySelector(".review-card-header");
    assert(header !== null, `Card ${q.id} has .review-card-header`);

    const meta = header.querySelector(".review-card-meta");
    assert(meta !== null, `Card ${q.id} has .review-card-meta`);

    const idBadge = meta.querySelector(".review-card-id");
    assert(idBadge !== null, `Card ${q.id} has .review-card-id`);
    assertEqual(idBadge.textContent, `Question ${q.id}`, `Card ${q.id} has correct ID text`);

    const modulePill = meta.querySelector(".review-module-pill");
    assert(modulePill !== null, `Card ${q.id} has .review-module-pill`);
    assertEqual(modulePill.textContent, q.module, `Card ${q.id} module pill has text "${q.module}"`);

    const typePill = meta.querySelector(".review-type-pill");
    assert(typePill !== null, `Card ${q.id} has .review-type-pill`);
    assertEqual(typePill.textContent, "Open Question", `Card ${q.id} type pill is "Open Question"`);

    const statusPill = header.querySelector(".review-status-pill");
    assert(statusPill !== null, `Card ${q.id} has .review-status-pill`);
    assert(statusPill.textContent.includes("Graded: 0 pts"), `Card ${q.id} initially Graded: 0 pts`);

    // Check Question Text
    const qText = card.querySelector(".item-q-text");
    assert(qText !== null, `Card ${q.id} has .item-q-text`);
    assertEqual(qText.textContent, q.question, `Card ${q.id} question text matches`);

    // Check Comparison & Model Answer
    const comparison = card.querySelector(".response-comparison");
    assert(comparison !== null, `Card ${q.id} has .response-comparison`);

    const userBox = comparison.querySelector(".user-response-box");
    assert(userBox !== null, `Card ${q.id} has .user-response-box`);

    const modelBox = comparison.querySelector(".model-answer-box");
    assert(modelBox !== null, `Card ${q.id} has .model-answer-box`);

    // Check Grading Action Buttons inside modelBox
    const actions = modelBox.querySelector(".grading-actions");
    assert(actions !== null, `Card ${q.id} has .grading-actions inside model box`);

    const btnIncorrect = actions.querySelector(".grading-btn.incorrect");
    const btnCorrect = actions.querySelector(".grading-btn.correct");
    assert(btnIncorrect !== null, `Card ${q.id} has Incorrect button`);
    assert(btnCorrect !== null, `Card ${q.id} has Correct button`);
    assert(btnIncorrect.classList.contains("active"), `Card ${q.id} Incorrect button initially active`);
    assert(!btnCorrect.classList.contains("active"), `Card ${q.id} Correct button initially inactive`);

    // Test Click Interaction: Mark Correct
    btnCorrect.click();
    assertEqual(state.selfGradedScores[q.id], 1, `Score for Q${q.id} is now 1`);
    assert(btnCorrect.classList.contains("active"), `Correct button is now active for Q${q.id}`);
    assert(!btnIncorrect.classList.contains("active"), `Incorrect button is now inactive for Q${q.id}`);
    assert(card.classList.contains("graded-correct"), `Card has class graded-correct`);
    assert(!card.classList.contains("graded-incorrect"), `Card does not have class graded-incorrect`);
    assert(statusPill.textContent.includes("Graded: 1 pt"), `Status pill updated to Graded: 1 pt`);

    // Test Click Interaction: Mark Incorrect
    btnIncorrect.click();
    assertEqual(state.selfGradedScores[q.id], 0, `Score for Q${q.id} is now 0 again`);
    assert(btnIncorrect.classList.contains("active"), `Incorrect button is active again`);
    assert(!btnCorrect.classList.contains("active"), `Correct button is inactive`);
    assert(card.classList.contains("graded-incorrect"), `Card has class graded-incorrect`);
    assert(statusPill.textContent.includes("Graded: 0 pts"), `Status pill updated to Graded: 0 pts`);
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: Auto-Graded Review Cards (R1)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] Auto-Graded Question Review Card Layout");

  const autoReviewListEl = mockDoc.getElementById("auto-questions-review-list");
  autoReviewListEl.children = [];

  const sampleAutoQ = {
    id: 1,
    module: "Cell Biology",
    type: "multiple-choice",
    question: "Which organelle performs beta-oxidation of very long-chain fatty acids?",
    options: ["A. Lysosome", "B. Smooth ER", "C. Peroxisome", "D. Mitochondrion"],
    correctAnswer: "C",
    explanation: "Peroxisomes contain enzymes for beta-oxidation of VLCFAs."
  };

  renderAutoReviewCard(sampleAutoQ, true, "C");

  const autoCard = autoReviewListEl.children[0];
  assert(autoCard !== null, "Auto review card created");
  assert(autoCard.classList.contains("review-item-card"), "Auto card has class review-item-card");
  assert(autoCard.classList.contains("correct"), "Auto card has class correct");

  const autoHeader = autoCard.querySelector(".review-card-header");
  assert(autoHeader !== null, "Auto card has .review-card-header");

  const autoMeta = autoHeader.querySelector(".review-card-meta");
  assert(autoMeta !== null, "Auto card has .review-card-meta");

  const autoId = autoMeta.querySelector(".review-card-id");
  assertEqual(autoId.textContent, "Question 1", "Auto card ID is 'Question 1'");

  const autoModule = autoMeta.querySelector(".review-module-pill");
  assertEqual(autoModule.textContent, "Cell Biology", "Auto card module pill is 'Cell Biology'");

  const autoType = autoMeta.querySelector(".review-type-pill");
  assertEqual(autoType.textContent, "Multiple Choice", "Auto card type pill is 'Multiple Choice'");

  const autoStatus = autoHeader.querySelector(".review-status-pill");
  assert(autoStatus.textContent.includes("Correct (+1 pt)"), "Auto card status pill shows Correct (+1 pt)");

  // ---------------------------------------------------------------------------
  // SUITE 4: Full Master Pool Empirical 7-Sim Verification (R2)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Empirical Verification across 7 Mock Exam Files (490 Questions)");

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

  let poolTotal = 0;
  let poolCB = 0;
  let poolHist = 0;
  let poolEmb = 0;
  let poolInd = 0;

  simFiles.forEach((fileInfo, i) => {
    const fp = mockDir + "/" + fileInfo.name;
    let rawText = "";
    if (fileInfo.type === "pdf") {
      rawText = extractPdfText(fp);
    } else {
      const nsPath = $(fp);
      const nsData = $.NSString.stringWithContentsOfFileEncodingError(nsPath, $.NSUTF8StringEncoding, null);
      rawText = ObjC.unwrap(nsData);
    }

    const questions = parseMockExamText(rawText);
    assertEqual(questions.length, 70, `Sim ${i+1} (${fileInfo.name}) has exactly 70 questions`);
    poolTotal += questions.length;

    const cb = questions.filter(q => q.module === "Cell Biology").length;
    const hist = questions.filter(q => q.module === "Histology").length;
    const emb = questions.filter(q => q.module === "Embryology").length;
    const ind = questions.filter(q => q.module === "Interdisciplinary").length;

    assertEqual(cb, 30, `Sim ${i+1} Cell Biology count is 30`);
    assertEqual(hist, 24, `Sim ${i+1} Histology count is 24`);
    assertEqual(emb, 12, `Sim ${i+1} Embryology count is 12`);
    assertEqual(ind, 4, `Sim ${i+1} Interdisciplinary count is 4`);

    poolCB += cb;
    poolHist += hist;
    poolEmb += emb;
    poolInd += ind;
  });

  assertEqual(poolTotal, 490, "Master pool total is 490 questions (7 x 70)");
  assertEqual(poolCB, 210, "Master pool Cell Biology total is exactly 210");
  assertEqual(poolHist, 168, "Master pool Histology total is exactly 168");
  assertEqual(poolEmb, 84, "Master pool Embryology total is exactly 84");
  assertEqual(poolInd, 28, "Master pool Interdisciplinary total is exactly 28");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  mockConsole.log("\n================================================================================");
  mockConsole.log(`VERIFICATION SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  return failed === 0 ? "SUCCESS" : "FAILURE";
}

runReviewCardAndCategorizationTests();
