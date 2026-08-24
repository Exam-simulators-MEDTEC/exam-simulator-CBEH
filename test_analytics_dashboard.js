// Comprehensive Verification Test Suite for Exam Analytics & Weak Spot Dashboard
// Executed via JavaScriptCore (osascript -l JavaScript)

function runAnalyticsDashboardTests() {
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
  mockConsole.log("   VERIFICATION: EXAM ANALYTICS & WEAK SPOT BREAKDOWN DASHBOARD");
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
        
        // Parse attributes
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

  const mockLocalStorage = {};
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
    addEventListener: function(evt, cb) {
      if (evt === "DOMContentLoaded") {
        try { cb(); } catch(e) {}
      }
    }
  };

  // Seed required elements in mock DOM
  const welcomePanel = mockDoc.getElementById("welcome-panel-analytics");
  mockDoc.body.appendChild(welcomePanel);

  const dynamicContent = new MockElement("div");
  dynamicContent.id = "analytics-dynamic-content";
  welcomePanel.appendChild(dynamicContent);

  const btnReset = new MockElement("button");
  btnReset.id = "btn-reset-analytics";
  welcomePanel.appendChild(btnReset);

  const practiceSelect = new MockElement("select");
  practiceSelect.id = "practice-mode-select";
  mockDoc.body.appendChild(practiceSelect);

  const btnStartExam = new MockElement("button");
  btnStartExam.id = "btn-start-exam";
  mockDoc.body.appendChild(btnStartExam);

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
      state: window.state || globalObj.state
    };
  `);

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const {
    calculateAnalyticsSummary,
    getModuleStudyRecommendations,
    getModuleBadgeTagAndClass,
    renderAnalyticsTrendChart,
    updateAnalyticsUI,
    isAttemptPassed,
    getModuleScoreEntry,
    formatAttemptGradeDisplay,
    safeGetLocalStorageArray,
    state
  } = exports;

  // ---------------------------------------------------------------------------
  // SUITE 1: Pure Calculation Engine & Cumulative Aggregation (R1)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Pure Calculation Engine & Cumulative Aggregation");

  // 1.1 Empty / Null History
  const emptySummary = calculateAnalyticsSummary([]);
  assertEqual(emptySummary.totalAttempts, 0, "Empty history has 0 attempts");
  assertEqual(emptySummary.passRate, 0, "Empty history has 0% pass rate");
  assertEqual(emptySummary.avgScorePct, 0, "Empty history has 0% avg score");
  assertEqual(emptySummary.weakestModule, null, "Empty history has null weakestModule");
  assertEqual(emptySummary.studyRecommendations, null, "Empty history has null study recommendations");

  // 1.2 Single Standard Full Simulation Attempt
  const singleAttempt = [{
    id: "attempt-1",
    date: "2026-08-20T10:00:00Z",
    mode: "Standard 70-Question Simulation (Mixed)",
    totalScore: 56,
    totalQuestions: 70,
    grade: "27",
    isPassed: true,
    moduleScores: {
      "Cell Biology": { score: 25, total: 30, reqPass: 15 },
      "Histology": { score: 19, total: 24, reqPass: 12 },
      "Embryology": { score: 8, total: 12, reqPass: 6 },
      "Interdisciplinary": { score: 4, total: 4, reqPass: 2 }
    }
  }];

  const singleSummary = calculateAnalyticsSummary(singleAttempt);
  assertEqual(singleSummary.totalAttempts, 1, "Single attempt total is 1");
  assertEqual(singleSummary.passCount, 1, "Pass count is 1");
  assertEqual(singleSummary.passRate, 100, "Pass rate is 100%");
  assertEqual(singleSummary.avgScorePct, 80, "Average score percentage is 80% (56/70)");
  assertEqual(singleSummary.totalQuestionsAnswered, 70, "Total questions answered is 70");
  assertEqual(singleSummary.totalCorrectAnswers, 56, "Total correct answers is 56");
  assertEqual(singleSummary.avgGrade, 27, "Average grade is 27");

  assertEqual(singleSummary.moduleStats["Cell Biology"].score, 25, "Cell Bio score is 25");
  assertEqual(singleSummary.moduleStats["Cell Biology"].total, 30, "Cell Bio total is 30");
  assert(Math.abs(singleSummary.moduleStats["Cell Biology"].accuracy - 83.33) < 0.1, "Cell Bio accuracy is ~83.3%");

  assertEqual(singleSummary.moduleStats["Embryology"].score, 8, "Embryology score is 8");
  assertEqual(singleSummary.moduleStats["Embryology"].total, 12, "Embryology total is 12");
  assert(Math.abs(singleSummary.moduleStats["Embryology"].accuracy - 66.67) < 0.1, "Embryology accuracy is ~66.7%");

  // 1.3 Multiple Attempts with Mixed Pass/Fail and Varied Module Accuracies
  const multiAttempts = [
    {
      id: "attempt-1",
      date: "2026-08-21T10:00:00Z",
      mode: "Standard 70-Question Simulation (Mixed)",
      totalScore: 50,
      totalQuestions: 70,
      grade: "23",
      isPassed: true,
      moduleScores: {
        "Cell Biology": { score: 24, total: 30, reqPass: 15 },
        "Histology": { score: 16, total: 24, reqPass: 12 },
        "Embryology": { score: 7, total: 12, reqPass: 6 },
        "Interdisciplinary": { score: 3, total: 4, reqPass: 2 }
      }
    },
    {
      id: "attempt-2",
      date: "2026-08-22T14:00:00Z",
      mode: "Standard 70-Question Simulation (Mixed)",
      totalScore: 35,
      totalQuestions: 70,
      grade: "FAIL",
      isPassed: false,
      moduleScores: {
        "Cell Biology": { score: 18, total: 30, reqPass: 15 },
        "Histology": { score: 10, total: 24, reqPass: 12 }, // 41.7%
        "Embryology": { score: 5, total: 12, reqPass: 6 },  // 41.7%
        "Interdisciplinary": { score: 2, total: 4, reqPass: 2 }
      }
    },
    {
      id: "attempt-3",
      date: "2026-08-23T18:00:00Z",
      mode: "Cell Biology Focus",
      totalScore: 18,
      totalQuestions: 20,
      grade: "30L",
      isPassed: true,
      moduleScores: {
        "Cell Biology": { score: 18, total: 20, reqPass: 10 }
      }
    }
  ];

  const multiSummary = calculateAnalyticsSummary(multiAttempts);
  assertEqual(multiSummary.totalAttempts, 3, "Total attempts is 3");
  assertEqual(multiSummary.passCount, 2, "Pass count is 2");
  assertEqual(multiSummary.failCount, 1, "Fail count is 1");
  assert(Math.abs(multiSummary.passRate - 66.67) < 0.1, "Pass rate is ~66.7%");
  assertEqual(multiSummary.totalQuestionsAnswered, 160, "Total questions answered is 160 (70+70+20)");
  assertEqual(multiSummary.totalCorrectAnswers, 103, "Total correct answers is 103 (50+35+18)");

  // Check cumulative module aggregation:
  // Cell Biology: (24 + 18 + 18) / (30 + 30 + 20) = 60 / 80 = 75.0%
  assertEqual(multiSummary.moduleStats["Cell Biology"].score, 60, "Cumulative Cell Bio score is 60");
  assertEqual(multiSummary.moduleStats["Cell Biology"].total, 80, "Cumulative Cell Bio total is 80");
  assertEqual(multiSummary.moduleStats["Cell Biology"].accuracy, 75, "Cumulative Cell Bio accuracy is exactly 75%");
  assertEqual(multiSummary.moduleStats["Cell Biology"].attempts, 3, "Cell Bio was in 3 attempts");

  // Histology: (16 + 10) / (24 + 24) = 26 / 48 = 54.167%
  assertEqual(multiSummary.moduleStats["Histology"].score, 26, "Cumulative Histology score is 26");
  assertEqual(multiSummary.moduleStats["Histology"].total, 48, "Cumulative Histology total is 48");
  assert(Math.abs(multiSummary.moduleStats["Histology"].accuracy - 54.17) < 0.1, "Cumulative Histology accuracy is ~54.2%");

  // Embryology: (7 + 5) / (12 + 12) = 12 / 24 = 50.0%
  assertEqual(multiSummary.moduleStats["Embryology"].score, 12, "Cumulative Embryology score is 12");
  assertEqual(multiSummary.moduleStats["Embryology"].total, 24, "Cumulative Embryology total is 24");
  assertEqual(multiSummary.moduleStats["Embryology"].accuracy, 50, "Cumulative Embryology accuracy is 50.0%");

  // Interdisciplinary: (3 + 2) / (4 + 4) = 5 / 8 = 62.5%
  assertEqual(multiSummary.moduleStats["Interdisciplinary"].score, 5, "Cumulative Interdisciplinary score is 5");
  assertEqual(multiSummary.moduleStats["Interdisciplinary"].total, 8, "Cumulative Interdisciplinary total is 8");
  assertEqual(multiSummary.moduleStats["Interdisciplinary"].accuracy, 62.5, "Cumulative Interdisciplinary accuracy is 62.5%");

  // ---------------------------------------------------------------------------
  // SUITE 2: Weak Spot Identification & Actionable Study Recommendations (R1)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Weak Spot Identification & Actionable Study Recommendations");

  // In multiSummary: Embryology (50.0%) is lowest, Histology (54.17%) is second lowest. Both are < 60%.
  assertEqual(multiSummary.weakestModule, "Embryology", "Weakest module correctly identified as Embryology (50%)");
  assertEqual(multiSummary.weakestPct, 50, "Weakest percentage is 50%");
  assertEqual(multiSummary.strongestModule, "Cell Biology", "Strongest module correctly identified as Cell Biology (75%)");
  assertEqual(multiSummary.modulesBelowThreshold.length, 2, "2 modules are below 60% threshold");
  assertEqual(multiSummary.modulesBelowThreshold[0].module, "Embryology", "First module below 60% is Embryology");
  assertEqual(multiSummary.modulesBelowThreshold[1].module, "Histology", "Second module below 60% is Histology");

  assert(multiSummary.studyRecommendations !== null, "Study recommendations generated");
  assertEqual(multiSummary.studyRecommendations.module, "Embryology", "Recommendations target Embryology");
  assertEqual(multiSummary.studyRecommendations.isBelow60, true, "isBelow60 flag is true");
  assert(multiSummary.studyRecommendations.title.includes("Priority Weak Spot: Embryology"), "Title contains Priority Weak Spot");
  assert(multiSummary.studyRecommendations.topics.length >= 4, "Includes at least 4 high-yield topic recommendations");
  assert(multiSummary.studyRecommendations.topics.some(t => t.includes("Gastrulation") || t.includes("Germ Layer")), "Contains embryology specific topics");

  // 2.2 Test All Modules Above 60% (Mastery Mode)
  const masteryAttempts = [{
    id: "mastery-1",
    date: "2026-08-24T12:00:00Z",
    mode: "Standard 70-Question Simulation (Mixed)",
    totalScore: 62,
    totalQuestions: 70,
    grade: "30",
    isPassed: true,
    moduleScores: {
      "Cell Biology": { score: 28, total: 30 }, // 93.3%
      "Histology": { score: 21, total: 24 },    // 87.5%
      "Embryology": { score: 9, total: 12 },     // 75.0%
      "Interdisciplinary": { score: 4, total: 4 } // 100%
    }
  }];
  const masterySummary = calculateAnalyticsSummary(masteryAttempts);
  assertEqual(masterySummary.modulesBelowThreshold.length, 0, "0 modules below 60% in mastery summary");
  assertEqual(masterySummary.weakestModule, "Embryology", "Relative lowest module is Embryology (75%)");
  assertEqual(masterySummary.studyRecommendations.isBelow60, false, "isBelow60 is false when all >= 60%");
  assert(masterySummary.studyRecommendations.title.includes("Optimization Focus"), "Title indicates Optimization Focus");

  // 2.3 Test Study Recommendations Map for all 4 modules
  ["Cell Biology", "Histology", "Embryology", "Interdisciplinary"].forEach(modName => {
    const recBelow = getModuleStudyRecommendations(modName, 45, true);
    assertEqual(recBelow.module, modName, `Rec below module is ${modName}`);
    assertEqual(recBelow.isBelow60, true, `Rec below isBelow60 is true`);
    assert(recBelow.topics.length >= 4, `${modName} has at least 4 topic pointers`);

    const recAbove = getModuleStudyRecommendations(modName, 85, false);
    assertEqual(recAbove.module, modName, `Rec above module is ${modName}`);
    assertEqual(recAbove.isBelow60, false, `Rec above isBelow60 is false`);
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: DOM Rendering & UI Hierarchy (R1, R2)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] DOM Rendering & UI Hierarchy");

  const dynamicContentEl = mockDoc.getElementById("analytics-dynamic-content");

  // 3.1 Empty State Render
  state.history = [];
  updateAnalyticsUI();

  const emptyStateEl = dynamicContentEl.querySelector(".analytics-empty-state");
  assert(emptyStateEl !== null, "Empty state element rendered when history is empty");
  assert(dynamicContentEl.textContent.includes("No Exam History Recorded"), "Empty state title displayed");
  const btnTakeExam = dynamicContentEl.querySelector("#btn-analytics-take-exam");
  assert(btnTakeExam !== null, "'Take Your First Exam' CTA button present in empty state");

  // 3.2 Full Dashboard Render with History
  state.history = multiAttempts;
  updateAnalyticsUI();

  // Metric Cards
  const attemptsValEl = dynamicContentEl.querySelector("#analytics-attempts");
  assert(attemptsValEl !== null, "#analytics-attempts metric value exists in DOM");
  assertEqual(attemptsValEl.textContent, "3", "DOM attempts value is '3'");

  const passRateValEl = dynamicContentEl.querySelector("#analytics-pass-rate");
  assert(passRateValEl !== null, "#analytics-pass-rate exists in DOM");
  assertEqual(passRateValEl.textContent, "66.7%", "DOM pass rate is '66.7%'");

  const avgScoreValEl = dynamicContentEl.querySelector("#analytics-avg-score");
  assert(avgScoreValEl !== null, "#analytics-avg-score exists in DOM");
  assert(avgScoreValEl.textContent.includes("%"), "DOM average score includes %");

  const avgGradeValEl = dynamicContentEl.querySelector("#analytics-avg-grade");
  assert(avgGradeValEl !== null, "#analytics-avg-grade exists in DOM");

  // Module Breakdown Cards
  const modAccCB = dynamicContentEl.querySelector("#module-acc-cellbio");
  assert(modAccCB !== null, "Cell Bio accuracy element exists");
  assertEqual(modAccCB.textContent, "75.0%", "Cell Bio accuracy text is '75.0%'");

  const modAccHist = dynamicContentEl.querySelector("#module-acc-histology");
  assert(modAccHist !== null, "Histology accuracy element exists");
  assertEqual(modAccHist.textContent, "54.2%", "Histology accuracy text is '54.2%'");

  const modAccEmb = dynamicContentEl.querySelector("#module-acc-embryo");
  assert(modAccEmb !== null, "Embryology accuracy element exists");
  assertEqual(modAccEmb.textContent, "50.0%", "Embryology accuracy text is '50.0%'");

  const modAccInd = dynamicContentEl.querySelector("#module-acc-interdisciplinary");
  assert(modAccInd !== null, "Interdisciplinary accuracy element exists");
  assertEqual(modAccInd.textContent, "62.5%", "Interdisciplinary accuracy text is '62.5%'");

  // Weak Spot Alert Card
  const weakSpotCard = dynamicContentEl.querySelector("#analytics-weakspot-card");
  assert(weakSpotCard !== null, "Weak spot card element exists");
  assert(weakSpotCard.classList.contains("alert-variant"), "Weak spot card has alert-variant class");
  assert(weakSpotCard.textContent.includes("Embryology"), "Weak spot card mentions Embryology");
  assert(weakSpotCard.textContent.includes("50.0%"), "Weak spot card mentions 50.0%");

  const practiceWeakBtn = weakSpotCard.querySelector(".btn-practice-weak-spot");
  assert(practiceWeakBtn !== null, "Weak spot card has launch practice button");
  assertEqual(practiceWeakBtn.getAttribute("data-target-mode"), "embryology", "Button data-target-mode is 'embryology'");

  // Visual Score Trend Timeline
  const trendBars = dynamicContentEl.querySelectorAll(".trend-bar-column");
  assertEqual(trendBars.length, 3, "3 visual trend bar columns rendered for 3 attempts");

  // History Log List & Chips
  const historyListEl = dynamicContentEl.querySelector("#analytics-history-list");
  assert(historyListEl !== null, "History list container exists in DOM");
  const historyCards = dynamicContentEl.querySelectorAll(".history-item-card");
  assertEqual(historyCards.length, 3, "3 history item cards rendered");

  const chips = dynamicContentEl.querySelectorAll(".history-module-chip");
  assert(chips.length >= 7, "Module breakdown chips rendered on history cards");

  // ---------------------------------------------------------------------------
  // SUITE 4: Interactive Handlers & State Persistence (R2)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Interactive Handlers & State Persistence");

  // 4.1 Launch Weak Spot Practice Button Click
  const practiceSelectEl = mockDoc.getElementById("practice-mode-select");
  practiceWeakBtn.click();
  assertEqual(practiceSelectEl.value, "embryology", "Clicking weak spot practice button sets practice mode select to 'embryology'");

  // 4.2 Reset History Flow
  const btnResetEl = mockDoc.getElementById("btn-reset-analytics");
  assert(btnResetEl !== null, "#btn-reset-analytics exists");

  // Simulate resetting history
  state.history = [];
  mockLocalStorage["cbeh_history"] = JSON.stringify([]);
  updateAnalyticsUI();

  const resetEmptyEl = dynamicContentEl.querySelector(".analytics-empty-state");
  assert(resetEmptyEl !== null, "Dashboard cleanly switches to empty state upon history reset");

  // ---------------------------------------------------------------------------
  // SUITE 5: Boundary Conditions & Robustness Stress Testing
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 5] Boundary Conditions & Robustness Stress Testing");

  // 5.1 0% and 100% Extremes
  const extremeAttempts = [
    {
      id: "zero",
      date: "2026-08-01",
      totalScore: 0,
      totalQuestions: 70,
      isPassed: false,
      grade: "FAIL",
      moduleScores: {
        "Cell Biology": { score: 0, total: 30 },
        "Histology": { score: 0, total: 24 },
        "Embryology": { score: 0, total: 12 },
        "Interdisciplinary": { score: 0, total: 4 }
      }
    },
    {
      id: "perfect",
      date: "2026-08-02",
      totalScore: 70,
      totalQuestions: 70,
      isPassed: true,
      grade: "30L",
      moduleScores: {
        "Cell Biology": { score: 30, total: 30 },
        "Histology": { score: 24, total: 24 },
        "Embryology": { score: 12, total: 12 },
        "Interdisciplinary": { score: 4, total: 4 }
      }
    }
  ];

  const extremeSummary = calculateAnalyticsSummary(extremeAttempts);
  assertEqual(extremeSummary.passRate, 50, "Pass rate is 50%");
  assertEqual(extremeSummary.avgScorePct, 50, "Avg score percentage is 50%");
  assertEqual(extremeSummary.moduleStats["Cell Biology"].accuracy, 50, "Cell bio accuracy is 50%");

  // 5.2 Exact 60% Threshold Boundary Check
  const thresholdAttempt = [{
    id: "thresh",
    date: "2026-08-03",
    totalScore: 42,
    totalQuestions: 70,
    isPassed: true,
    grade: "18",
    moduleScores: {
      "Cell Biology": { score: 18, total: 30 }, // exactly 60%
      "Histology": { score: 15, total: 25 },    // 60%
      "Embryology": { score: 6, total: 10 },     // 60%
      "Interdisciplinary": { score: 3, total: 5 } // 60%
    }
  }];
  const threshSummary = calculateAnalyticsSummary(thresholdAttempt);
  assertEqual(threshSummary.modulesBelowThreshold.length, 0, "Modules with exactly 60% are not below threshold (<60%)");
  assertEqual(threshSummary.studyRecommendations.isBelow60, false, "isBelow60 is false at exactly 60%");

  // 5.3 59.9% Boundary Check
  const subThreshAttempt = [{
    id: "subthresh",
    date: "2026-08-04",
    totalScore: 41,
    totalQuestions: 70,
    isPassed: false,
    grade: "FAIL",
    moduleScores: {
      "Cell Biology": { score: 17, total: 30 }, // 56.7% (<60%)
      "Histology": { score: 18, total: 24 },    // 75%
      "Embryology": { score: 8, total: 12 },     // 66.7%
      "Interdisciplinary": { score: 3, total: 4 } // 75%
    }
  }];
  const subThreshSummary = calculateAnalyticsSummary(subThreshAttempt);
  assertEqual(subThreshSummary.modulesBelowThreshold.length, 1, "Module with 56.7% is below threshold");
  assertEqual(subThreshSummary.weakestModule, "Cell Biology", "Cell Biology is the weak spot");
  assertEqual(subThreshSummary.studyRecommendations.isBelow60, true, "isBelow60 is true for 56.7%");

  // 5.4 Adversarial Null & Corrupted Entries in History Array
  const dirtyHistory = [
    null,
    undefined,
    "corrupted string",
    12345,
    {
      id: "valid-1",
      date: "2026-08-05",
      totalScore: 50,
      totalQuestions: 70,
      isPassed: true,
      grade: "24",
      moduleScores: {
        "Cell Biology": { score: 20, total: 30 },
        "Histology": { score: 18, total: 24 },
        "Embryology": { score: 8, total: 12 },
        "Interdisciplinary": { score: 4, total: 4 }
      }
    },
    null
  ];
  const dirtySummary = calculateAnalyticsSummary(dirtyHistory);
  assertEqual(dirtySummary.totalAttempts, 1, "Dirty history filters out non-objects and counts only 1 valid attempt");
  assertEqual(dirtySummary.passCount, 1, "Pass count is 1 for valid attempt in dirty history");
  assertEqual(dirtySummary.passRate, 100, "Pass rate is 100% (not halved by nulls)");
  assertEqual(dirtySummary.totalQuestionsAnswered, 70, "70 total questions from the 1 valid attempt");
  assertEqual(dirtySummary.totalCorrectAnswers, 50, "50 total correct answers from the 1 valid attempt");

  // Verify DOM rendering with dirty history does not crash
  state.history = dirtyHistory;
  updateAnalyticsUI();
  const historyCardsDirty = dynamicContentEl.querySelectorAll(".history-item-card");
  assertEqual(historyCardsDirty.length, 1, "Only 1 card rendered for the 1 valid attempt in dirty history");

  // 5.5 Stringified Numbers & String Booleans Handling
  const stringifiedAttempt = [{
    id: "str-1",
    date: "2026-08-06T12:00:00Z",
    totalScore: "48",
    totalQuestions: "70",
    isPassed: "true",
    grade: "23",
    moduleScores: {
      "Cell Biology": { score: "22", total: "30" },
      "Histology": { score: "15", total: "24" },
      "Embryology": { score: "8", total: "12" },
      "Interdisciplinary": { score: "3", total: "4" }
    }
  }, {
    id: "str-2",
    date: "2026-08-07T12:00:00Z",
    totalScore: "30",
    totalQuestions: "70",
    isPassed: "false",
    grade: "FAIL",
    moduleScores: {
      "Cell Biology": { score: "12", total: "30" },
      "Histology": { score: "10", total: "24" },
      "Embryology": { score: "6", total: "12" },
      "Interdisciplinary": { score: "2", total: "4" }
    }
  }];
  const strSummary = calculateAnalyticsSummary(stringifiedAttempt);
  assertEqual(strSummary.totalAttempts, 2, "2 stringified attempts processed");
  assertEqual(strSummary.passCount, 1, "1 pass correctly detected from 'true'");
  assertEqual(strSummary.failCount, 1, "1 fail correctly detected from 'false'");
  assertEqual(strSummary.totalCorrectAnswers, 78, "Total correct is 78 (48+30)");
  assertEqual(strSummary.totalQuestionsAnswered, 140, "Total questions is 140 (70+70)");
  assertEqual(strSummary.moduleStats["Cell Biology"].score, 34, "Cell Bio score is 34 (22+12)");
  assertEqual(strSummary.moduleStats["Cell Biology"].total, 60, "Cell Bio total is 60 (30+30)");

  // 5.6 Academic Italian Grades Parsing Variations
  const gradeVariants = [
    { totalScore: 70, totalQuestions: 70, isPassed: true, grade: "30L" },
    { totalScore: 70, totalQuestions: 70, isPassed: true, grade: "30 LODE" },
    { totalScore: 70, totalQuestions: 70, isPassed: true, grade: "30 E LODE" },
    { totalScore: 70, totalQuestions: 70, isPassed: true, grade: "30/30 LODE" },
    { totalScore: 65, totalQuestions: 70, isPassed: true, grade: "28/30" },
    { totalScore: 30, totalQuestions: 70, isPassed: false, grade: "RESPINTO" },
    { totalScore: 25, totalQuestions: 70, isPassed: false, grade: "FAIL" },
    { totalScore: 20, totalQuestions: 70, isPassed: false, grade: null }
  ];
  const gradeSummary = calculateAnalyticsSummary(gradeVariants);
  assertEqual(gradeSummary.validGradeCount, 5, "5 attempts have valid grades (4 30L variants + 1 28)");
  assertEqual(gradeSummary.avgGrade, 29.6, "Average grade is 29.6 ((30*4 + 28) / 5)");

  // 5.7 Missing or Corrupted Timestamps
  const timestampEdgeAttempts = [
    { totalScore: 50, totalQuestions: 70, isPassed: true, date: null },
    { totalScore: 55, totalQuestions: 70, isPassed: true, date: "not-a-valid-date" },
    { totalScore: 60, totalQuestions: 70, isPassed: true, date: 1724500000000 }
  ];
  state.history = timestampEdgeAttempts;
  updateAnalyticsUI();
  const renderedHistoryCards = dynamicContentEl.querySelectorAll(".history-item-card");
  assertEqual(renderedHistoryCards.length, 3, "3 history cards rendered despite timestamp quirks");
  const historyText = dynamicContentEl.textContent;
  assert(!historyText.includes("Invalid Date"), "DOM does not display 'Invalid Date'");

  // 5.8 Single Module Practice Exam (Only 1 module has attempts)
  const singleModulePractice = [{
    id: "cb-only",
    date: "2026-08-08",
    totalScore: 18,
    totalQuestions: 20,
    isPassed: true,
    grade: "27",
    moduleScores: {
      "Cell Biology": { score: 18, total: 20 }
      // Other modules omitted/0 questions
    }
  }];
  const singleModSummary = calculateAnalyticsSummary(singleModulePractice);
  assertEqual(singleModSummary.weakestModule, "Cell Biology", "Weakest module is Cell Biology (the only module with attempts)");
  assertEqual(singleModSummary.moduleStats["Histology"].total, 0, "Histology has 0 questions");
  assertEqual(singleModSummary.modulesBelowThreshold.length, 0, "No modules below 60% since Cell Bio is 90%");
  assertEqual(singleModSummary.studyRecommendations.module, "Cell Biology", "Recommendations target Cell Biology");

  // 5.9 Safe localStorage Error Recovery
  if (typeof safeGetLocalStorageArray === "function") {
    mockLocalStorage["test_corrupt_key"] = "{corrupted json syntax error";
    const recovered = safeGetLocalStorageArray("test_corrupt_key");
    assert(Array.isArray(recovered) && recovered.length === 0, "safeGetLocalStorageArray safely recovers from corrupted JSON to []");
  }

  // 5.10 Reset History Button Disabled/Enabled State
  state.history = [];
  updateAnalyticsUI();
  const btnResetEmpty = mockDoc.getElementById("btn-reset-analytics");
  assertEqual(btnResetEmpty.disabled, true, "Reset button is disabled when history is empty");

  state.history = multiAttempts;
  updateAnalyticsUI();
  const btnResetPopulated = mockDoc.getElementById("btn-reset-analytics");
  assertEqual(btnResetPopulated.disabled, false, "Reset button is enabled when history has attempts");

  // 5.11 Score Progression Timeline Trajectory Calculations
  const improvingHistory = [
    { totalScore: 35, totalQuestions: 70, isPassed: false, date: "2026-08-01" }, // 50%
    { totalScore: 45, totalQuestions: 70, isPassed: true, date: "2026-08-02" },  // 64%
    { totalScore: 56, totalQuestions: 70, isPassed: true, date: "2026-08-03" }   // 80% (+30%)
  ];
  const chartImproving = renderAnalyticsTrendChart(improvingHistory);
  assert(chartImproving.includes("Improving Trajectory"), "Trend chart indicates Improving Trajectory for +30% diff");

  const decliningHistory = [
    { totalScore: 56, totalQuestions: 70, isPassed: true, date: "2026-08-01" },  // 80%
    { totalScore: 45, totalQuestions: 70, isPassed: true, date: "2026-08-02" },  // 64%
    { totalScore: 35, totalQuestions: 70, isPassed: false, date: "2026-08-03" }  // 50% (-30%)
  ];
  const chartDeclining = renderAnalyticsTrendChart(decliningHistory);
  assert(chartDeclining.includes("Review Advised"), "Trend chart indicates Review Advised for -30% diff");

  const steadyHistory = [
    { totalScore: 50, totalQuestions: 70, isPassed: true, date: "2026-08-01" },  // 71.4%
    { totalScore: 51, totalQuestions: 70, isPassed: true, date: "2026-08-02" },  // 72.8%
    { totalScore: 50, totalQuestions: 70, isPassed: true, date: "2026-08-03" }   // 71.4% (0% diff)
  ];
  const chartSteady = renderAnalyticsTrendChart(steadyHistory);
  assert(chartSteady.includes("Steady Consistency"), "Trend chart indicates Steady Consistency for 0% diff");

  // 5.12 Italian Academic Grade Zero & Prefix Handling
  const zeroGradeAttempts = [
    { totalScore: 0, totalQuestions: 70, isPassed: false, grade: "0" },
    { totalScore: 0, totalQuestions: 70, isPassed: false, grade: 0 },
    { totalScore: 40, totalQuestions: 70, isPassed: false, grade: "Grade: 17/30" },
    { totalScore: 60, totalQuestions: 70, isPassed: true, grade: "26 / 30" }
  ];
  const zeroGradeSummary = calculateAnalyticsSummary(zeroGradeAttempts);
  assertEqual(zeroGradeSummary.validGradeCount, 4, "All 4 attempts have valid numeric grades including 0 and prefixed grades");
  assertEqual(zeroGradeSummary.avgGrade, (0 + 0 + 17 + 26) / 4, "Average grade calculation correctly includes grade 0");

  // 5.13 Extended isAttemptPassed Numeric & Italian Terminology
  assertEqual(isAttemptPassed({ isPassed: 1 }), true, "Numeric 1 is detected as passed");
  assertEqual(isAttemptPassed({ isPassed: 0 }), false, "Numeric 0 is detected as failed");
  assertEqual(isAttemptPassed({ isPassed: "superato" }), true, "'superato' is detected as passed");
  assertEqual(isAttemptPassed({ isPassed: "approvato" }), true, "'approvato' is detected as passed");
  assertEqual(isAttemptPassed({ isPassed: "idoneo" }), true, "'idoneo' is detected as passed");
  assertEqual(isAttemptPassed({ isPassed: "respinto" }), false, "'respinto' is detected as failed");
  assertEqual(isAttemptPassed({ isPassed: "bocciato" }), false, "'bocciato' is detected as failed");
  assertEqual(isAttemptPassed({ isPassed: "non idoneo" }), false, "'non idoneo' is detected as failed");

  // 5.14 Decimal Module Score Formatting in DOM
  const decimalScoreAttempt = [{
    id: "dec-1",
    date: "2026-08-09",
    totalScore: 14.5,
    totalQuestions: 20,
    isPassed: true,
    grade: "22",
    moduleScores: {
      "Cell Biology": { score: 14.5, total: 20 }
    }
  }];
  state.history = decimalScoreAttempt;
  updateAnalyticsUI();
  const ratioText = dynamicContentEl.querySelector("#module-ratio-cellbio");
  assert(ratioText && ratioText.textContent.includes("14.5 / 20"), "Module ratio cleanly renders '14.5 / 20 correct' without precision artifacts");

  // 5.15 Cross-Tab Storage Event Synchronization
  const externalAttempt = [{
    id: "tab-2",
    date: "2026-08-10T15:00:00Z",
    totalScore: 68,
    totalQuestions: 70,
    isPassed: true,
    grade: "29",
    moduleScores: {
      "Cell Biology": { score: 29, total: 30 },
      "Histology": { score: 23, total: 24 },
      "Embryology": { score: 12, total: 12 },
      "Interdisciplinary": { score: 4, total: 4 }
    }
  }];
  mockLocalStorage["cbeh_history"] = JSON.stringify(externalAttempt);
  mockWindow.dispatchEvent({ type: "storage", key: "cbeh_history" });
  assertEqual(state.history.length, 1, "Storage event triggers state.history refresh from localStorage");
  const attemptsMetricEl = dynamicContentEl.querySelector("#analytics-attempts");
  assertEqual(attemptsMetricEl ? attemptsMetricEl.textContent.trim() : "", "1", "DOM automatically re-renders with new attempt count (1)");

  // 5.16 Disabled Reset Button Click Guard
  state.history = [];
  mockLocalStorage["cbeh_history"] = JSON.stringify([]);
  updateAnalyticsUI();
  const btnResetDisabled = mockDoc.getElementById("btn-reset-analytics");
  assertEqual(btnResetDisabled.disabled, true, "Reset button is disabled on empty history");
  btnResetDisabled.click(); // Dispatches click on disabled button
  assertEqual(state.history.length, 0, "Clicking disabled reset button does not mutate state or throw errors");

  // 5.17 formatAttemptGradeDisplay Robustness
  assertEqual(formatAttemptGradeDisplay({ grade: 0 }, 0, 70), "Grade: 0 / 30", "Numeric 0 is formatted as 'Grade: 0 / 30' (not masked as score)");
  assertEqual(formatAttemptGradeDisplay({ grade: "0" }, 0, 70), "Grade: 0 / 30", "String '0' is formatted as 'Grade: 0 / 30'");
  assertEqual(formatAttemptGradeDisplay({ grade: "30L" }, 70, 70), "Grade: 30L", "30L has clean 'Grade: 30L' display without redundant / 30");
  assertEqual(formatAttemptGradeDisplay({ grade: "30 e Lode" }, 70, 70), "Grade: 30L", "'30 e Lode' maps to 'Grade: 30L'");
  assertEqual(formatAttemptGradeDisplay({ grade: "FAIL" }, 30, 70), "Status: FAIL", "'FAIL' maps to 'Status: FAIL' (not 'Grade: FAIL / 30')");
  assertEqual(formatAttemptGradeDisplay({ grade: "RESPINTO" }, 25, 70), "Status: RESPINTO", "'RESPINTO' maps to 'Status: RESPINTO'");
  assertEqual(formatAttemptGradeDisplay({ grade: "Grade: 27/30" }, 55, 70), "Grade: 27 / 30", "'Grade: 27/30' normalizes to 'Grade: 27 / 30'");
  assertEqual(formatAttemptGradeDisplay({ grade: "28 / 30" }, 60, 70), "Grade: 28 / 30", "'28 / 30' normalizes to 'Grade: 28 / 30'");
  assertEqual(formatAttemptGradeDisplay({ grade: null }, 45, 70), "Score: 45 / 70", "Null grade falls back to 'Score: 45 / 70'");

  // 5.18 Flexible Module Name & Alias Matching (getModuleScoreEntry)
  const flexibleAttempt = [{
    id: "flex-1",
    date: "2026-08-11",
    totalScore: 55,
    totalQuestions: 70,
    isPassed: true,
    grade: "26",
    moduleScores: {
      "cell biology": { score: 25, total: 30 },
      "hist": { score: 18, total: 24 },
      "embryo": { score: 8, total: 12 },
      "ind": { score: 4, total: 4 }
    }
  }];
  const flexSummary = calculateAnalyticsSummary(flexibleAttempt);
  assertEqual(flexSummary.moduleStats["Cell Biology"].score, 25, "Lowercase 'cell biology' matched to Cell Biology");
  assertEqual(flexSummary.moduleStats["Histology"].score, 18, "Short alias 'hist' matched to Histology");
  assertEqual(flexSummary.moduleStats["Embryology"].score, 8, "Short alias 'embryo' matched to Embryology");
  assertEqual(flexSummary.moduleStats["Interdisciplinary"].score, 4, "Short alias 'ind' matched to Interdisciplinary");

  // 5.19 Fallback isAttemptPassed with Per-Module 50% Threshold Check
  const subModuleFailAttempt = {
    totalScore: 45, // 64.3% overall (>= 60%)
    totalQuestions: 70,
    moduleScores: {
      "Cell Biology": { score: 26, total: 30 },     // 86.7%
      "Histology": { score: 14, total: 24 },        // 58.3%
      "Embryology": { score: 2, total: 12 },        // 16.7% (<50% -> FAIL)
      "Interdisciplinary": { score: 3, total: 4 }   // 75%
    }
  };
  assertEqual(isAttemptPassed(subModuleFailAttempt), false, "Attempt with overall 64.3% but Embryology < 50% fails per CBEH rules");

  const allModulesPassAttempt = {
    totalScore: 45, // 64.3% overall
    totalQuestions: 70,
    moduleScores: {
      "Cell Biology": { score: 20, total: 30 },     // 66.7%
      "Histology": { score: 14, total: 24 },        // 58.3%
      "Embryology": { score: 7, total: 12 },        // 58.3%
      "Interdisciplinary": { score: 4, total: 4 }   // 100%
    }
  };
  assertEqual(isAttemptPassed(allModulesPassAttempt), true, "Attempt with overall >= 60% and all modules >= 50% passes");

  // 5.20 Attempt History DOM Rendering with Grade 0, 30L, and Aliases
  state.history = [
    {
      id: "zero-hist",
      date: "2026-08-12",
      totalScore: 0,
      totalQuestions: 70,
      isPassed: false,
      grade: 0,
      moduleScores: { "Cell Biology": { score: 0, total: 30 } }
    },
    {
      id: "lode-hist",
      date: "2026-08-13",
      totalScore: 70,
      totalQuestions: 70,
      isPassed: true,
      grade: "30L",
      moduleScores: { "cellbio": { score: 30, total: 30 } }
    }
  ];
  updateAnalyticsUI();
  const renderedHistItems = dynamicContentEl.querySelectorAll(".history-item-card");
  assertEqual(renderedHistItems.length, 2, "2 history cards rendered");
  const histText = dynamicContentEl.textContent;
  assert(histText.includes("Grade: 0 / 30"), "History DOM displays 'Grade: 0 / 30' for numeric grade 0");
  assert(histText.includes("Grade: 30L"), "History DOM displays 'Grade: 30L' for 30L");
  assert(!histText.includes("Grade: 30L / 30"), "History DOM does not display malformed 'Grade: 30L / 30'");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  mockConsole.log("\n================================================================================");
  mockConsole.log(`VERIFICATION SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  if (failed > 0) {
    mockConsole.error("\nFAILURES REPORT:");
    failureReports.forEach((f, i) => {
      mockConsole.error(`${i + 1}) ${f.message}: ${f.details}`);
    });
  }

  return failed === 0 ? "SUCCESS" : "FAILURE";
}

runAnalyticsDashboardTests();

