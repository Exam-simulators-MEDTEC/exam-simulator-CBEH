/**
 * VICTORY AUDITOR INDEPENDENT ADVERSARIAL VERIFICATION SUITE
 * Independent forensic test suite designed to rigorously challenge and verify
 * all requirements in ORIGINAL_REQUEST.md.
 */

function runVictoryAuditorTests() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";

  // Read app.js, index.html, index.css, questions.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  const indexHtmlPath = $(projectRoot + "/index.html");
  const indexHtmlData = $.NSString.stringWithContentsOfFileEncodingError(indexHtmlPath, $.NSUTF8StringEncoding, null);
  const indexHtmlCode = ObjC.unwrap(indexHtmlData);

  const indexCssPath = $(projectRoot + "/index.css");
  const indexCssData = $.NSString.stringWithContentsOfFileEncodingError(indexCssPath, $.NSUTF8StringEncoding, null);
  const indexCssCode = ObjC.unwrap(indexCssData);

  const questionsJsPath = $(projectRoot + "/questions.js");
  const questionsJsData = $.NSString.stringWithContentsOfFileEncodingError(questionsJsPath, $.NSUTF8StringEncoding, null);
  const questionsJsCode = ObjC.unwrap(questionsJsData);

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
  mockConsole.log("   VICTORY AUDITOR: INDEPENDENT ADVERSARIAL VERIFICATION RUNNER");
  mockConsole.log("================================================================================");

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
      this.value = "";
      this.disabled = false;
    }

    get textContent() {
      if (this.children.length > 0) {
        return (this._textContent + " " + this.children.map(c => c.textContent).join(" ")).replace(/\s+/g, " ").trim();
      }
      return this._textContent.replace(/\s+/g, " ").trim();
    }
    set textContent(val) {
      this._textContent = String(val !== undefined && val !== null ? val : "");
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
      this._textContent = "";
      if (html) {
        parseHTMLToNodes(html, this);
      }
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

    focus() { this._focused = true; }
    scrollIntoView(options) { this._scrolled = options || true; }

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
  }

  function parseHTMLToNodes(html, parent) {
    const tagTokenRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)((?:\s+[^=>\s]+(?:=(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/)?>|([^<]+)/g;
    let match;
    const stack = [parent];

    while ((match = tagTokenRegex.exec(html)) !== null) {
      const isComment = match[0].startsWith("<!--");
      if (isComment) continue;

      const isCloseTag = match[1] === "/";
      const tagName = match[2];
      const rawAttrs = match[3];
      const isSelfClosing = match[4] === "/" || ["img", "input", "br", "hr"].includes((tagName || "").toLowerCase());
      const textContent = match[5];

      if (textContent) {
        const current = stack[stack.length - 1];
        if (current) {
          current.textContent = (current.textContent || "") + " " + textContent.trim();
        }
      } else if (isCloseTag) {
        if (stack.length > 1) {
          stack.pop();
        }
      } else if (tagName) {
        const el = new MockElement(tagName);
        el.parentElement = stack[stack.length - 1];
        
        if (rawAttrs) {
          const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:"([^"]*)"|'([^']*'|[^>\s]+)))?/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
            const attrName = attrMatch[1];
            let attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : "");
            if (attrVal.startsWith('"') || attrVal.startsWith("'")) attrVal = attrVal.slice(1, -1);
            el.setAttribute(attrName, attrVal);
            if (attrName.toLowerCase() === "id") el.id = attrVal;
            if (attrName.toLowerCase() === "class") el.className = attrVal;
            if (attrName.startsWith("data-")) el.dataset[attrName.substring(5)] = attrVal;
          }
        }

        const currentParent = stack[stack.length - 1];
        if (currentParent) {
          currentParent.children.push(el);
        }

        if (!isSelfClosing) {
          stack.push(el);
        }
      }
    }
  }

  let mockLocalStorage = {};
  const mockElementsById = {};

  const mockDoc = {
    body: new MockElement("body"),
    getElementById: function(id) {
      if (mockDoc.body) {
        const found = mockDoc.body.querySelector("#" + id);
        if (found) return found;
      }
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
    addEventListener: function(evt, cb) {}
  };

  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    listeners: {},
    addEventListener: function(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    },
    dispatchEvent: function(event) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach(cb => cb(event));
      }
    },
    scrollTo: function() {}
  };

  const globalScope = {
    window: mockWindow,
    document: mockDoc,
    localStorage: mockWindow.localStorage,
    console: mockConsole,
    setTimeout: mockWindow.setTimeout,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    Blob: function(parts, opts) { this.parts = parts; this.opts = opts; },
    URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} }
  };

  // Seed DOM tree with HTML elements from index.html
  const requiredIds = [
    "welcome-tab-settings", "welcome-tab-bookmarks", "welcome-tab-analytics", "welcome-tab-database",
    "welcome-panel-settings", "welcome-panel-bookmarks", "welcome-panel-analytics", "welcome-panel-database",
    "analytics-dynamic-content", "btn-reset-analytics", "practice-mode-select", "btn-start-exam",
    "screen-welcome", "screen-exam", "screen-results", "pool-status-count", "pool-status-sims", "simulations-list-container",
    "upload-dropzone", "pdf-file-input", "upload-status", "btn-reset-pool", "upload-log",
    "bookmarks-list", "btn-start-bookmarks-quiz", "dbSearchInput", "dbSearchClear", "dbModuleFilter",
    "dbTypeFilter", "dbBookmarkFilterBtn", "dbResetFiltersBtn", "db-stats-bar", "db-stats-text",
    "db-match-count", "db-total-count", "database-groups-container", "btn-resume-exam",
    "question-index-counter", "question-module-badge", "btn-home-exam", "timer-box", "exam-timer",
    "question-card", "question-text", "answer-inputs-area", "flag-label-container", "flag-checkbox",
    "btn-bookmark-question", "btn-prev-question", "btn-next-question", "questions-grid-container",
    "btn-submit-exam", "result-status-badge", "result-grade-display", "result-score-summary",
    "btn-home-results-top", "downloadPdfBtnTop", "card-result-cellbio", "score-cellbio", "status-cellbio",
    "card-result-histology", "score-histology", "status-histology", "card-result-embryo", "score-embryo",
    "status-embryo", "card-result-interdisciplinary", "score-interdisciplinary", "status-interdisciplinary",
    "tab-btn-grading", "tab-btn-review", "tab-content-grading", "tab-content-review", "open-questions-grading-list",
    "auto-questions-review-list", "downloadPdfBtn", "btn-restart-exam", "btn-home-results",
    "custom-modal-overlay", "custom-modal-message", "custom-modal-btn-cancel", "custom-modal-btn-confirm"
  ];
  requiredIds.forEach(id => {
    const el = mockDoc.getElementById(id);
    mockDoc.body.appendChild(el);
  });

  const dynamicContent = mockDoc.getElementById("analytics-dynamic-content");
  const btnReset = mockDoc.getElementById("btn-reset-analytics");
  const practiceSelect = mockDoc.getElementById("practice-mode-select");
  const btnStartExam = mockDoc.getElementById("btn-start-exam");

  const testFn = new Function("window", "document", "localStorage", "console", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    ${appJsCode}
    return {
      calculateAnalyticsSummary: window.calculateAnalyticsSummary || globalObj.calculateAnalyticsSummary,
      getModuleStudyRecommendations: window.getModuleStudyRecommendations || globalObj.getModuleStudyRecommendations,
      getModuleBadgeTagAndClass: window.getModuleBadgeTagAndClass || globalObj.getModuleBadgeTagAndClass,
      renderAnalyticsTrendChart: window.renderAnalyticsTrendChart || globalObj.renderAnalyticsTrendChart,
      updateAnalyticsUI: window.updateAnalyticsUI || globalObj.updateAnalyticsUI,
      isAttemptPassed: window.isAttemptPassed || globalObj.isAttemptPassed,
      getModuleScoreEntry: window.getModuleScoreEntry || globalObj.getModuleScoreEntry,
      formatAttemptGradeDisplay: window.formatAttemptGradeDisplay || globalObj.formatAttemptGradeDisplay,
      safeGetLocalStorageArray: window.safeGetLocalStorageArray || globalObj.safeGetLocalStorageArray,
      getModuleFromQuestionId: window.getModuleFromQuestionId || globalObj.getModuleFromQuestionId,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText,
      state: window.state || globalObj.state
    };
  `);

  const mockScope = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = String(v); },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  // ==========================================
  // PHASE A: TIMELINE & PROVENANCE AUDIT
  // ==========================================
  mockConsole.log("\n[PHASE A] Timeline & Provenance Static Verification");
  assert(indexHtmlCode.includes('id="welcome-panel-analytics"'), "index.html contains analytics panel");
  assert(indexHtmlCode.includes('id="welcome-tab-analytics"'), "index.html contains analytics tab button");
  assert(indexHtmlCode.includes('id="analytics-dynamic-content"'), "index.html contains dynamic container");
  assert(indexHtmlCode.includes('id="btn-reset-analytics"'), "index.html contains reset history button");
  assert(indexCssCode.includes(".analytics-dashboard"), "index.css defines .analytics-dashboard");
  assert(indexCssCode.includes(".analytics-metric-card"), "index.css defines .analytics-metric-card");
  assert(indexCssCode.includes(".analytics-module-card"), "index.css defines .analytics-module-card");
  assert(indexCssCode.includes(".weakspot-card"), "index.css defines .weakspot-card");
  assert(indexCssCode.includes(".trend-bar-fill"), "index.css defines .trend-bar-fill");
  assert(indexCssCode.includes(".analytics-empty-state"), "index.css defines .analytics-empty-state");

  // ==========================================
  // PHASE B: INTEGRITY & ANTI-CHEATING FORENSICS
  // ==========================================
  mockConsole.log("\n[PHASE B] Integrity & Anti-Cheating Forensics");
  const calcFn = mockScope.calculateAnalyticsSummary;
  assert(typeof calcFn === "function", "calculateAnalyticsSummary exists and is a function");

  // Verify pure math on dynamic data (no hardcoded returns)
  const randA = Math.floor(Math.random() * 20) + 10;
  const randB = Math.floor(Math.random() * 20) + 10;
  const dynamicTest = [
    { totalScore: randA, totalQuestions: 70, isPassed: true, moduleScores: { "Cell Biology": { score: randA, total: 30 } } },
    { totalScore: randB, totalQuestions: 70, isPassed: false, moduleScores: { "Cell Biology": { score: randB, total: 30 } } }
  ];
  const dynamicRes = calcFn(dynamicTest);
  assertEqual(dynamicRes.totalCorrectAnswers, randA + randB, "Dynamic score sum is purely calculated");
  assertEqual(dynamicRes.passRate, 50, "Pass rate is 50% for 1 pass / 1 fail");
  assertEqual(dynamicRes.totalQuestionsAnswered, 140, "Total questions answered is 140");

  // ==========================================
  // PHASE C: INDEPENDENT TEST & ACCEPTANCE VERIFICATION
  // ==========================================
  mockConsole.log("\n[PHASE C] Independent Acceptance & Stress Verification");

  // 1. Empty State
  mockScope.state.history = [];
  mockScope.updateAnalyticsUI();
  const emptyTitle = dynamicContent.querySelector("h4");
  assert(emptyTitle && emptyTitle.textContent.includes("No Exam History Recorded"), "Empty state renders 'No Exam History Recorded'");
  const emptyCta = dynamicContent.querySelector("#btn-analytics-take-exam");
  assert(emptyCta && emptyCta.textContent.includes("Take Your First Exam"), "Empty state renders 'Take Your First Exam' CTA");
  assert(btnReset.disabled === true, "Reset button disabled when history is empty");

  // 2. Full Simulation Data Aggregation
  const fullAttempts = [
    {
      id: "sim-1",
      date: "2026-08-20T10:00:00Z",
      mode: "Full Simulation",
      totalScore: 50,
      totalQuestions: 70,
      grade: "21.5 / 30",
      isPassed: true,
      moduleScores: {
        "Cell Biology": { score: 25, total: 30 }, // 83.3%
        "Histology": { score: 15, total: 24 },    // 62.5%
        "Embryology": { score: 7, total: 12 },     // 58.3% (<60%)
        "Interdisciplinary": { score: 3, total: 4 } // 75.0%
      }
    },
    {
      id: "sim-2",
      date: "2026-08-21T10:00:00Z",
      mode: "Full Simulation",
      totalScore: 60,
      totalQuestions: 70,
      grade: "27 / 30",
      isPassed: true,
      moduleScores: {
        "Cell Biology": { score: 28, total: 30 }, // 93.3%
        "Histology": { score: 20, total: 24 },    // 83.3%
        "Embryology": { score: 8, total: 12 },     // 66.7%
        "Interdisciplinary": { score: 4, total: 4 } // 100%
      }
    },
    {
      id: "sim-3",
      date: "2026-08-22T10:00:00Z",
      mode: "Full Simulation",
      totalScore: 35,
      totalQuestions: 70,
      grade: "FAIL",
      isPassed: false,
      moduleScores: {
        "Cell Biology": { score: 18, total: 30 }, // 60.0%
        "Histology": { score: 10, total: 24 },    // 41.7%
        "Embryology": { score: 5, total: 12 },     // 41.7%
        "Interdisciplinary": { score: 2, total: 4 } // 50.0%
      }
    }
  ];

  mockScope.state.history = fullAttempts;
  mockScope.updateAnalyticsUI();

  // Metrics check
  const totalExamsEl = dynamicContent.querySelector("#analytics-attempts");
  assertEqual(totalExamsEl.textContent, "3", "Total exams metric card displays 3");

  const passRateEl = dynamicContent.querySelector("#analytics-pass-rate");
  assertEqual(passRateEl.textContent, "66.7%", "Pass rate displays 66.7% (2/3)");

  const avgScoreEl = dynamicContent.querySelector("#analytics-avg-score");
  // (50/70 + 60/70 + 35/70) / 3 = 145 / 210 = 69.0476...% -> 69.0%
  assertEqual(avgScoreEl.textContent, "69.0%", "Average score displays 69.0%");

  // Module breakdown check
  // Embryology total: 7 + 8 + 5 = 20 / 36 = 55.555...% -> 55.6%
  const embryoAccEl = dynamicContent.querySelector("#module-acc-embryo");
  assertEqual(embryoAccEl.textContent, "55.6%", "Embryology cumulative accuracy is 55.6%");

  const embryoRatioEl = dynamicContent.querySelector("#module-ratio-embryo");
  assertEqual(embryoRatioEl.textContent, "20 / 36 correct", "Embryology ratio displays 20 / 36 correct");

  // Weak Spot check
  const weakSpotCard = dynamicContent.querySelector("#analytics-weakspot-card");
  assert(weakSpotCard !== null, "Weak spot card rendered");
  const weakSpotTitle = dynamicContent.querySelector(".weakspot-title");
  assert(weakSpotTitle && weakSpotTitle.textContent.includes("Embryology"), "Weak spot title highlights Embryology");

  // Timeline check
  const trendColumns = dynamicContent.querySelectorAll(".trend-bar-column");
  assertEqual(trendColumns.length, 3, "Timeline renders 3 trend bar columns");

  // History list check
  const historyItems = dynamicContent.querySelectorAll(".history-item-card");
  assertEqual(historyItems.length, 3, "History log renders 3 attempt cards");

  // Check chips in history item
  const chips = dynamicContent.querySelectorAll(".history-module-chip");
  assert(chips.length >= 12, "Per-module chips rendered for attempts (4 per full sim)");

  // 3. Reset Button State
  assert(btnReset.disabled === false, "Reset history button is enabled with active history");

  // 4. Deterministic Question Position Module Rule (1-70)
  const getMod = mockScope.getModuleFromQuestionId;
  assertEqual(getMod(1), "Cell Biology", "Q1 -> Cell Biology");
  assertEqual(getMod(30), "Cell Biology", "Q30 -> Cell Biology");
  assertEqual(getMod(31), "Histology", "Q31 -> Histology");
  assertEqual(getMod(54), "Histology", "Q54 -> Histology");
  assertEqual(getMod(55), "Embryology", "Q55 -> Embryology");
  assertEqual(getMod(66), "Embryology", "Q66 -> Embryology");
  assertEqual(getMod(67), "Interdisciplinary", "Q67 -> Interdisciplinary");
  assertEqual(getMod(70), "Interdisciplinary", "Q70 -> Interdisciplinary");

  mockConsole.log("\n================================================================================");
  mockConsole.log("VERIFICATION SUMMARY: Passed: " + passed + ", Failed: " + failed);
  mockConsole.log("================================================================================");

  if (failed > 0) {
    mockConsole.error("AUDIT FAILED with " + failed + " errors.");
    return false;
  }
  mockConsole.log("SUCCESS: ALL 100% INDEPENDENT AUDIT CHECKS PASSED!");
  return true;
}

runVictoryAuditorTests();
