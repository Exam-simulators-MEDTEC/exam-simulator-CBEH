// Independent Victory Audit Verification Script
// Independent execution via JavaScriptCore (osascript -l JavaScript)
// Project: CBEH Exam Simulator

function runIndependentVictoryAudit() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  const mockDir = projectRoot + "/Mock exams";
  
  // Read app.js directly from disk
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  let testsPassed = 0;
  let testsFailed = 0;
  const failureDetails = [];
  const phaseResults = {
    phaseA: { passed: true, notes: [] },
    phaseB: { passed: true, notes: [] },
    phaseC: { passed: true, notes: [] }
  };

  function log(msg) {
    $.NSFileHandle.fileHandleWithStandardOutput.writeData($(msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding));
  }
  function logErr(msg) {
    $.NSFileHandle.fileHandleWithStandardError.writeData($("ERROR: " + msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding));
  }

  function assert(phase, cond, testName, details) {
    if (cond) {
      testsPassed++;
      log("  [PASS] " + testName);
    } else {
      testsFailed++;
      phaseResults[phase].passed = false;
      const msg = testName + (details ? " -> " + details : "");
      phaseResults[phase].notes.push(msg);
      failureDetails.push({ phase: phase, test: testName, details: details || "Assertion failed" });
      logErr("  [FAIL] " + msg);
    }
  }

  function assertEqual(phase, actual, expected, testName) {
    if (actual === expected) {
      testsPassed++;
      log("  [PASS] " + testName);
    } else {
      testsFailed++;
      phaseResults[phase].passed = false;
      const msg = testName + " | Expected: " + JSON.stringify(expected) + " | Actual: " + JSON.stringify(actual);
      phaseResults[phase].notes.push(msg);
      failureDetails.push({ phase: phase, test: testName, expected: expected, actual: actual });
      logErr("  [FAIL] " + msg);
    }
  }

  log("================================================================================");
  log("        INDEPENDENT VICTORY AUDITOR VERIFICATION SUITE");
  log("================================================================================");

  // ============================================================================
  // SETUP MOCK DOM & ENVIRONMENT FOR APP.JS
  // ============================================================================
  class MockElement {
    constructor(tagName = "div") {
      this.tagName = tagName.toUpperCase();
      this.id = "";
      this.classList = {
        _set: new Set(),
        add: (...c) => c.forEach(cls => this.classList._set.add(cls)),
        remove: (...c) => c.forEach(cls => this.classList._set.delete(cls)),
        contains: (cls) => this.classList._set.has(cls),
        toggle: (cls) => {
          if (this.classList._set.has(cls)) {
            this.classList._set.delete(cls);
            return false;
          } else {
            this.classList._set.add(cls);
            return true;
          }
        }
      };
      this.style = {};
      this.attributes = {};
      this.dataset = {};
      this.children = [];
      this.parentElement = null;
      this.textContent = "";
      this._innerHTML = "";
      this.listeners = {};
    }

    get className() {
      return Array.from(this.classList._set).join(" ");
    }
    set className(val) {
      this.classList._set.clear();
      if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList._set.add(c));
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
  const mockStorage = {
    getItem: (k) => mockLocalStorage[k] !== undefined ? mockLocalStorage[k] : null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; },
    clear: () => { for (let k in mockLocalStorage) delete mockLocalStorage[k]; }
  };

  const elementsById = {};
  const mockDoc = {
    body: new MockElement("body"),
    getElementById: (id) => {
      if (!elementsById[id]) {
        const el = new MockElement("div");
        el.id = id;
        elementsById[id] = el;
      }
      return elementsById[id];
    },
    querySelector: (sel) => {
      if (sel.startsWith("#")) return mockDoc.getElementById(sel.substring(1));
      return mockDoc.body.querySelector(sel) || new MockElement("div");
    },
    querySelectorAll: (sel) => mockDoc.body.querySelectorAll(sel),
    createElement: (tag) => {
      const el = new MockElement(tag);
      if (tag.toLowerCase() === "a") {
        el.click = () => {
          if (el.download && el.download.includes("CBEH_Exam_Results")) {
            pdfClicked = true;
          }
        };
      }
      return el;
    },
    addEventListener: (evt, cb) => {
      if (evt === "DOMContentLoaded") {
        try { cb(); } catch(e) {}
      }
    }
  };

  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    scrollTo: () => {},
    URL: {
      createObjectURL: () => "blob:mock-pdf-url",
      revokeObjectURL: () => {}
    },
    Blob: function(parts, options) {
      this.parts = parts;
      this.options = options;
    },
    addEventListener: ()=>{}
  };

  // Load and evaluate app.js in sandbox
  const evalAppJs = new Function("window", "document", "localStorage", "console", "URL", "Blob", `
    var globalObj = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this);
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    globalObj.URL = URL;
    globalObj.Blob = Blob;
    if (typeof URL === "undefined") {
      URL = globalObj.URL;
    }
    if (typeof Blob === "undefined") {
      Blob = globalObj.Blob;
    }
    ${appJsCode}
    return {
      getModuleFromQuestionId: globalObj.getModuleFromQuestionId || window.getModuleFromQuestionId,
      cleanQuestionPromptText: globalObj.cleanQuestionPromptText || window.cleanQuestionPromptText,
      sanitizeQuestion: globalObj.sanitizeQuestion || window.sanitizeQuestion,
      sanitizeQuestionPool: globalObj.sanitizeQuestionPool || window.sanitizeQuestionPool,
      parseMockExamText: globalObj.parseMockExamText || window.parseMockExamText,
      applyReviewListPagination: globalObj.applyReviewListPagination || window.applyReviewListPagination,
      evaluateQuestionResult: globalObj.evaluateQuestionResult || window.evaluateQuestionResult,
      state: globalObj.state || window.state
    };
  `);

  const app = evalAppJs(mockWindow, mockDoc, mockStorage, {
    log: ()=>{},
    warn: ()=>{},
    error: ()=>{}
  }, mockWindow.URL, mockWindow.Blob);

  const getModuleFromQuestionId = app.getModuleFromQuestionId;
  const cleanQuestionPromptText = app.cleanQuestionPromptText;
  const sanitizeQuestion = app.sanitizeQuestion;
  const sanitizeQuestionPool = app.sanitizeQuestionPool;
  const parseMockExamText = app.parseMockExamText;
  const applyReviewListPagination = app.applyReviewListPagination;
  const state = app.state;

  // ============================================================================
  // PHASE B: ANTI-CHEATING & INTEGRITY VERIFICATION
  // ============================================================================
  log("\n--- PHASE B: ANTI-CHEATING & INTEGRITY DETECTION ---");
  
  assert("phaseB", typeof getModuleFromQuestionId === "function", "getModuleFromQuestionId is an authentic function");
  assert("phaseB", typeof cleanQuestionPromptText === "function", "cleanQuestionPromptText is an authentic function");
  assert("phaseB", typeof sanitizeQuestion === "function", "sanitizeQuestion is an authentic function");
  assert("phaseB", typeof sanitizeQuestionPool === "function", "sanitizeQuestionPool is an authentic function");
  assert("phaseB", typeof parseMockExamText === "function", "parseMockExamText is an authentic function");
  assert("phaseB", typeof applyReviewListPagination === "function", "applyReviewListPagination is an authentic function");

  // Check no facade: verify that functions do real computation
  assertEqual("phaseB", getModuleFromQuestionId(1), "Cell Biology", "getModuleFromQuestionId(1) returns Cell Biology");
  assertEqual("phaseB", getModuleFromQuestionId(30), "Cell Biology", "getModuleFromQuestionId(30) returns Cell Biology");
  assertEqual("phaseB", getModuleFromQuestionId(31), "Histology", "getModuleFromQuestionId(31) returns Histology");
  assertEqual("phaseB", getModuleFromQuestionId(54), "Histology", "getModuleFromQuestionId(54) returns Histology");
  assertEqual("phaseB", getModuleFromQuestionId(55), "Embryology", "getModuleFromQuestionId(55) returns Embryology");
  assertEqual("phaseB", getModuleFromQuestionId(66), "Embryology", "getModuleFromQuestionId(66) returns Embryology");
  assertEqual("phaseB", getModuleFromQuestionId(67), "Interdisciplinary", "getModuleFromQuestionId(67) returns Interdisciplinary");
  assertEqual("phaseB", getModuleFromQuestionId(70), "Interdisciplinary", "getModuleFromQuestionId(70) returns Interdisciplinary");

  // Modulo 70 range tests for multi-simulation pools
  assertEqual("phaseB", getModuleFromQuestionId(71), "Cell Biology", "getModuleFromQuestionId(71) wraps to Cell Biology");
  assertEqual("phaseB", getModuleFromQuestionId(101), "Histology", "getModuleFromQuestionId(101) wraps to Histology");
  assertEqual("phaseB", getModuleFromQuestionId(125), "Embryology", "getModuleFromQuestionId(125) wraps to Embryology");
  assertEqual("phaseB", getModuleFromQuestionId(137), "Interdisciplinary", "getModuleFromQuestionId(137) wraps to Interdisciplinary (Sim 2 Q67)");
  assertEqual("phaseB", getModuleFromQuestionId(140), "Interdisciplinary", "getModuleFromQuestionId(140) wraps to Interdisciplinary (Sim 2 Q70)");
  assertEqual("phaseB", getModuleFromQuestionId(487), "Interdisciplinary", "getModuleFromQuestionId(487) wraps to Interdisciplinary (Sim 7 Q67)");
  assertEqual("phaseB", getModuleFromQuestionId(490), "Interdisciplinary", "getModuleFromQuestionId(490) wraps to Interdisciplinary (Sim 7 Q70)");

  // Edge cases
  assertEqual("phaseB", getModuleFromQuestionId(0), "Cell Biology", "getModuleFromQuestionId(0) safely falls back");
  assertEqual("phaseB", getModuleFromQuestionId(-5), "Cell Biology", "getModuleFromQuestionId(-5) safely falls back");
  assertEqual("phaseB", getModuleFromQuestionId("invalid"), "Cell Biology", "getModuleFromQuestionId('invalid') safely falls back");

  // ============================================================================
  // PHASE C: REQUIREMENT R1 INDEPENDENT VERIFICATION
  // ============================================================================
  log("\n--- PHASE C.1: REQUIREMENT R1 (INTERDISCIPLINARY CLASSIFICATION & SANITIZATION) ---");

  // Adversarial Prompt Cleaning Tests
  const promptTests = [
    {
      raw: "70. and cellular energy is generated primarily by mitochondria.",
      expected: "Cellular energy is generated primarily by mitochondria.",
      desc: "Cleans leading question number and orphaned 'and' conjunction"
    },
    {
      raw: "MODULE 4: INTERDISCIPLINARY - 67. Which organelle participates in both lipid metabolism and detoxification?",
      expected: "Which organelle participates in both lipid metabolism and detoxification?",
      desc: "Strips module headers and retains question"
    },
    {
      raw: "--- PART IV: INTERDISCIPLINARY (4 Questions) ---\n68. (Multiple Choice) Which junction...",
      expected: "Which junction...",
      desc: "Strips complex part headers, question types, and whitespace"
    },
    {
      raw: "69. and also as well as & the structural organization of chromosomes",
      expected: "The structural organization of chromosomes",
      desc: "Strips multiple chained conjunctions"
    },
    {
      raw: "70. with in for of by at on from that which whereas while because the smooth ER",
      expected: "Smooth ER",
      desc: "Strips chained lowercase preposition fragments"
    },
    {
      raw: "Which of the following cellular components is essential for cytokinesis?",
      expected: "Which of the following cellular components is essential for cytokinesis?",
      desc: "Preserves genuine interrogative phrase 'Which of the following'"
    },
    {
      raw: "34. (Fill in the Gap) The resident macrophage cells found specifically within the liver sinusoids are known as ________ cells.",
      expected: "The resident macrophage cells found specifically within the liver sinusoids are known as ________ cells.",
      desc: "Preserves underline fill-in-the-gap blank"
    },
    {
      raw: "[Interdisciplinary] 70. Describe the cross-talk between...",
      expected: "Describe the cross-talk between...",
      desc: "Strips bracketed topic headers"
    }
  ];

  promptTests.forEach(pt => {
    const cleaned = cleanQuestionPromptText(pt.raw);
    assertEqual("phaseC", cleaned, pt.expected, "Prompt Sanitization: " + pt.desc);
  });

  // Test sanitizeQuestion
  const sampleQ = {
    id: 68,
    module: "WrongModule",
    question: "68. and explain the functional significance of the blood-thymus barrier.",
    options: ["ASertoli cells", "BDefault choice", "CChondrocytes", "DRestriction point"]
  };
  sanitizeQuestion(sampleQ);
  assertEqual("phaseC", sampleQ.module, "Interdisciplinary", "sanitizeQuestion sets module to Interdisciplinary for ID 68");
  assertEqual("phaseC", sampleQ.question, "Explain the functional significance of the blood-thymus barrier.", "sanitizeQuestion cleans question prompt text");
  assertEqual("phaseC", sampleQ.options[0], "Sertoli cells", "sanitizeQuestion cleans glued option letter prefix ASertoli -> Sertoli");
  assertEqual("phaseC", sampleQ.options[1], "Default choice", "sanitizeQuestion cleans glued option letter prefix BDefault -> Default");

  // Biological acronym preservation test
  const achQ = {
    id: 15,
    module: "Cell Biology",
    question: "What is the receptor type?",
    options: ["A. ACh receptors", "B. Beta blockers", "C. Calcium channels", "D. Dopamine transporters"]
  };
  sanitizeQuestion(achQ);
  assertEqual("phaseC", achQ.options[0], "ACh receptors", "Preserves biological acronym ACh receptors without truncating 'A'");

  // Helper: Extract text from PDF using macOS native PDFKit
  function extractPdfText(filepath) {
    try {
      ObjC.import("PDFKit");
      ObjC.import("Foundation");
      const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(filepath));
      if (doc) {
        return ObjC.unwrap(doc.string);
      }
    } catch(e) {}
    return "";
  }

  // Helper: Read Markdown / text file
  function readTextFile(filepath) {
    const nsPath = $(filepath);
    const nsData = $.NSString.stringWithContentsOfFileEncodingError(nsPath, $.NSUTF8StringEncoding, null);
    return ObjC.unwrap(nsData);
  }

  // Parse all 7 simulations from Mock exams folder
  log("\n--- PHASE C.2: EMPIRICAL PARSING OF ALL 7 SIMULATION FILES ---");
  const simFiles = [
    { name: "CBEH simulation 1 .pdf", type: "pdf" },
    { name: "CBEH simulation 2.pdf", type: "pdf" },
    { name: "CBEH_simulation_3.pdf", type: "pdf" },
    { name: "CBEH_simulation_4.md", type: "md" },
    { name: "CBEH_simulation_5.pdf", type: "pdf" },
    { name: "CBEH_simulation_6.pdf", type: "pdf" },
    { name: "CBEH_simulation_7.md", type: "md" }
  ];

  let totalQuestionsCount = 0;
  let totalInterdisciplinaryCount = 0;
  let totalCellBioCount = 0;
  let totalHistologyCount = 0;
  let totalEmbryologyCount = 0;

  simFiles.forEach((fileInfo, simIdx) => {
    const fullPath = mockDir + "/" + fileInfo.name;
    let fileText = fileInfo.type === "pdf" ? extractPdfText(fullPath) : readTextFile(fullPath);
    
    assert("phaseC", fileText && fileText.length > 500, `Simulation ${simIdx+1} file read successfully (${fileInfo.name}, length=${fileText.length})`);
    
    const parsed = parseMockExamText(fileText);
    assertEqual("phaseC", parsed.length, 70, `Simulation ${simIdx+1} (${fileInfo.name}) parsed exactly 70 questions`);
    totalQuestionsCount += parsed.length;

    // Check module counts
    const cb = parsed.filter(q => q.module === "Cell Biology");
    const hist = parsed.filter(q => q.module === "Histology");
    const emb = parsed.filter(q => q.module === "Embryology");
    const ind = parsed.filter(q => q.module === "Interdisciplinary");

    assertEqual("phaseC", cb.length, 30, `Simulation ${simIdx+1} Cell Biology count is 30`);
    assertEqual("phaseC", hist.length, 24, `Simulation ${simIdx+1} Histology count is 24`);
    assertEqual("phaseC", emb.length, 12, `Simulation ${simIdx+1} Embryology count is 12`);
    assertEqual("phaseC", ind.length, 4, `Simulation ${simIdx+1} Interdisciplinary count is 4 (Q67-Q70)`);

    totalCellBioCount += cb.length;
    totalHistologyCount += hist.length;
    totalEmbryologyCount += emb.length;
    totalInterdisciplinaryCount += ind.length;

    // Check individual questions 67-70 specifically
    const q67 = parsed.find(q => q.id === 67);
    const q68 = parsed.find(q => q.id === 68);
    const q69 = parsed.find(q => q.id === 69);
    const q70 = parsed.find(q => q.id === 70);

    assertEqual("phaseC", q67 ? q67.module : null, "Interdisciplinary", `Simulation ${simIdx+1} Q67 module is Interdisciplinary`);
    assertEqual("phaseC", q68 ? q68.module : null, "Interdisciplinary", `Simulation ${simIdx+1} Q68 module is Interdisciplinary`);
    assertEqual("phaseC", q69 ? q69.module : null, "Interdisciplinary", `Simulation ${simIdx+1} Q69 module is Interdisciplinary`);
    assertEqual("phaseC", q70 ? q70.module : null, "Interdisciplinary", `Simulation ${simIdx+1} Q70 module is Interdisciplinary`);

    // Verify all 70 questions in this simulation have clean prompts
    parsed.forEach(q => {
      const prompt = q.question || "";
      assert("phaseC", !/^(?:and|or|but|also|as well as|&)\s+/i.test(prompt), `Sim ${simIdx+1} Q${q.id} prompt has no leading orphaned conjunction: "${prompt.substring(0, 30)}"`);
      assert("phaseC", !/^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)/i.test(prompt), `Sim ${simIdx+1} Q${q.id} prompt does not leak module headers`);
      assert("phaseC", prompt.length > 5, `Sim ${simIdx+1} Q${q.id} prompt has substantial text`);
    });
  });

  // Verify grand totals across all 7 simulations
  assertEqual("phaseC", totalQuestionsCount, 490, "Grand total questions across 7 simulations is 490");
  assertEqual("phaseC", totalCellBioCount, 210, "Grand total Cell Biology questions is 210 (30 x 7)");
  assertEqual("phaseC", totalHistologyCount, 168, "Grand total Histology questions is 168 (24 x 7)");
  assertEqual("phaseC", totalEmbryologyCount, 84, "Grand total Embryology questions is 84 (12 x 7)");
  assertEqual("phaseC", totalInterdisciplinaryCount, 28, "Grand total Interdisciplinary questions is exactly 28 (4 x 7)");

  // ============================================================================
  // PHASE C: REQUIREMENT R2 INDEPENDENT VERIFICATION (RESULTS PAGINATION)
  // ============================================================================
  log("\n--- PHASE C.3: REQUIREMENT R2 (RESULTS REVIEW PAGINATION & COMPACT ACTIONS) ---");

  // Test applyReviewListPagination on Auto-Questions Review List (70 items)
  const containerId = "auto-questions-review-list";
  const autoContainer = mockDoc.getElementById(containerId);
  autoContainer.children = [];

  // Populate container with 70 review-item-card elements
  for (let i = 1; i <= 70; i++) {
    const card = mockDoc.createElement("div");
    card.className = "review-item-card";
    card.id = `review-card-${i}`;
    autoContainer.appendChild(card);
  }

  // Setup mock action targets
  let homeClicked = false;
  let restartClicked = false;
  let pdfClicked = false;

  const btnHomeMock = mockDoc.getElementById("btn-home-results");
  btnHomeMock.addEventListener("click", () => { homeClicked = true; });

  const btnRestartMock = mockDoc.getElementById("btn-restart-exam");
  btnRestartMock.addEventListener("click", () => { restartClicked = true; });

  mockWindow.generateAndDownloadResultsPDF = () => { pdfClicked = true; };

  // Reset pagination state
  state.reviewPagination = {};

  // Apply pagination
  applyReviewListPagination(containerId);

  // Verification 1: Exactly 3 preview cards visible initially
  const cards = autoContainer.querySelectorAll(".review-item-card");
  assertEqual("phaseC", cards.length, 70, "Review container has 70 cards");

  let visibleCountInitial = 0;
  let hiddenCountInitial = 0;
  cards.forEach((card, idx) => {
    if (idx < 3) {
      if (card.style.display !== "none") visibleCountInitial++;
    } else {
      if (card.style.display === "none") hiddenCountInitial++;
    }
  });

  assertEqual("phaseC", visibleCountInitial, 3, "Exactly 3 preview cards are initially visible");
  assertEqual("phaseC", hiddenCountInitial, 67, "Remaining 67 preview cards are initially hidden (display: none)");

  // Verification 2: Pagination control box exists
  const paginationControl = autoContainer.querySelector(".review-pagination-control");
  assert("phaseC", paginationControl !== null, "Pagination control element .review-pagination-control exists");

  // Verification 3: Toggle button exists with correct label and aria-expanded
  const btnShowMore = autoContainer.querySelector(`#btn-show-more-${containerId}`);
  assert("phaseC", btnShowMore !== null, "Show More button exists");
  assertEqual("phaseC", btnShowMore.getAttribute("aria-expanded"), "false", "Show More button aria-expanded is 'false' initially");
  assert("phaseC", btnShowMore.innerHTML.includes("Show More Questions (67 remaining)"), "Show More button label shows remaining count (67 remaining)");

  // Verification 4: Compact Actions Container and all 3 buttons exist
  const compactActions = autoContainer.querySelector(".results-compact-actions");
  assert("phaseC", compactActions !== null, "Compact actions container .results-compact-actions exists");

  const btnCompactHome = autoContainer.querySelector(`#btn-compact-home-${containerId}`);
  const btnCompactRestart = autoContainer.querySelector(`#btn-compact-restart-${containerId}`);
  const btnCompactPdf = autoContainer.querySelector(`#btn-compact-pdf-${containerId}`);

  assert("phaseC", btnCompactHome !== null, "Compact 'Return Home' button is present");
  assert("phaseC", btnCompactRestart !== null, "Compact 'Retake Another Exam' button is present");
  assert("phaseC", btnCompactPdf !== null, "Compact 'Download Study Summary (PDF)' button is present");

  assert("phaseC", btnCompactHome.innerHTML.includes("Return Home"), "Return Home button has correct text");
  assert("phaseC", btnCompactRestart.innerHTML.includes("Retake Another Exam"), "Retake Another Exam button has correct text");
  assert("phaseC", btnCompactPdf.innerHTML.includes("Download Study Summary (PDF)"), "Download PDF button has correct text");

  // Verification 5: Toggle expansion -> Click "Show More Questions"
  btnShowMore.click();

  let visibleCountExpanded = 0;
  cards.forEach(card => {
    if (card.style.display !== "none") visibleCountExpanded++;
  });

  assertEqual("phaseC", visibleCountExpanded, 70, "Clicking 'Show More' displays all 70 cards");
  assertEqual("phaseC", btnShowMore.getAttribute("aria-expanded"), "true", "Show More button aria-expanded is 'true' after click");
  assert("phaseC", btnShowMore.innerHTML.includes("Show Fewer Questions"), "Button label changed to 'Show Fewer Questions'");
  assert("phaseC", cards[3].classList.contains("review-card-revealed"), "Revealed card has .review-card-revealed animation class");

  // Verification 6: Toggle collapse -> Click "Show Fewer Questions"
  btnShowMore.click();

  let visibleCountCollapsed = 0;
  let hiddenCountCollapsed = 0;
  cards.forEach((card, idx) => {
    if (idx < 3) {
      if (card.style.display !== "none") visibleCountCollapsed++;
    } else {
      if (card.style.display === "none") hiddenCountCollapsed++;
    }
  });

  assertEqual("phaseC", visibleCountCollapsed, 3, "Clicking 'Show Fewer' collapses back to 3 visible preview cards");
  assertEqual("phaseC", hiddenCountCollapsed, 67, "Remaining 67 cards are hidden again on collapse");
  assertEqual("phaseC", btnShowMore.getAttribute("aria-expanded"), "false", "Button aria-expanded is 'false' after collapse");

  // Verification 7: Action buttons click event routing
  btnCompactHome.click();
  assertEqual("phaseC", homeClicked, true, "Clicking compact Return Home button dispatches navigation click");

  btnCompactRestart.click();
  assertEqual("phaseC", restartClicked, true, "Clicking compact Retake Exam button dispatches restart click");

  state.questions = [{ id: 1, type: "multiple-choice", question: "Test question prompt", options: ["A. 1", "B. 2"], correctAnswer: "A", module: "Cell Biology" }];
  btnCompactPdf.click();
  assertEqual("phaseC", pdfClicked, true, "Clicking compact Download PDF button dispatches PDF generation");

  // Verification 8: Small lists (<= 3 items) do NOT render pagination control
  const smallContainerId = "open-questions-grading-list";
  const smallContainer = mockDoc.getElementById(smallContainerId);
  smallContainer.children = [];

  for (let i = 1; i <= 3; i++) {
    const card = mockDoc.createElement("div");
    card.className = "grading-item-card";
    smallContainer.appendChild(card);
  }

  applyReviewListPagination(smallContainerId);
  const smallPaginationControl = smallContainer.querySelector(".review-pagination-control");
  assertEqual("phaseC", smallPaginationControl, null, "Small list (<= 3 cards) does NOT render pagination control");
  
  const smallCards = smallContainer.querySelectorAll(".grading-item-card");
  assertEqual("phaseC", smallCards.length, 3, "All 3 cards in small list remain visible");

  // ============================================================================
  // FINAL VERDICT & SUMMARY
  // ============================================================================
  log("\n================================================================================");
  log(`AUDIT EXECUTION SUMMARY: Total Tests: ${testsPassed + testsFailed} | Passed: ${testsPassed} | Failed: ${testsFailed}`);
  log("================================================================================");

  const overallVerdict = testsFailed === 0 ? "VICTORY CONFIRMED" : "VICTORY REJECTED";
  log(`OVERALL VERDICT: ${overallVerdict}`);

  return {
    verdict: overallVerdict,
    testsPassed: testsPassed,
    testsFailed: testsFailed,
    failureDetails: failureDetails,
    phaseResults: phaseResults,
    totals: {
      totalQuestions: totalQuestionsCount,
      totalCellBio: totalCellBioCount,
      totalHistology: totalHistologyCount,
      totalEmbryology: totalEmbryologyCount,
      totalInterdisciplinary: totalInterdisciplinaryCount
    }
  };
}

const auditResult = runIndependentVictoryAudit();
const resultOutput = JSON.stringify(auditResult, null, 2);
$.NSFileHandle.fileHandleWithStandardOutput.writeData($("\n=== AUDIT_JSON_RESULT_START ===\n" + resultOutput + "\n=== AUDIT_JSON_RESULT_END ===\n").dataUsingEncoding($.NSUTF8StringEncoding));
