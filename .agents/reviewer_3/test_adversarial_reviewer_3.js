// Adversarial Verification Test Suite 3: Keyboard Shortcuts & Timer Duration Freeze
// Executed via JavaScriptCore (osascript -l JavaScript)

function runAdversarialReviewer3Tests() {
  const fs = $.NSFileManager.defaultManager;
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
  mockConsole.log("   ADVERSARIAL REVIEWER 3: KEYBOARD SHORTCUTS (R1) & TIMER FREEZE (R2)");
  mockConsole.log("================================================================================");

  // Full Mock DOM Environment
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
      if (!this.eventListeners[type]) return;
      this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
    }

    dispatchEvent(event) {
      event.target = this;
      if (this.eventListeners[event.type]) {
        this.eventListeners[event.type].forEach(l => l(event));
      }
      if (event.bubbles && this.parentNode) {
        this.parentNode.dispatchEvent(event);
      }
      return !event.defaultPrevented;
    }

    click() {
      this.dispatchEvent({ type: "click", target: this, bubbles: true, cancelable: true });
    }

    querySelector(sel) {
      const results = this.querySelectorAll(sel);
      return results.length > 0 ? results[0] : null;
    }

    querySelectorAll(sel) {
      const results = [];
      function match(node) {
        if (!node) return;
        let isMatch = false;
        if (sel.startsWith("#")) {
          isMatch = node.id === sel.slice(1);
        } else if (sel.startsWith(".")) {
          isMatch = node.classList.contains(sel.slice(1));
        } else if (sel.startsWith("input[")) {
          const typeMatch = sel.match(/type=['"]?([^'"\]]+)/);
          const checkedMatch = sel.includes(":checked");
          if (node.tagName === "INPUT") {
            let matchesType = !typeMatch || node.type === typeMatch[1];
            let matchesChecked = !checkedMatch || node.checked === true;
            isMatch = matchesType && matchesChecked;
          }
        } else if (sel === "textarea") {
          isMatch = node.tagName === "TEXTAREA";
        } else if (sel === "select") {
          isMatch = node.tagName === "SELECT";
        } else if (sel === "kbd") {
          isMatch = node.tagName === "KBD";
        } else if (sel === "span") {
          isMatch = node.tagName === "SPAN";
        } else if (sel === "label") {
          isMatch = node.tagName === "LABEL";
        } else if (sel === "div") {
          isMatch = node.tagName === "DIV";
        } else if (sel === "button") {
          isMatch = node.tagName === "BUTTON";
        } else {
          isMatch = node.tagName.toLowerCase() === sel.toLowerCase();
        }

        if (isMatch) results.push(node);
        if (node.children) {
          node.children.forEach(match);
        }
      }
      if (this.children) {
        this.children.forEach(match);
      }
      return results;
    }
  }

  // Build simulated DOM elements
  const elements = {};
  const elementIds = [
    "palette-select", "btn-resume-exam", "custom-modal-overlay", "custom-modal-message",
    "custom-modal-btn-cancel", "custom-modal-btn-confirm", "screen-welcome", "screen-exam",
    "screen-results", "btn-start-exam", "btn-submit-exam", "btn-restart-exam", "btn-home-exam",
    "btn-home-results", "btn-prev-question", "btn-next-question", "question-index-counter",
    "question-module-badge", "exam-timer", "timer-box", "question-card", "question-text",
    "answer-inputs-area", "flag-checkbox", "flag-label-container", "btn-bookmark-question",
    "bookmark-icon-svg", "questions-grid-container", "upload-dropzone", "pdf-file-input",
    "pool-status-count", "pool-status-sims", "upload-log", "result-status-badge",
    "result-score-summary", "score-cellbio", "status-cellbio", "card-result-cellbio",
    "score-histology", "status-histology", "card-result-histology", "score-embryo",
    "status-embryo", "card-result-embryo", "score-interdisciplinary", "status-interdisciplinary",
    "card-result-interdisciplinary", "tab-btn-grading", "tab-btn-review", "tab-content-grading",
    "tab-content-review", "open-questions-grading-list", "auto-questions-review-list",
    "welcome-tab-settings", "welcome-tab-bookmarks", "welcome-tab-analytics", "welcome-tab-database",
    "welcome-panel-settings", "welcome-panel-bookmarks", "welcome-panel-analytics",
    "welcome-panel-database", "practice-mode-select", "sim-questions-modal"
  ];

  elementIds.forEach(id => {
    let tag = "div";
    if (id.startsWith("btn-") || id.startsWith("tab-btn-")) tag = "button";
    if (id.includes("select")) tag = "select";
    if (id.includes("checkbox") || id.includes("input")) tag = "input";
    if (id.includes("svg")) tag = "svg";
    const el = new MockElement(tag);
    el.id = id;
    elements[id] = el;
  });

  const mockLocalStorage = {
    _data: {},
    getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem: function(k, v) { this._data[k] = String(v); },
    removeItem: function(k) { delete this._data[k]; },
    clear: function() { this._data = {}; }
  };

  const documentListeners = {};
  const mockDocument = {
    body: new MockElement("body"),
    activeElement: null,
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => {
      if (sel.startsWith("#")) return elements[sel.slice(1)] || null;
      if (sel.includes("custom-modal-overlay.active")) {
        return elements["custom-modal-overlay"].classList.contains("active") ? elements["custom-modal-overlay"] : null;
      }
      if (sel.includes(".screen.active")) {
        for (let s of ["screen-welcome", "screen-exam", "screen-results"]) {
          if (elements[s] && elements[s].classList.contains("active")) return elements[s];
        }
        return null;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const matches = [];
      Object.keys(elements).forEach(k => {
        const el = elements[k];
        if (sel.startsWith(".") && el.classList.contains(sel.slice(1))) {
          matches.push(el);
        }
      });
      return matches;
    },
    createElement: (tag) => new MockElement(tag),
    createTextNode: (txt) => ({ textContent: txt, nodeType: 3 }),
    addEventListener: (type, fn) => {
      if (!documentListeners[type]) documentListeners[type] = [];
      documentListeners[type].push(fn);
      if (type === "DOMContentLoaded") {
        try { fn(); } catch (e) { mockConsole.error("DOMContentLoaded execution error: " + e); }
      }
    },
    removeEventListener: (type, fn) => {
      if (!documentListeners[type]) return;
      documentListeners[type] = documentListeners[type].filter(f => f !== fn);
    }
  };

  // Mock questions database with diverse types
  const sampleQuestions = [
    {
      id: 1,
      module: "Cell Biology",
      type: "multiple-choice",
      question: "Which organelle is responsible for ATP synthesis?",
      options: ["A. Mitochondria", "B. Ribosome", "C. Golgi Apparatus", "D. Nucleus"],
      correctAnswer: "A",
      explanation: "Mitochondria produce ATP through oxidative phosphorylation."
    },
    {
      id: 2,
      module: "Cell Biology",
      type: "true-false",
      question: "Phospholipids in the plasma membrane are amphipathic.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Phospholipids have hydrophilic heads and hydrophobic tails."
    },
    {
      id: 3,
      module: "Histology",
      type: "fill-in-the-gap",
      question: "The basic contractile unit of a muscle fiber is the ________.",
      options: ["A. Sarcomere", "B. Myofibril", "C. Sarcolemma", "D. Sarcoplasm"],
      correctAnswer: "A",
      explanation: "Sarcomeres are the functional units of striated muscle."
    },
    {
      id: 4,
      module: "Histology",
      type: "open",
      question: "Explain the functional differences between rough and smooth endoplasmic reticulum.",
      idealAnswer: "RER synthesizes proteins, SER synthesizes lipids and detoxifies chemicals."
    },
    {
      id: 5,
      module: "Embryology",
      type: "multiple-choice",
      question: "Which germ layer gives rise to the nervous system?",
      options: ["A. Ectoderm", "B. Mesoderm", "C. Endoderm", "D. Neural crest only", "E. Hypoblast"],
      correctAnswer: "A",
      explanation: "The neural tube and neural crest derive from ectoderm."
    }
  ];

  let timerId = 1;
  const mockSetInterval = (fn, ms) => timerId++;
  const mockClearInterval = (id) => {};
  const mockSetTimeout = (fn, ms) => timerId++;
  const mockClearTimeout = (id) => {};

  const mockWindow = {
    CBEH_QUESTIONS: sampleQuestions,
    scrollTo: () => {},
    setInterval: mockSetInterval,
    clearInterval: mockClearInterval,
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout
  };

  function createKeyboardEvent(key, code = "", opts = {}) {
    return {
      type: "keydown",
      key: key,
      code: code || ("Key" + key.toUpperCase()),
      ctrlKey: !!opts.ctrlKey,
      metaKey: !!opts.metaKey,
      altKey: !!opts.altKey,
      shiftKey: !!opts.shiftKey,
      defaultPrevented: false,
      preventDefault: function() { this.defaultPrevented = true; }
    };
  }

  function dispatchKeydown(key, code = "", opts = {}) {
    const evt = createKeyboardEvent(key, code, opts);
    if (documentListeners["keydown"]) {
      documentListeners["keydown"].forEach(fn => fn(evt));
    }
    return evt;
  }

  // Load app.js code in sandbox
  const runnerFn = new Function(
    "window", "document", "localStorage", "console", "setInterval", "clearInterval", "setTimeout", "clearTimeout",
    `
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
    `
  );

  const appScope = runnerFn(
    mockWindow, mockDocument, mockLocalStorage, mockConsole,
    mockSetInterval, mockClearInterval, mockSetTimeout, mockClearTimeout
  );

  const state = appScope.state;
  const startExamWithQuestions = appScope.startExamWithQuestions;
  const selectOptionByIndex = appScope.selectOptionByIndex;
  const handleNextQuestion = appScope.handleNextQuestion;
  const handlePrevQuestion = appScope.handlePrevQuestion;
  const saveCurrentSimulationProgress = appScope.saveCurrentSimulationProgress;
  const saveActiveExamState = appScope.saveActiveExamState;
  const saveAnswer = appScope.saveAnswer;
  const renderQuestion = appScope.renderQuestion;
  const updateResumeButtonUI = appScope.updateResumeButtonUI;
  const startTimer = appScope.startTimer;
  const resetExam = appScope.resetExam;
  const submitExam = appScope.submitExam;
  const updateTimerDisplay = appScope.updateTimerDisplay;
  const loadAppState = appScope.loadAppState;

  // ============================================================================
  // SUITE 1: ACTIVE EXAM SHORTCUTS & CASE INSENSITIVITY
  // ============================================================================
  mockConsole.log("\n[SUITE 1] Active Exam Keyboard Shortcuts: N, P, A-E, 1-5, M");

  // Initialize active exam with 5 questions
  startExamWithQuestions(sampleQuestions);
  assert(elements["screen-exam"].classList.contains("active"), "Exam screen is active on start");
  assertEqual(state.currentQuestionIndex, 0, "Initial question index is 0");

  // Test 1: Navigation Next (lowercase 'n')
  let evt = dispatchKeydown("n", "KeyN");
  assert(evt.defaultPrevented, "Key 'n' default was prevented");
  assertEqual(state.currentQuestionIndex, 1, "Pressing 'n' advanced to question index 1");

  // Test 2: Navigation Prev (uppercase 'P')
  evt = dispatchKeydown("P", "KeyP");
  assert(evt.defaultPrevented, "Key 'P' default was prevented");
  assertEqual(state.currentQuestionIndex, 0, "Pressing 'P' went back to question index 0");

  // Test 3: Navigation Right Arrow
  evt = dispatchKeydown("ArrowRight", "ArrowRight");
  assert(evt.defaultPrevented, "ArrowRight default was prevented");
  assertEqual(state.currentQuestionIndex, 1, "Pressing 'ArrowRight' advanced to question index 1");

  // Test 4: Navigation Left Arrow
  evt = dispatchKeydown("ArrowLeft", "ArrowLeft");
  assert(evt.defaultPrevented, "ArrowLeft default was prevented");
  assertEqual(state.currentQuestionIndex, 0, "Pressing 'ArrowLeft' returned to question index 0");

  // Test 5: Option selection with letters on MC question (id: 1)
  // Options: A, B, C, D
  evt = dispatchKeydown("c", "KeyC");
  assert(evt.defaultPrevented, "Key 'c' default prevented");
  assertEqual(state.answers[1], "C", "Pressing 'c' selected option C for question 1");

  evt = dispatchKeydown("A", "KeyA");
  assert(evt.defaultPrevented, "Key 'A' default prevented");
  assertEqual(state.answers[1], "A", "Pressing 'A' selected option A for question 1");

  // Test 6: Option selection with digits on MC question
  evt = dispatchKeydown("2", "Digit2");
  assert(evt.defaultPrevented, "Digit '2' default prevented");
  assertEqual(state.answers[1], "B", "Pressing digit '2' selected option B for question 1");

  evt = dispatchKeydown("4", "Numpad4");
  assert(evt.defaultPrevented, "Numpad '4' default prevented");
  assertEqual(state.answers[1], "D", "Pressing numpad '4' selected option D for question 1");

  // Test 7: Toggle bookmark with 'm' and 'M'
  assertEqual(state.bookmarks.length, 0, "Initially 0 bookmarks");
  evt = dispatchKeydown("m", "KeyM");
  assert(evt.defaultPrevented, "Key 'm' default prevented");
  assertEqual(state.bookmarks.length, 1, "Pressing 'm' bookmarked question 1");
  assertEqual(elements["bookmark-icon-svg"].getAttribute("fill"), "var(--color-primary)", "Bookmark SVG filled");

  evt = dispatchKeydown("M", "KeyM");
  assert(evt.defaultPrevented, "Key 'M' default prevented");
  assertEqual(state.bookmarks.length, 0, "Pressing 'M' unbookmarked question 1");
  assertEqual(elements["bookmark-icon-svg"].getAttribute("fill"), "none", "Bookmark SVG cleared");

  // ============================================================================
  // SUITE 2: TRUE/FALSE & 5-OPTION SHORTCUT SPECIALIZATIONS
  // ============================================================================
  mockConsole.log("\n[SUITE 2] True/False & 5-Option Question Shortcuts");

  // Move to question 2 (True/False)
  dispatchKeydown("n", "KeyN");
  assertEqual(state.currentQuestionIndex, 1, "On question index 1 (True/False)");

  // Test T/F shortcuts
  evt = dispatchKeydown("t", "KeyT");
  assert(evt.defaultPrevented, "Key 't' default prevented");
  assertEqual(state.answers[2], "True", "Pressing 't' selected 'True'");

  evt = dispatchKeydown("f", "KeyF");
  assert(evt.defaultPrevented, "Key 'f' default prevented");
  assertEqual(state.answers[2], "False", "Pressing 'f' selected 'False'");

  evt = dispatchKeydown("v", "KeyV");
  assert(evt.defaultPrevented, "Key 'v' (Vero) default prevented");
  assertEqual(state.answers[2], "True", "Pressing 'v' (Vero) selected 'True'");

  // Move to question 3 (Fill in the gap)
  dispatchKeydown("n", "KeyN");
  assertEqual(state.currentQuestionIndex, 2, "On question index 2 (Fill in the gap)");

  evt = dispatchKeydown("1", "Digit1");
  assert(evt.defaultPrevented, "Digit 1 default prevented");
  assertEqual(state.answers[3], "A. Sarcomere", "Pressing '1' selected gap option A");

  evt = dispatchKeydown("c", "KeyC");
  assert(evt.defaultPrevented, "Key 'c' default prevented");
  assertEqual(state.answers[3], "C. Sarcolemma", "Pressing 'c' selected gap option C");

  // Move to question 5 (5-option MC question)
  dispatchKeydown("n", "KeyN"); // to index 3 (open)
  dispatchKeydown("n", "KeyN"); // to index 4 (5 options)
  assertEqual(state.currentQuestionIndex, 4, "On question index 4 (5 options)");

  evt = dispatchKeydown("e", "KeyE");
  assert(evt.defaultPrevented, "Key 'e' default prevented");
  assertEqual(state.answers[5], "E", "Pressing 'e' selected option E on 5-option question");

  evt = dispatchKeydown("5", "Digit5");
  assert(evt.defaultPrevented, "Key '5' default prevented");
  assertEqual(state.answers[5], "E", "Pressing '5' selected option E");

  // ============================================================================
  // SUITE 3: FOCUS GUARDS & MODIFIER IMMUNITY
  // ============================================================================
  mockConsole.log("\n[SUITE 3] Focus Guards & Modifier Immunity");

  // Move back to question 4 (Open question)
  dispatchKeydown("p", "KeyP");
  assertEqual(state.currentQuestionIndex, 3, "On question index 3 (Open question)");

  const textarea = elements["answer-inputs-area"].querySelector("textarea");
  assert(textarea !== null, "Open question rendered a textarea");

  // Simulate user focusing textarea and typing
  mockDocument.activeElement = textarea;
  textarea.value = "Mitochondria produce ATP while endoplasmic reticulum synthesizes proteins";

  evt = dispatchKeydown("n", "KeyN");
  assert(!evt.defaultPrevented, "Key 'n' was NOT intercepted while typing in textarea");
  assertEqual(state.currentQuestionIndex, 3, "Index did NOT change while textarea focused");

  evt = dispatchKeydown("p", "KeyP");
  assert(!evt.defaultPrevented, "Key 'p' was NOT intercepted while typing in textarea");
  assertEqual(state.currentQuestionIndex, 3, "Index did NOT change while textarea focused");

  evt = dispatchKeydown("m", "KeyM");
  assert(!evt.defaultPrevented, "Key 'm' was NOT intercepted while typing in textarea");
  assertEqual(state.bookmarks.length, 0, "Bookmarks unchanged while textarea focused");

  evt = dispatchKeydown("a", "KeyA");
  assert(!evt.defaultPrevented, "Key 'a' was NOT intercepted while typing in textarea");

  // Blur textarea (reset activeElement)
  mockDocument.activeElement = null;

  // Verify modifier immunity (Cmd+R, Ctrl+C, Alt+Tab, etc.)
  evt = dispatchKeydown("r", "KeyR", { metaKey: true });
  assert(!evt.defaultPrevented, "Cmd+R was NOT prevented (browser reload allowed)");

  evt = dispatchKeydown("c", "KeyC", { ctrlKey: true });
  assert(!evt.defaultPrevented, "Ctrl+C was NOT prevented (copy allowed)");

  evt = dispatchKeydown("p", "KeyP", { metaKey: true });
  assert(!evt.defaultPrevented, "Cmd+P was NOT prevented (browser print allowed)");
  assertEqual(state.currentQuestionIndex, 3, "Index did NOT change on Cmd+P");

  // Verify modal overlay guard
  elements["custom-modal-overlay"].classList.add("active");
  evt = dispatchKeydown("n", "KeyN");
  assert(!evt.defaultPrevented, "Key 'n' was NOT intercepted while modal dialog is active");
  assertEqual(state.currentQuestionIndex, 3, "Index did NOT change while modal dialog is active");
  elements["custom-modal-overlay"].classList.remove("active");

  // ============================================================================
  // SUITE 4: EXACT TIMER DURATION FREEZE ON EXIT/SAVE & RESUME (R2)
  // ============================================================================
  mockConsole.log("\n[SUITE 4] Exact Timer Duration Freeze on Exit/Save & Resume (R2)");

  // Set initial time left to 45 minutes and 30 seconds (2730 seconds)
  state.timeLeft = 2730;
  updateTimerDisplay();
  assertEqual(elements["exam-timer"].textContent, "45:30", "Timer display formatted as 45:30");
  assert(!elements["timer-box"].classList.contains("warning"), "Timer box does not have warning at 45:30");

  // Save progress via pause/save
  saveCurrentSimulationProgress();

  // Verify saved JSON payload contains exact timeLeft
  const savedJson = mockLocalStorage.getItem("cbeh_saved_simulation");
  assert(savedJson !== null, "cbeh_saved_simulation written to localStorage");
  const parsedSaved = JSON.parse(savedJson);
  assertEqual(parsedSaved.timeLeft, 2730, "Stored timeLeft is exactly 2730 seconds");
  assertEqual(parsedSaved.currentQuestionIndex, 3, "Stored currentQuestionIndex is 3");

  // Verify resume button is now visible
  updateResumeButtonUI();
  assertEqual(elements["btn-resume-exam"].style.display, "inline-flex", "Resume button is visible");

  // Simulate leaving the app / resetting in-memory state or reloading
  state.questions = [];
  state.timeLeft = 5400;
  elements["screen-exam"].classList.remove("active");
  elements["screen-welcome"].classList.add("active");

  // Click "Resume Exam"
  elements["btn-resume-exam"].click();

  // Verify state restored cleanly with exact frozen time
  assert(elements["screen-exam"].classList.contains("active"), "Screen transitioned back to active exam");
  assertEqual(state.questions.length, 5, "Restored 5 questions");
  assertEqual(state.currentQuestionIndex, 3, "Restored to question index 3");
  assertEqual(state.timeLeft, 2730, "Restored state.timeLeft is exactly 2730 seconds (no time loss)");
  assertEqual(elements["exam-timer"].textContent, "45:30", "Exam timer displayed exactly 45:30 on resume");

  // Test warning state toggle on low time (< 300s)
  state.timeLeft = 180; // 3 minutes
  updateTimerDisplay();
  assertEqual(elements["exam-timer"].textContent, "03:00", "Timer display shows 03:00");
  assert(elements["timer-box"].classList.contains("warning"), "Warning class added when timeLeft < 300s");

  // Save at low time
  saveCurrentSimulationProgress();
  const lowTimeSaved = JSON.parse(mockLocalStorage.getItem("cbeh_saved_simulation"));
  assertEqual(lowTimeSaved.timeLeft, 180, "Saved low timeLeft (180s)");

  // Reset exam (start fresh)
  resetExam();
  assertEqual(state.timeLeft, 5400, "Reset exam set timeLeft back to 90 min (5400s)");
  updateTimerDisplay();
  assertEqual(elements["exam-timer"].textContent, "90:00", "Timer display shows 90:00");
  assert(!elements["timer-box"].classList.contains("warning"), "Warning class cleanly removed on reset");
  assertEqual(mockLocalStorage.getItem("cbeh_saved_simulation"), null, "cbeh_saved_simulation removed on reset");

  // ============================================================================
  // SUITE 5: BOUNDARY IMMUNITY & CORRUPTION TOLERANCE
  // ============================================================================
  mockConsole.log("\n[SUITE 5] Boundary Immunity & Storage Corruption Tolerance");

  startExamWithQuestions(sampleQuestions);

  // Boundary: Question 0 - Prev Question does not crash or underflow
  state.currentQuestionIndex = 0;
  renderQuestion();
  assert(elements["btn-prev-question"].disabled, "Prev question button disabled at index 0");
  handlePrevQuestion();
  assertEqual(state.currentQuestionIndex, 0, "Current index stayed at 0 on handlePrevQuestion");
  dispatchKeydown("p", "KeyP");
  assertEqual(state.currentQuestionIndex, 0, "Current index stayed at 0 on 'p' keydown");

  // Boundary: Last Question - Next Question does not crash or overflow
  state.currentQuestionIndex = 4;
  renderQuestion();
  assert(elements["btn-next-question"].disabled, "Next question button disabled at last index");
  handleNextQuestion();
  assertEqual(state.currentQuestionIndex, 4, "Current index stayed at 4 on handleNextQuestion");
  dispatchKeydown("n", "KeyN");
  assertEqual(state.currentQuestionIndex, 4, "Current index stayed at 4 on 'n' keydown");

  // Option out-of-bounds immunity
  selectOptionByIndex(99); // nonexistent option
  assertEqual(state.answers[5], undefined, "Selecting out of bounds index did not throw or set invalid answer");

  // Storage corruption immunity
  mockLocalStorage.setItem("cbeh_questions_pool_v1", JSON.stringify({ questionsPool: [{ id: 1, question: "Test" }], uploadedSimulationsCount: 1 }));
  mockLocalStorage.setItem("cbeh_active_exam_state_v1", "{ malformed json ::: }}}");
  mockLocalStorage.setItem("cbeh_saved_simulation", "{ also corrupt json ### }");

  let loadResult = false;
  try {
    loadResult = loadAppState();
  } catch (e) {
    loadResult = false;
  }
  assert(loadResult, "loadAppState gracefully recovered from corrupt active exam JSON without crashing");
  assertEqual(state.questionsPool.length, 1, "User's master question pool was protected and NOT deleted");
  assertEqual(mockLocalStorage.getItem("cbeh_active_exam_state_v1"), null, "Corrupt exam state key was safely pruned");
  assertEqual(mockLocalStorage.getItem("cbeh_saved_simulation"), null, "Corrupt saved sim key was safely pruned");

  // Submit exam workflow
  submitExam();
  assert(state.isExamSubmitted, "state.isExamSubmitted set to true");
  assert(elements["screen-results"].classList.contains("active"), "Results screen is active");
  assertEqual(mockLocalStorage.getItem("cbeh_saved_simulation"), null, "cbeh_saved_simulation cleared on submit");
  updateResumeButtonUI();
  assertEqual(elements["btn-resume-exam"].style.display, "none", "Resume button is hidden after submission");

  // Keyboard shortcuts disabled when exam submitted
  evt = dispatchKeydown("n", "KeyN");
  assert(!evt.defaultPrevented, "Shortcuts inactive after exam is submitted");

  mockConsole.log("================================================================================");
  mockConsole.log(`REVIEWER 3 VERIFICATION SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  if (failed > 0) {
    throw new Error(`Failed ${failed} tests`);
  }
  return true;
}

runAdversarialReviewer3Tests();
