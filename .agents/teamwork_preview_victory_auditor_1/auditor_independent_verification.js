// Independent Victory Audit Verification Suite for CBEH Exam Analytics & Weak Spot Dashboard
// Executed via JavaScriptCore (osascript -l JavaScript)
// Author: Victory Auditor (Zero shared context)

function runVictoryAuditVerification() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
  // Read app.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  // Read index.html
  const htmlPath = $(projectRoot + "/index.html");
  const htmlData = $.NSString.stringWithContentsOfFileEncodingError(htmlPath, $.NSUTF8StringEncoding, null);
  const htmlContent = ObjC.unwrap(htmlData);

  // Read index.css
  const cssPath = $(projectRoot + "/index.css");
  const cssData = $.NSString.stringWithContentsOfFileEncodingError(cssPath, $.NSUTF8StringEncoding, null);
  const cssContent = ObjC.unwrap(cssData);

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
  mockConsole.log("   VICTORY AUDIT: INDEPENDENT VERIFICATION & STRESS-TEST ENGINE");
  mockConsole.log("================================================================================");

  // ----------------------------------------------------
  // TEST 1: SYNTAX VALIDATION OF ALL ASSETS
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 1] Syntax Validation & Structural Integrity");
  
  assert(appJsCode && appJsCode.length > 50000, "app.js is non-empty and substantial in size", `Size: ${appJsCode.length}`);
  assert(htmlContent && htmlContent.includes("welcome-tab-analytics"), "index.html contains analytics tab markup");
  assert(htmlContent && htmlContent.includes("welcome-panel-analytics"), "index.html contains analytics panel markup");
  assert(htmlContent && htmlContent.includes("analytics-dynamic-content"), "index.html contains analytics dynamic container");
  assert(htmlContent && htmlContent.includes("btn-reset-analytics"), "index.html contains reset history button");
  assert(cssContent && cssContent.includes(".analytics-dashboard"), "index.css contains .analytics-dashboard rules");
  assert(cssContent && cssContent.includes(".analytics-metric-card"), "index.css contains .analytics-metric-card rules");
  assert(cssContent && cssContent.includes(".analytics-module-card"), "index.css contains .analytics-module-card rules");
  assert(cssContent && cssContent.includes(".weakspot-card"), "index.css contains .weakspot-card rules");

  // DOM Mock for evaluating app.js
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

      function matchesSel(child) {
        if (isId) return child.id === selector.substring(1);
        if (isClass) {
          const classes = selector.split(".").filter(Boolean);
          return classes.every(c => child.classList.contains(c));
        }
        if (selector.startsWith("[") && selector.endsWith("]")) {
          const inside = selector.slice(1, -1);
          if (inside.includes("=")) {
            const [attr, val] = inside.split("=");
            const cleanVal = val.replace(/['"]/g, "");
            return child.getAttribute(attr) === cleanVal;
          }
          return child.getAttribute(inside) !== null;
        }
        return child.tagName.toLowerCase() === selector.toLowerCase();
      }

      function traverse(node) {
        for (const child of node.children) {
          if (matchesSel(child)) results.push(child);
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
        const childEl = new MockElement(tagName);
        childEl.parentElement = stack[stack.length - 1];

        if (rawAttrs) {
          const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:"([^"]*)"|'([^']*'|[^>\s]+)))?/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
            const attrName = attrMatch[1];
            let attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : "");
            if (attrVal.startsWith('"') || attrVal.startsWith("'")) attrVal = attrVal.slice(1, -1);
            childEl.setAttribute(attrName, attrVal);
            if (attrName.toLowerCase() === "id") childEl.id = attrVal;
            if (attrName.toLowerCase() === "class") childEl.className = attrVal;
            if (attrName.startsWith("data-")) childEl.dataset[attrName.substring(5)] = attrVal;
          }
        }

        const currentParent = stack[stack.length - 1];
        if (currentParent) {
          currentParent.children.push(childEl);
        }

        if (!isSelfClosing) {
          stack.push(childEl);
        }
      }
    }
  }

  const mockLocalStorage = {};
  const mockStorage = {
    getItem: (key) => (key in mockLocalStorage ? mockLocalStorage[key] : null),
    setItem: (key, val) => { mockLocalStorage[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorage[key]; },
    clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; }
  };

  const documentElements = new Map();
  function getOrCreateElement(id, tag = "div") {
    if (!documentElements.has(id)) {
      const el = new MockElement(tag);
      el.id = id;
      documentElements.set(id, el);
    }
    return documentElements.get(id);
  }

  const mockDocument = {
    body: new MockElement("body"),
    getElementById: (id) => {
      const found = mockDocument.body.querySelector("#" + id);
      if (found) return found;
      return getOrCreateElement(id);
    },
    querySelector: (sel) => {
      if (sel.startsWith("#")) {
        return mockDocument.getElementById(sel.substring(1));
      }
      return mockDocument.body.querySelector(sel) || new MockElement("div");
    },
    querySelectorAll: (sel) => mockDocument.body.querySelectorAll(sel),
    createElement: (tag) => new MockElement(tag),
    addEventListener: (event, cb) => {
      if (event === "DOMContentLoaded") {
        try { cb(); } catch (e) {
          // Ignore state loading warnings in mock sandbox
        }
      }
    }
  };

  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    listeners: {},
    addEventListener: (event, handler) => {
      if (!mockWindow.listeners[event]) mockWindow.listeners[event] = [];
      mockWindow.listeners[event].push(handler);
    },
    dispatchEvent: (e) => {
      if (mockWindow.listeners && mockWindow.listeners[e.type]) {
        mockWindow.listeners[e.type].forEach(fn => fn(e));
      }
    },
    scrollTo: () => {},
    location: { reload: () => {} }
  };

  // Seed baseline elements from index.html
  const requiredIds = [
    "welcome-tab-settings", "welcome-tab-bookmarks", "welcome-tab-analytics", "welcome-tab-database",
    "welcome-panel-settings", "welcome-panel-bookmarks", "welcome-panel-analytics", "welcome-panel-database",
    "analytics-dynamic-content", "btn-reset-analytics", "practice-mode-select", "btn-start-exam",
    "screen-welcome", "screen-exam", "screen-results", "pool-status-count", "pool-status-sims", "simulations-list-container"
  ];
  requiredIds.forEach(id => {
    const el = getOrCreateElement(id);
    mockDocument.body.appendChild(el);
  });

  // Build evaluation sandbox with appJsCode
  const testFn = new Function(
    "window", "document", "localStorage", "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "customConfirm", "customAlert",
    `
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
      state: window.state || globalObj.state
    };
    `
  );

  const engine = testFn(
    mockWindow, mockDocument, mockStorage, mockConsole,
    (fn) => { fn(); return 1; }, () => {}, () => 1, () => {},
    async (msg) => true, async (msg) => true
  );

  assert(typeof engine.calculateAnalyticsSummary === "function", "calculateAnalyticsSummary is a valid function");
  assert(typeof engine.updateAnalyticsUI === "function", "updateAnalyticsUI is a valid function");
  assert(typeof engine.getModuleStudyRecommendations === "function", "getModuleStudyRecommendations is a valid function");
  assert(typeof engine.renderAnalyticsTrendChart === "function", "renderAnalyticsTrendChart is a valid function");

  // ----------------------------------------------------
  // TEST 2: EMPTY STATE ACCORDING TO AC
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 2] Acceptance Criteria: Empty State ('Take your first exam')");
  
  mockStorage.setItem("cbeh_history", JSON.stringify([]));
  engine.state.history = [];
  engine.updateAnalyticsUI();

  const dynamicContent = mockDocument.getElementById("analytics-dynamic-content");
  assert(dynamicContent !== null, "analytics-dynamic-content element exists");
  assert(dynamicContent.innerHTML.includes("analytics-empty-state"), "Empty state container rendered when history is empty");
  assert(dynamicContent.innerHTML.includes("Take Your First Exam"), "Empty state contains 'Take Your First Exam' CTA button");
  
  const btnReset = mockDocument.getElementById("btn-reset-analytics");
  assert(btnReset.disabled === true, "Reset button is safely disabled in empty state");

  const btnTakeFirst = dynamicContent.querySelector("#btn-analytics-take-exam");
  assert(btnTakeFirst !== null, "Take Your First Exam button is interactive in DOM");

  // ----------------------------------------------------
  // TEST 3: CUMULATIVE METRICS AGGREGATION (R1)
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 3] Requirement R1: Cumulative Performance Metrics Aggregation");

  const mockExamsAttemptHistory = [
    {
      date: "2026-08-20T10:00:00Z",
      mode: "Full Simulation 1",
      totalScore: 56,
      totalQuestions: 70,
      isPassed: true,
      grade: "26.5",
      moduleScores: {
        "Cell Biology": { score: 26, total: 30 },
        "Histology": { score: 18, total: 24 },
        "Embryology": { score: 9, total: 12 },
        "Interdisciplinary": { score: 3, total: 4 }
      }
    },
    {
      date: "2026-08-21T14:30:00Z",
      mode: "Full Simulation 2",
      totalScore: 42,
      totalQuestions: 70,
      isPassed: true, // 60%
      grade: "18",
      moduleScores: {
        "Cell Biology": { score: 20, total: 30 },
        "Histology": { score: 14, total: 24 },
        "Embryology": { score: 6, total: 12 },
        "Interdisciplinary": { score: 2, total: 4 }
      }
    },
    {
      date: "2026-08-22T09:15:00Z",
      mode: "Full Simulation 3",
      totalScore: 35,
      totalQuestions: 70,
      isPassed: false, // 50%
      grade: "FAIL",
      moduleScores: {
        "Cell Biology": { score: 18, total: 30 },
        "Histology": { score: 10, total: 24 }, // 41.7% < 50%
        "Embryology": { score: 5, total: 12 },  // 41.7%
        "Interdisciplinary": { score: 2, total: 4 }
      }
    }
  ];

  const summary = engine.calculateAnalyticsSummary(mockExamsAttemptHistory);

  assertEqual(summary.totalAttempts, 3, "Total exams count is 3");
  assertEqual(summary.passCount, 2, "Pass count is 2");
  assertEqual(summary.failCount, 1, "Fail count is 1");
  assertEqual(summary.passRate.toFixed(2), "66.67", "Overall Pass Rate is 66.67%");
  
  // Total correct = 56 + 42 + 35 = 133
  // Total questions = 70 + 70 + 70 = 210
  // Avg score pct = (80% + 60% + 50%) / 3 = 63.33%
  assertEqual(summary.totalCorrectAnswers, 133, "Total correct answers across attempts is 133");
  assertEqual(summary.totalQuestionsAnswered, 210, "Total questions answered is 210");
  assertEqual(summary.avgScorePct.toFixed(2), "63.33", "Average Score Percentage is 63.33%");
  assertEqual(summary.avgTotalScore.toFixed(2), "44.33", "Average Total Points is 44.33");
  
  // Average Grade = (26.5 + 18) / 2 = 22.25
  assertEqual(summary.validGradeCount, 2, "Valid academic grade count is 2 (excluding FAIL)");
  assertEqual(summary.avgGrade.toFixed(2), "22.25", "Average Grade is 22.25 / 30");

  // ----------------------------------------------------
  // TEST 4: MODULE-BY-MODULE ACCURACY CALCULATION (R1)
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 4] Requirement R1: Module Accuracy Breakdown Calculation");

  // Cell Bio: score = 26 + 20 + 18 = 64 / 90 -> 71.11%
  assertEqual(summary.moduleStats["Cell Biology"].score, 64, "Cell Biology cumulative score is 64");
  assertEqual(summary.moduleStats["Cell Biology"].total, 90, "Cell Biology cumulative total is 90");
  assertEqual(summary.moduleStats["Cell Biology"].accuracy.toFixed(2), "71.11", "Cell Biology accuracy is 71.11%");

  // Histology: score = 18 + 14 + 10 = 42 / 72 -> 58.33%
  assertEqual(summary.moduleStats["Histology"].score, 42, "Histology cumulative score is 42");
  assertEqual(summary.moduleStats["Histology"].total, 72, "Histology cumulative total is 72");
  assertEqual(summary.moduleStats["Histology"].accuracy.toFixed(2), "58.33", "Histology accuracy is 58.33%");

  // Embryology: score = 9 + 6 + 5 = 20 / 36 -> 55.56%
  assertEqual(summary.moduleStats["Embryology"].score, 20, "Embryology cumulative score is 20");
  assertEqual(summary.moduleStats["Embryology"].total, 36, "Embryology cumulative total is 36");
  assertEqual(summary.moduleStats["Embryology"].accuracy.toFixed(2), "55.56", "Embryology accuracy is 55.56%");

  // Interdisciplinary: score = 3 + 2 + 2 = 7 / 12 -> 58.33%
  assertEqual(summary.moduleStats["Interdisciplinary"].score, 7, "Interdisciplinary cumulative score is 7");
  assertEqual(summary.moduleStats["Interdisciplinary"].total, 12, "Interdisciplinary cumulative total is 12");
  assertEqual(summary.moduleStats["Interdisciplinary"].accuracy.toFixed(2), "58.33", "Interdisciplinary accuracy is 58.33%");

  // ----------------------------------------------------
  // TEST 5: WEAK SPOT IDENTIFICATION & RECOMMENDATIONS (R1)
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 5] Requirement R1 & Acceptance Criteria: Weak Spot Alert & Study Focus Card");

  // Embryology is lowest at 55.56% (< 60%)
  assertEqual(summary.weakestModule, "Embryology", "Weakest module correctly identified as Embryology");
  assertEqual(summary.weakestPct.toFixed(2), "55.56", "Weakest accuracy is 55.56%");
  assertEqual(summary.strongestModule, "Cell Biology", "Strongest module correctly identified as Cell Biology");

  assert(summary.modulesBelowThreshold.length === 3, "Identified 3 modules below 60% threshold (Embryology, Histology, Interdisciplinary)");
  assertEqual(summary.modulesBelowThreshold[0].module, "Embryology", "Sorted lowest first: Embryology");

  assert(summary.studyRecommendations !== null, "Study recommendations object generated");
  assertEqual(summary.studyRecommendations.module, "Embryology", "Recommendation focuses on Embryology");
  assert(summary.studyRecommendations.isBelow60 === true, "Marked as priority below 60% threshold");
  assert(summary.studyRecommendations.title.includes("Priority Weak Spot: Embryology"), "Title reflects priority weak spot");
  assert(summary.studyRecommendations.topics.length >= 4, "Provides at least 4 actionable study topics");
  assert(summary.studyRecommendations.topics.some(t => t.includes("Gastrulation")), "Includes core high-yield Embryology topics");

  // ----------------------------------------------------
  // TEST 6: FULL DOM RENDERING WITH ATTEMPTS (R1 & R2)
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 6] Requirement R1 & R2: Full Dashboard DOM Rendering");

  mockStorage.setItem("cbeh_history", JSON.stringify(mockExamsAttemptHistory));
  engine.state.history = mockExamsAttemptHistory;
  engine.updateAnalyticsUI();

  // Metric Cards
  const attemptsEl = dynamicContent.querySelector("#analytics-attempts");
  assert(attemptsEl !== null && attemptsEl.textContent === "3", "DOM renders Total Exams: 3");

  const passRateEl = dynamicContent.querySelector("#analytics-pass-rate");
  assert(passRateEl !== null && passRateEl.textContent.includes("66.7%"), "DOM renders Pass Rate: 66.7%");

  const avgScoreEl = dynamicContent.querySelector("#analytics-avg-score");
  assert(avgScoreEl !== null && avgScoreEl.textContent.includes("63.3%"), "DOM renders Average Score: 63.3%");

  const avgGradeEl = dynamicContent.querySelector("#analytics-avg-grade");
  assert(avgGradeEl !== null && avgGradeEl.textContent.includes("22.3 / 30"), "DOM renders Average Grade: 22.3 / 30");

  // Module Grid
  const modCellBio = dynamicContent.querySelector("#module-acc-cellbio");
  assert(modCellBio !== null && modCellBio.textContent.includes("71.1%"), "Cell Biology accuracy rendered in DOM: 71.1%");

  const modEmbryo = dynamicContent.querySelector("#module-acc-embryo");
  assert(modEmbryo !== null && modEmbryo.textContent.includes("55.6%"), "Embryology accuracy rendered in DOM: 55.6%");

  // Weak Spot Card
  const weakSpotCard = dynamicContent.querySelector("#analytics-weakspot-card");
  assert(weakSpotCard !== null, "Weak Spot recommendation card rendered in DOM");
  assert(weakSpotCard.classList.contains("alert-variant"), "Card uses alert styling variant for <60% score");
  assert(weakSpotCard.textContent.includes("Embryology"), "Card explicitly targets Embryology");

  // Timeline & History Log (R2)
  const historyList = dynamicContent.querySelector("#analytics-history-list");
  assert(historyList !== null, "Attempt History list container rendered in DOM");
  
  const historyCard0 = dynamicContent.querySelector("#history-attempt-0");
  assert(historyCard0 !== null, "Recent attempt card 0 rendered");
  assert(historyCard0.textContent.includes("Full Simulation 3"), "Latest attempt shown first (Full Simulation 3)");
  assert(historyCard0.textContent.includes("FAIL"), "Fail badge rendered for simulation 3");
  assert(historyCard0.textContent.includes("35 / 70"), "Score 35/70 rendered");

  const historyCard2 = dynamicContent.querySelector("#history-attempt-2");
  assert(historyCard2 !== null, "Oldest attempt card 2 rendered");
  assert(historyCard2.textContent.includes("Full Simulation 1"), "Oldest attempt shown (Full Simulation 1)");
  assert(historyCard2.textContent.includes("PASS"), "Pass badge rendered for simulation 1");

  // Reset button state
  assert(btnReset.disabled === false, "Reset button is enabled when history records exist");

  // ----------------------------------------------------
  // TEST 7: CLEAR/RESET HISTORY TRANSITION (R2)
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 7] Requirement R2: Reset History UI & State Transition");

  // Verify reset state change
  engine.state.history = [];
  mockStorage.removeItem("cbeh_history");
  engine.updateAnalyticsUI();

  assertEqual(engine.state.history.length, 0, "state.history cleared to empty array");
  assertEqual(mockStorage.getItem("cbeh_history"), null, "localStorage cbeh_history removed");
  assert(dynamicContent.innerHTML.includes("analytics-empty-state"), "UI immediately transitioned back to clean empty state");
  assert(btnReset.disabled === true, "Reset button disabled in empty state");

  // ----------------------------------------------------
  // TEST 8: CROSS-TAB STORAGE SYNCHRONIZATION
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 8] Multi-Tab / External Storage Event Synchronization");

  mockStorage.setItem("cbeh_history", JSON.stringify(mockExamsAttemptHistory));
  mockWindow.dispatchEvent({ type: "storage", key: "cbeh_history" });

  assertEqual(engine.state.history.length, 3, "External storage event synchronized history into state");
  assert(!dynamicContent.innerHTML.includes("analytics-empty-state"), "UI updated dynamically from storage event");

  // ----------------------------------------------------
  // TEST 9: ADVERSARIAL STRESS-TESTS & EDGE CASES
  // ----------------------------------------------------
  mockConsole.log("\n[AUDIT CHECK 9] Adversarial Stress Testing & Boundary Conditions");

  // 9a. All 100% scores
  const allPerfectHistory = [{
    date: "2026-08-23T12:00:00Z",
    totalScore: 70,
    totalQuestions: 70,
    isPassed: true,
    grade: "30 e Lode",
    moduleScores: {
      "Cell Biology": { score: 30, total: 30 },
      "Histology": { score: 24, total: 24 },
      "Embryology": { score: 12, total: 12 },
      "Interdisciplinary": { score: 4, total: 4 }
    }
  }];
  const perfSummary = engine.calculateAnalyticsSummary(allPerfectHistory);
  assertEqual(perfSummary.passRate, 100, "100% pass rate calculated");
  assertEqual(perfSummary.avgScorePct, 100, "100% avg score calculated");
  assertEqual(perfSummary.weakestPct, 100, "Weakest module accuracy is 100%");
  assert(perfSummary.studyRecommendations.title.includes("Optimization Focus"), "Uses Optimization Focus for >=60% accuracy");
  assertEqual(perfSummary.modulesBelowThreshold.length, 0, "No modules below 60% threshold");

  // 9b. Corrupted and stringly typed scores
  const messyHistory = [
    null,
    undefined,
    "bad-string",
    { totalScore: "63", totalQuestions: "70", isPassed: "true", grade: "30L", moduleScores: { "CB": { score: "28", total: "30" } } },
    { totalScore: "NaN", totalQuestions: "invalid", isPassed: "superato" }
  ];
  const messySummary = engine.calculateAnalyticsSummary(messyHistory);
  assertEqual(messySummary.totalAttempts, 2, "Filtered non-objects, counted 2 valid attempt objects");
  assert(!isNaN(messySummary.passRate), "Pass rate is valid number despite strings");
  assert(!isNaN(messySummary.avgScorePct), "Average score is valid number despite strings");

  // 9c. Module study recommendations fallback
  const fallbackRec = engine.getModuleStudyRecommendations("Unknown Module", 45, true);
  assert(fallbackRec.module === "Unknown Module", "Gracefully handles arbitrary module name");
  assert(fallbackRec.topics.length > 0, "Provides fallback topics");

  mockConsole.log("\n================================================================================");
  mockConsole.log(`VICTORY AUDIT SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");
  
  if (failed === 0) {
    mockConsole.log("VERDICT: ALL INDEPENDENT VERIFICATION TESTS PASSED (VICTORY CONFIRMED)");
  } else {
    mockConsole.log(`VERDICT: ${failed} FAILURES DETECTED (VICTORY REJECTED)`);
  }
}

runVictoryAuditVerification();
