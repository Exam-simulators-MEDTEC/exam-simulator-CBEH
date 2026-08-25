// Adversarial Deep Verification Suite for CBEH Exam Simulator:
// Comprehensive Testing of Keyboard Shortcuts (R1) & Timer Duration Freeze on Resume (R2)
// Executed via JavaScriptCore (osascript -l JavaScript)

function runAdversarialDeepTests() {
  const fs = $.NSFileManager.defaultManager;
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
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
  mockConsole.log("   DEEP ADVERSARIAL VERIFICATION: KEYBOARD SHORTCUTS & TIMER FREEZE");
  mockConsole.log("================================================================================");

  // Full DOM Mock Implementation
  class MockElement {
    constructor(tagName = "div") {
      this.tagName = tagName.toUpperCase();
      this.id = "";
      this.type = "";
      this.name = "";
      this.value = "";
      this.checked = false;
      this.disabled = false;
      this.isContentEditable = false;
      this.textContent = "";
      this.children = [];
      this.parentNode = null;
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.eventListeners = {};

      this.classList = {
        _classes: new Set(),
        add: (...cls) => {
          cls.forEach(c => this.classList._classes.add(c));
        },
        remove: (...cls) => {
          cls.forEach(c => this.classList._classes.delete(c));
        },
        contains: (c) => this.classList._classes.has(c),
        toggle: (c) => {
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            return false;
          } else {
            this.classList._classes.add(c);
            return true;
          }
        },
        toString: () => Array.from(this.classList._classes).join(" ")
      };
    }

    set className(val) {
      this.classList._classes = new Set((val || "").split(/\s+/).filter(Boolean));
    }

    get className() {
      return this.classList.toString();
    }

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      this.textContent = html ? html.replace(/<[^>]*>/g, "") : "";
    }

    get innerHTML() {
      return this._innerHTML || this.textContent;
    }

    appendChild(child) {
      if (!child) return child;
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }

    remove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }

    setAttribute(name, val) {
      this.attributes[name] = String(val);
    }

    getAttribute(name) {
      return this.attributes[name] !== undefined ? this.attributes[name] : null;
    }

    removeAttribute(name) {
      delete this.attributes[name];
    }

    addEventListener(type, listener) {
      if (!this.eventListeners[type]) this.eventListeners[type] = [];
      this.eventListeners[type].push(listener);
    }

    removeEventListener(type, listener) {
      if (this.eventListeners[type]) {
        this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
      }
    }

    dispatchEvent(event) {
      if (event.type === "change" && this.tagName === "INPUT" && this.type === "radio" && this.name) {
        const root = this.parentNode ? this.parentNode.parentNode || this.parentNode : null;
        if (root) {
          const peers = root.querySelectorAll(`input[name='${this.name}']`);
          peers.forEach(p => { if (p !== this) p.checked = false; });
        }
      }

      const listeners = this.eventListeners[event.type] || [];
      listeners.forEach(l => {
        try {
          l.call(this, event);
        } catch (e) {
          mockConsole.error("Error in element listener: " + e.message);
        }
      });
      return !event.defaultPrevented;
    }

    click() {
      if (this.type === "radio") {
        this.checked = true;
      }
      this.dispatchEvent({ type: "click", target: this, defaultPrevented: false, preventDefault: function() { this.defaultPrevented = true; } });
    }

    querySelector(sel) {
      const all = this.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(sel) {
      const results = [];
      function matchEl(el, selector) {
        if (!selector) return false;
        if (selector.startsWith("#")) return el.id === selector.slice(1);
        if (selector.startsWith(".")) return el.classList.contains(selector.slice(1));
        if (selector === "textarea") return el.tagName === "TEXTAREA";
        if (selector === "select") return el.tagName === "SELECT";
        if (selector === "button") return el.tagName === "BUTTON";
        if (selector === "label") return el.tagName === "LABEL";
        if (selector === "input[type='radio']") return el.tagName === "INPUT" && el.type === "radio";
        if (selector === "input[type='radio']:checked") return el.tagName === "INPUT" && el.type === "radio" && el.checked;
        if (selector === "input[type='checkbox']") return el.tagName === "INPUT" && el.type === "checkbox";
        return el.tagName === selector.toUpperCase();
      }

      function traverse(curr) {
        for (const child of curr.children) {
          if (matchEl(child, sel)) results.push(child);
          traverse(child);
        }
      }
      traverse(this);
      return results;
    }
  }

  const elementsById = {};
  function registerElement(id, tagName = "div") {
    const el = new MockElement(tagName);
    el.id = id;
    elementsById[id] = el;
    return el;
  }

  // Register screen elements
  const screenWelcome = registerElement("screen-welcome", "div");
  screenWelcome.classList.add("screen", "active");
  const screenExam = registerElement("screen-exam", "div");
  screenExam.classList.add("screen");
  const screenResults = registerElement("screen-results", "div");
  screenResults.classList.add("screen");

  registerElement("palette-select", "select");
  const btnResumeExam = registerElement("btn-resume-exam", "button");
  registerElement("custom-modal-overlay", "div");
  registerElement("custom-modal-message", "p");
  registerElement("custom-modal-btn-cancel", "button");
  registerElement("custom-modal-btn-confirm", "button");
  registerElement("sim-questions-modal", "div");
  registerElement("btn-start-exam", "button");
  const btnSubmitExam = registerElement("btn-submit-exam", "button");
  const btnRestartExam = registerElement("btn-restart-exam", "button");
  const btnHomeExam = registerElement("btn-home-exam", "button");
  const btnHomeResults = registerElement("btn-home-results", "button");
  const btnPrevQuestion = registerElement("btn-prev-question", "button");
  const btnNextQuestion = registerElement("btn-next-question", "button");
  const questionIndexCounter = registerElement("question-index-counter", "span");
  const questionModuleBadge = registerElement("question-module-badge", "span");
  const examTimer = registerElement("exam-timer", "span");
  const timerBox = registerElement("timer-box", "div");
  registerElement("question-card", "div");
  const questionText = registerElement("question-text", "p");
  const answerInputsArea = registerElement("answer-inputs-area", "div");
  const flagCheckbox = registerElement("flag-checkbox", "input");
  flagCheckbox.type = "checkbox";
  registerElement("flag-label-container", "label");
  const btnBookmarkQuestion = registerElement("btn-bookmark-question", "button");
  const bookmarkIconSvg = registerElement("bookmark-icon-svg", "svg");
  const questionsGridContainer = registerElement("questions-grid-container", "div");

  registerElement("upload-dropzone", "div");
  registerElement("pdf-file-input", "input");
  registerElement("pool-status-count", "span");
  registerElement("pool-status-sims", "span");
  registerElement("upload-log", "div");

  registerElement("result-status-badge", "div");
  registerElement("result-score-summary", "div");
  registerElement("score-cellbio", "div");
  registerElement("status-cellbio", "div");
  registerElement("card-result-cellbio", "div");
  registerElement("score-histology", "div");
  registerElement("status-histology", "div");
  registerElement("card-result-histology", "div");
  registerElement("score-embryo", "div");
  registerElement("status-embryo", "div");
  registerElement("card-result-embryo", "div");
  registerElement("score-interdisciplinary", "div");
  registerElement("status-interdisciplinary", "div");
  registerElement("card-result-interdisciplinary", "div");

  registerElement("tab-btn-grading", "button");
  registerElement("tab-btn-review", "button");
  registerElement("tab-content-grading", "div");
  registerElement("tab-content-review", "div");
  registerElement("open-questions-grading-list", "div");
  registerElement("auto-questions-review-list", "div");

  registerElement("welcome-tab-settings", "button");
  registerElement("welcome-tab-bookmarks", "button");
  registerElement("welcome-tab-analytics", "button");
  registerElement("welcome-tab-database", "button");
  registerElement("welcome-panel-settings", "div");
  registerElement("welcome-panel-bookmarks", "div");
  registerElement("welcome-panel-analytics", "div");
  registerElement("welcome-panel-database", "div");
  registerElement("bookmarks-list", "div");
  registerElement("btn-start-bookmarks-quiz", "button");

  const docEventListeners = {};
  const mockDoc = {
    body: { dataset: {} },
    activeElement: null,
    getElementById: (id) => elementsById[id] || null,
    querySelector: (sel) => {
      if (sel.startsWith("#")) return elementsById[sel.substring(1)] || null;
      for (const key of Object.keys(elementsById)) {
        const el = elementsById[key];
        const res = el.querySelector(sel);
        if (res) return res;
      }
      if (sel === ".custom-modal-overlay.active") {
        const overlay = elementsById["custom-modal-overlay"];
        if (overlay && overlay.classList.contains("active")) return overlay;
        const simModal = elementsById["sim-questions-modal"];
        if (simModal && simModal.classList.contains("active")) return simModal;
        return null;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const results = [];
      for (const key of Object.keys(elementsById)) {
        const el = elementsById[key];
        const found = el.querySelectorAll(sel);
        results.push(...found);
      }
      return results;
    },
    createElement: (tag) => new MockElement(tag),
    createTextNode: (txt) => {
      const el = new MockElement("span");
      el.textContent = txt;
      return el;
    },
    addEventListener: (type, cb) => {
      if (!docEventListeners[type]) docEventListeners[type] = [];
      docEventListeners[type].push(cb);
      if (type === "DOMContentLoaded") {
        try { cb(); } catch (e) { mockConsole.error("DOMContentLoaded error: " + e); }
      }
    },
    removeEventListener: (type, cb) => {
      if (!docEventListeners[type]) return;
      docEventListeners[type] = docEventListeners[type].filter(l => l !== cb);
    }
  };

  const mockLocalStorage = {};
  const mockWindow = {
    CBEH_QUESTIONS: [
      { id: 1, module: "Cell Biology", type: "multiple-choice", question: "Which organelle synthesizes ATP?", options: ["A. Ribosome", "B. Mitochondrion", "C. Golgi", "D. Nucleus"], correct: "B" },
      { id: 2, module: "Cell Biology", type: "true-false", question: "Gap junctions permit direct cytoplasmic exchange.", options: ["True", "False"], correct: "True" },
      { id: 3, module: "Histology", type: "fill-in-the-gap", question: "The principal collagen type in basal lamina is type ________ collagen.", options: ["A. IV", "B. I", "C. II", "D. III"], correct: "A. IV" },
      { id: 4, module: "Embryology", type: "open", question: "Describe gastrulation.", solution: "Formation of trilaminar disc." },
      { id: 5, module: "Interdisciplinary", type: "multiple-choice", question: "Which enzyme is active in lysosomes?", options: ["A. Acid hydrolase", "B. Catalase", "C. DNA polymerase", "D. Hexokinase", "E. Amylase"], correct: "A" }
    ],
    pdfjsLib: null,
    addEventListener: () => {},
    scrollTo: () => {}
  };

  function fireKeyDown(eventProps) {
    const evt = {
      type: "keydown",
      key: eventProps.key || "",
      code: eventProps.code || "",
      ctrlKey: !!eventProps.ctrlKey,
      metaKey: !!eventProps.metaKey,
      altKey: !!eventProps.altKey,
      shiftKey: !!eventProps.shiftKey,
      defaultPrevented: false,
      preventDefault: function() { this.defaultPrevented = true; }
    };
    const listeners = docEventListeners["keydown"] || [];
    for (const listener of listeners) {
      listener(evt);
    }
    return evt;
  }

  // Load app.js in sandbox
  const appRunner = new Function("window", "document", "localStorage", "console", "setInterval", "clearInterval", "setTimeout", "clearTimeout", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    globalObj.setInterval = setInterval;
    globalObj.clearInterval = clearInterval;
    globalObj.setTimeout = setTimeout;
    globalObj.clearTimeout = clearTimeout;
    if (typeof Event === "undefined") {
      globalObj.Event = function(type, opts) {
        this.type = type;
        this.bubbles = !!(opts && opts.bubbles);
      };
    }
    ${appJsCode}
    return window;
  `);

  let timerIdCounter = 1;
  const activeIntervals = new Set();
  function mockSetInterval(fn, ms) {
    const id = timerIdCounter++;
    activeIntervals.add(id);
    return id;
  }
  function mockClearInterval(id) {
    activeIntervals.delete(id);
  }
  function mockSetTimeout(fn, ms) {
    return timerIdCounter++;
  }
  function mockClearTimeout(id) {}

  const appScope = appRunner(mockWindow, mockDoc, {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  }, mockConsole, mockSetInterval, mockClearInterval, mockSetTimeout, mockClearTimeout);

  const state = appScope.state;
  const startExamWithQuestions = appScope.startExamWithQuestions;
  const selectOptionByIndex = appScope.selectOptionByIndex;
  const handleNextQuestion = appScope.handleNextQuestion;
  const handlePrevQuestion = appScope.handlePrevQuestion;
  const saveCurrentSimulationProgress = appScope.saveCurrentSimulationProgress;
  const saveActiveExamState = appScope.saveActiveExamState;
  const updateTimerDisplay = appScope.updateTimerDisplay;
  const resetExam = appScope.resetExam;
  const saveQuestionsPool = appScope.saveQuestionsPool;
  const loadAppState = appScope.loadAppState;

  const sampleQuestions = [
    { id: 1, type: "multiple-choice", module: "Cell Biology", question: "Which organelle synthesizes ATP?", options: ["A. Ribosome", "B. Mitochondrion", "C. Nucleus", "D. Golgi"], correctOption: "B", explanation: "Mitochondria generate ATP." },
    { id: 2, type: "true-false", module: "Histology", question: "Epithelium is vascularized.", options: ["True", "False"], correctOption: "False", explanation: "Epithelium is avascular." },
    { id: 3, type: "fill-in-the-gap", module: "Embryology", question: "The notochord induces neural tube ________ formation.", options: ["A. closure", "B. regression", "C. splitting", "D. folding"], correctOption: "A. closure", explanation: "Induction leads to closure." },
    { id: 4, type: "open", module: "Interdisciplinary", question: "Describe oxidative phosphorylation mechanisms in detail.", correctOption: "Proton gradient powers ATP synthase.", explanation: "Chemiosmotic coupling." },
    { id: 5, type: "multiple-choice", module: "Cell Biology", question: "Five-choice question test", options: ["A. First", "B. Second", "C. Third", "D. Fourth", "E. Fifth"], correctOption: "E", explanation: "Fifth option is correct." }
  ];

  // ---------------------------------------------------------------------------
  // SUITE 1: Timer Boundaries & Low-Time Warning Management
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Timer Boundaries & Low-Time Warning Management");

  startExamWithQuestions(sampleQuestions);
  assertEqual(state.timeLeft, 15 * 60, "Initial timeLeft for 5-question set is 900 seconds (15 mins)");
  assert(!timerBox.classList.contains("warning"), "Timer box does not have warning class at start of exam");

  // Set timeLeft to 4 minutes (240s < 300s)
  state.timeLeft = 240;
  updateTimerDisplay();
  assertEqual(examTimer.textContent, "04:00", "Timer display shows 04:00");
  assert(timerBox.classList.contains("warning"), "Timer box gains .warning class when timeLeft < 300 seconds");

  // User saves and exits
  saveCurrentSimulationProgress();
  assertEqual(state.timeLeft, 240, "Frozen timeLeft is preserved as 240 seconds");

  // Resume exam
  btnResumeExam.click();
  assertEqual(state.timeLeft, 240, "Resumed timeLeft is exactly 240 seconds");
  assert(timerBox.classList.contains("warning"), "Resumed exam with < 5 mins retains warning class");

  // Set timeLeft to 45 mins (2700s > 300s)
  state.timeLeft = 2700;
  updateTimerDisplay();
  assertEqual(examTimer.textContent, "45:00", "Timer display shows 45:00");
  assert(!timerBox.classList.contains("warning"), "Timer box correctly clears .warning class when timeLeft >= 300s");

  // ---------------------------------------------------------------------------
  // SUITE 2: Boundary Navigation & Wrap-around Immunity
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Boundary Navigation & Rapid Navigation Immunity");

  state.currentQuestionIndex = 0;
  appScope.renderQuestion();
  mockDoc.activeElement = null;

  // Attempt to go previous from question index 0
  fireKeyDown({ key: "p", code: "KeyP" });
  assertEqual(state.currentQuestionIndex, 0, "Pressing 'P' at first question remains at index 0 without error");

  fireKeyDown({ key: "arrowleft", code: "ArrowLeft" });
  assertEqual(state.currentQuestionIndex, 0, "Pressing Left Arrow at first question remains at index 0");

  // Navigate to last question (index 4)
  state.currentQuestionIndex = 4;
  appScope.renderQuestion();

  // Attempt to go next from last question
  fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 4, "Pressing 'N' at last question remains at index 4 without error");

  fireKeyDown({ key: "arrowright", code: "ArrowRight" });
  assertEqual(state.currentQuestionIndex, 4, "Pressing Right Arrow at last question remains at index 4");

  // ---------------------------------------------------------------------------
  // SUITE 3: Full Keyboard Input Types & Focus Guard Granularity
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] Full Keyboard Input Types & Focus Guard Granularity");

  state.currentQuestionIndex = 0;
  appScope.renderQuestion();

  // Test various input elements
  const inputTypesBlocked = ["text", "search", "password", "email", "number", "url", "tel"];
  inputTypesBlocked.forEach(type => {
    const textInput = new MockElement("input");
    textInput.type = type;
    mockDoc.activeElement = textInput;

    const navEvt = fireKeyDown({ key: "n", code: "KeyN" });
    assertEqual(state.currentQuestionIndex, 0, `Shortcuts blocked when <input type='${type}'> has focus`);
    assertEqual(navEvt.defaultPrevented, false, `Event not prevented in <input type='${type}'>`);
  });

  const inputTypesAllowed = ["radio", "checkbox", "button", "submit", "reset"];
  inputTypesAllowed.forEach(type => {
    const nonTextInput = new MockElement("input");
    nonTextInput.type = type;
    mockDoc.activeElement = nonTextInput;

    state.currentQuestionIndex = 0;
    appScope.renderQuestion();

    const navEvt = fireKeyDown({ key: "n", code: "KeyN" });
    assertEqual(state.currentQuestionIndex, 1, `Shortcuts allowed when <input type='${type}'> has focus`);
    assertEqual(navEvt.defaultPrevented, true, `Event handled and prevented when non-text input has focus`);
  });

  // Test Italian Vero/Falso ('V' for True, 'F' for False)
  state.currentQuestionIndex = 1; // Question 2 (True/False)
  appScope.renderQuestion();
  mockDoc.activeElement = null;

  fireKeyDown({ key: "v", code: "KeyV" });
  assertEqual(state.answers[2], "True", "Pressing 'V' (Vero) selects 'True' on True/False questions");

  fireKeyDown({ key: "f", code: "KeyF" });
  assertEqual(state.answers[2], "False", "Pressing 'F' (Falso) selects 'False' on True/False questions");

  // ---------------------------------------------------------------------------
  // SUITE 4: Persistence Isolation & Corrupted Keys Protection
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Persistence Isolation & Corrupted Keys Protection");

  // Populate questions pool
  state.questionsPool = [...sampleQuestions];
  saveQuestionsPool();
  assert(mockLocalStorage["cbeh_questions_pool_v1"] !== undefined, "Pool saved in localStorage");

  // Corrupt only active exam state
  mockLocalStorage["cbeh_active_exam_state_v1"] = "{ corrupt json ]";

  // Load app state
  const loadOk = loadAppState();
  assert(loadOk, "loadAppState() succeeds even with corrupted active exam key");
  assertEqual(state.questionsPool.length, 5, "cbeh_questions_pool_v1 was NOT deleted or corrupted!");

  // Clean up
  resetExam();

  mockConsole.log("================================================================================");
  mockConsole.log(`DEEP TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  if (failed > 0) {
    mockConsole.error("SOME DEEP ADVERSARIAL TESTS FAILED:");
    failureReports.forEach(r => mockConsole.error(`- ${r.message}: ${r.details}`));
    return false;
  }
  mockConsole.log("SUCCESS: ALL DEEP ADVERSARIAL TESTS PASSED!");
  return true;
}

runAdversarialDeepTests();
