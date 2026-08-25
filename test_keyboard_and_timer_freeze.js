// Comprehensive Verification Test Suite for CBEH Exam Simulator:
// 1. Interactive Keyboard Shortcuts & Focus Guards during Active Exams (R1)
// 2. Exact Timer Duration Freeze on Exit/Save & Resume (R2)
// Executed via JavaScriptCore (osascript -l JavaScript)

function runKeyboardAndTimerTests() {
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
  mockConsole.log("   VERIFICATION: KEYBOARD SHORTCUTS (R1) & TIMER FREEZE ON RESUME (R2)");
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

    dispatchEvent(evt) {
      const listeners = this.eventListeners[evt.type] || [];
      for (const l of listeners) {
        l.call(this, evt);
      }
      if (evt.bubbles && this.parentNode && typeof this.parentNode.dispatchEvent === "function") {
        this.parentNode.dispatchEvent(evt);
      }
      return true;
    }

    click() {
      const evt = { type: "click", target: this, preventDefault: () => {} };
      this.dispatchEvent(evt);
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      const results = [];
      function match(el) {
        if (!el || !el.tagName) return;
        
        let matched = false;
        if (selector.startsWith("#")) {
          matched = el.id === selector.substring(1);
        } else if (selector.startsWith(".")) {
          matched = el.classList.contains(selector.substring(1));
        } else if (selector === "input[type='radio']") {
          matched = el.tagName === "INPUT" && el.type === "radio";
        } else if (selector === "input[type='radio']:checked") {
          matched = el.tagName === "INPUT" && el.type === "radio" && el.checked;
        } else if (selector === "textarea") {
          matched = el.tagName === "TEXTAREA";
        } else if (selector === "select") {
          matched = el.tagName === "SELECT";
        } else if (selector === ".option-item") {
          matched = el.classList.contains("option-item");
        } else if (selector === ".grid-box") {
          matched = el.classList.contains("grid-box");
        } else if (selector === ".screen.active") {
          matched = el.classList.contains("screen") && el.classList.contains("active");
        } else if (selector === ".custom-modal-overlay.active") {
          matched = el.classList.contains("custom-modal-overlay") && el.classList.contains("active");
        } else if (selector === "input") {
          matched = el.tagName === "INPUT";
        } else if (el.tagName.toLowerCase() === selector.toLowerCase()) {
          matched = true;
        }

        if (matched) results.push(el);

        if (el.children) {
          for (const child of el.children) {
            match(child);
          }
        }
      }

      for (const child of this.children) {
        match(child);
      }
      return results;
    }

    scrollIntoView() {}
  }

  // Setup Mock DOM
  const elementsById = {};
  function registerElement(id, tagName = "div") {
    const el = new MockElement(tagName);
    el.id = id;
    elementsById[id] = el;
    return el;
  }

  // Register all elements referenced in app.js
  const screenWelcome = registerElement("screen-welcome", "div");
  screenWelcome.classList.add("screen", "active");
  const screenExam = registerElement("screen-exam", "div");
  screenExam.classList.add("screen");
  const screenResults = registerElement("screen-results", "div");
  screenResults.classList.add("screen");

  registerElement("palette-select", "select");
  registerElement("btn-resume-exam", "button");
  registerElement("custom-modal-overlay", "div");
  registerElement("custom-modal-message", "p");
  registerElement("custom-modal-btn-cancel", "button");
  registerElement("custom-modal-btn-confirm", "button");
  registerElement("sim-questions-modal", "div");
  registerElement("btn-start-exam", "button");
  registerElement("btn-submit-exam", "button");
  registerElement("btn-restart-exam", "button");
  registerElement("btn-home-exam", "button");
  registerElement("btn-home-results", "button");
  registerElement("btn-prev-question", "button");
  registerElement("btn-next-question", "button");
  registerElement("question-index-counter", "span");
  registerElement("question-module-badge", "span");
  registerElement("exam-timer", "span");
  registerElement("timer-box", "div");
  registerElement("question-card", "div");
  registerElement("question-text", "p");
  registerElement("answer-inputs-area", "div");
  const flagCheckbox = registerElement("flag-checkbox", "input");
  flagCheckbox.type = "checkbox";
  registerElement("flag-label-container", "label");
  registerElement("btn-bookmark-question", "button");
  const bookmarkIconSvg = registerElement("bookmark-icon-svg", "svg");
  registerElement("questions-grid-container", "div");

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

  // Sample questions list for testing
  const sampleQuestions = [
    { id: 1, module: "Cell Biology", type: "multiple-choice", question: "Which organelle synthesizes ATP?", options: ["A. Ribosome", "B. Mitochondrion", "C. Golgi", "D. Nucleus"], correct: "B" },
    { id: 2, module: "Cell Biology", type: "true-false", question: "Gap junctions permit direct cytoplasmic exchange.", options: ["True", "False"], correct: "True" },
    { id: 3, module: "Histology", type: "fill-in-the-gap", question: "The principal collagen type in basal lamina is type ________ collagen.", options: ["A. IV", "B. I", "C. II", "D. III"], correct: "A. IV" },
    { id: 4, module: "Embryology", type: "open", question: "Describe the three germ layers formed during gastrulation.", solution: "Ectoderm, mesoderm, endoderm." },
    { id: 5, module: "Interdisciplinary", type: "multiple-choice", question: "Which 5-choice option is correct?", options: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4", "E. Option 5"], correct: "E" }
  ];

  // ---------------------------------------------------------------------------
  // SUITE 1: KEYBOARD NAVIGATION (N / P / Right Arrow / Left Arrow)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Active Exam Keyboard Navigation (N / P / Arrows)");

  startExamWithQuestions(sampleQuestions);
  assertEqual(state.currentQuestionIndex, 0, "Initial question index is 0");
  assert(screenExam.classList.contains("active"), "screen-exam is active");

  // Press N to advance
  fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 1, "Pressing 'N' advances to Question 2 (index 1)");

  // Press ArrowRight to advance
  fireKeyDown({ key: "arrowright", code: "ArrowRight" });
  assertEqual(state.currentQuestionIndex, 2, "Pressing 'ArrowRight' advances to Question 3 (index 2)");

  // Press P to go back
  fireKeyDown({ key: "p", code: "KeyP" });
  assertEqual(state.currentQuestionIndex, 1, "Pressing 'P' returns to Question 2 (index 1)");

  // Press ArrowLeft to go back
  fireKeyDown({ key: "arrowleft", code: "ArrowLeft" });
  assertEqual(state.currentQuestionIndex, 0, "Pressing 'ArrowLeft' returns to Question 1 (index 0)");

  // Boundary check: Press P at index 0 (should stay at 0)
  fireKeyDown({ key: "p", code: "KeyP" });
  assertEqual(state.currentQuestionIndex, 0, "Pressing 'P' at first question does not underflow");

  // Advance to last question (index 4)
  state.currentQuestionIndex = 4;
  appScope.renderQuestion();
  fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 4, "Pressing 'N' at last question does not overflow");

  // ---------------------------------------------------------------------------
  // SUITE 2: OPTION SELECTION VIA KEYBOARD (A, B, C, D, E / 1, 2, 3, 4, 5 / T, F)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Option Selection via Keyboard & State Answers Update");

  // Go back to Question 1 (Multiple Choice: A, B, C, D)
  state.currentQuestionIndex = 0;
  appScope.renderQuestion();
  mockDoc.activeElement = null;

  // Press 'B' to select option B (Mitochondrion)
  fireKeyDown({ key: "b", code: "KeyB" });
  assertEqual(state.answers[1], "B", "Pressing 'B' saves answer 'B' in state.answers[1]");
  
  const radioB = elementsById["answer-inputs-area"].querySelectorAll("input[type='radio']")[1];
  assert(radioB && radioB.checked, "Radio input for Option B is checked");

  // Press 'A' to switch to Option A
  fireKeyDown({ key: "a", code: "KeyA" });
  assertEqual(state.answers[1], "A", "Pressing 'A' updates answer to 'A' in state.answers[1]");

  // Press '2' (numeric key) to select Option B
  fireKeyDown({ key: "2", code: "Digit2" });
  assertEqual(state.answers[1], "B", "Pressing '2' selects Option B");

  // Go to Question 2 (True / False)
  state.currentQuestionIndex = 1;
  appScope.renderQuestion();

  // Press 'T' for True
  fireKeyDown({ key: "t", code: "KeyT" });
  assertEqual(state.answers[2], "True", "Pressing 'T' selects 'True' on True/False question");

  // Press 'F' for False
  fireKeyDown({ key: "f", code: "KeyF" });
  assertEqual(state.answers[2], "False", "Pressing 'F' selects 'False' on True/False question");

  // Press '1' for True
  fireKeyDown({ key: "1", code: "Digit1" });
  assertEqual(state.answers[2], "True", "Pressing '1' selects 'True' on True/False question");

  // Go to Question 3 (Fill in the gap)
  state.currentQuestionIndex = 2;
  appScope.renderQuestion();

  // Press 'A' for Option A (IV)
  fireKeyDown({ key: "a", code: "KeyA" });
  assertEqual(state.answers[3], "A. IV", "Pressing 'A' selects Option A on fill-in-the-gap question");

  // Go to Question 5 (5 options: A-E)
  state.currentQuestionIndex = 4;
  appScope.renderQuestion();

  // Press 'E' / '5' for Option E
  fireKeyDown({ key: "e", code: "KeyE" });
  assertEqual(state.answers[5], "E", "Pressing 'E' selects Option E on 5-choice question");

  fireKeyDown({ key: "5", code: "Digit5" });
  assertEqual(state.answers[5], "E", "Pressing '5' selects Option E");

  // ---------------------------------------------------------------------------
  // SUITE 3: BOOKMARK TOGGLE SHORTCUT (M)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] Bookmark Toggle Shortcut (M)");

  state.currentQuestionIndex = 0;
  appScope.renderQuestion();
  state.bookmarks = [];
  mockLocalStorage["cbeh_bookmarks"] = "[]";

  // Press M to bookmark question 1
  fireKeyDown({ key: "m", code: "KeyM" });
  assertEqual(state.bookmarks.length, 1, "Pressing 'M' adds question to bookmarks");
  assertEqual(state.bookmarks[0].question, sampleQuestions[0].question, "Bookmarked question matches current question");

  // Press M again to remove bookmark
  fireKeyDown({ key: "m", code: "KeyM" });
  assertEqual(state.bookmarks.length, 0, "Pressing 'M' again un-bookmarks the question");

  // ---------------------------------------------------------------------------
  // SUITE 4: FOCUS GUARDS & TEXTAREA TYPING IMMUNITY
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Focus Guards & Text Typing Safety");

  // Go to Question 4 (Open question with textarea)
  state.currentQuestionIndex = 3;
  appScope.renderQuestion();
  const textarea = elementsById["answer-inputs-area"].querySelector("textarea");
  assert(textarea !== null, "Open question renders a textarea");

  // 1. Textarea focused: pressing shortcut keys should NOT trigger navigation or option changes
  mockDoc.activeElement = textarea;
  const prevIdx = state.currentQuestionIndex;
  const navEvent = fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, prevIdx, "Pressing 'n' while typing in textarea does NOT navigate to next question");
  assertEqual(navEvent.defaultPrevented, false, "Shortcut event was not consumed/intercepted in textarea");

  const optionEvent = fireKeyDown({ key: "a", code: "KeyA" });
  assertEqual(optionEvent.defaultPrevented, false, "Pressing 'a' while typing in textarea does NOT trigger option selection");

  // 2. Radio input focused: pressing shortcuts SHOULD work (not blocked)
  state.currentQuestionIndex = 0;
  appScope.renderQuestion();
  const radioA = elementsById["answer-inputs-area"].querySelectorAll("input[type='radio']")[0];
  mockDoc.activeElement = radioA; // Simulate user having clicked a radio option

  // Press N to advance from Question 1 to Question 2
  fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 1, "Shortcuts work smoothly even when a radio button is currently activeElement");

  // 3. Modifier combinations guard (Cmd+R, Ctrl+C, etc.)
  mockDoc.activeElement = null;
  state.currentQuestionIndex = 1;
  fireKeyDown({ key: "r", code: "KeyR", metaKey: true });
  assertEqual(state.currentQuestionIndex, 1, "Cmd+R does not trigger exam actions");

  fireKeyDown({ key: "n", code: "KeyN", ctrlKey: true });
  assertEqual(state.currentQuestionIndex, 1, "Ctrl+N does not trigger exam navigation");

  // 4. Modal overlay guard: shortcuts disabled when modal is open
  const modalOverlay = elementsById["custom-modal-overlay"];
  modalOverlay.classList.add("active");
  fireKeyDown({ key: "n", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 1, "Shortcuts are safely ignored when a modal dialog is open");
  modalOverlay.classList.remove("active");

  // ---------------------------------------------------------------------------
  // SUITE 5: EXACT TIMER FREEZE ON EXIT/SAVE & CLEAN RESUME (R2)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 5] Exact Timer Duration Freeze on Exit/Save & Clean Resume (R2)");

  // Start exam with sample questions
  startExamWithQuestions(sampleQuestions);
  
  // Set custom timeLeft representing 45 minutes and 30 seconds (2730 seconds)
  const exactDurationSeconds = 45 * 60 + 30; // 2730 seconds
  state.timeLeft = exactDurationSeconds;
  updateTimerDisplay();
  
  const examTimer = elementsById["exam-timer"];
  assertEqual(examTimer.textContent, "45:30", "Timer display shows formatted 45:30");

  // User saves progress and exits to welcome screen
  saveCurrentSimulationProgress();
  
  assert(state.timerInterval === null, "state.timerInterval was cleared on save");
  
  // Verify localStorage records exact frozen duration
  const savedSimRaw = mockLocalStorage["cbeh_saved_simulation"];
  assert(savedSimRaw !== undefined, "cbeh_saved_simulation exists in localStorage");
  const savedSim = JSON.parse(savedSimRaw);
  assertEqual(savedSim.timeLeft, 2730, "Exact timeLeft (2730s = 45m30s) stored in cbeh_saved_simulation");

  const savedActiveRaw = mockLocalStorage["cbeh_active_exam_state_v1"];
  assert(savedActiveRaw !== undefined, "cbeh_active_exam_state_v1 exists in localStorage");
  const savedActive = JSON.parse(savedActiveRaw);
  assertEqual(savedActive.timeLeft, 2730, "Exact timeLeft stored in cbeh_active_exam_state_v1");

  // Verify Resume button is shown
  const btnResumeExam = elementsById["btn-resume-exam"];
  assertEqual(btnResumeExam.style.display, "inline-flex", "Resume button is displayed on welcome screen");

  // Simulate complete app reset (e.g. user leaves, closes tab, comes back 3 hours later)
  state.questions = [];
  state.timeLeft = 0;
  state.answers = {};
  examTimer.textContent = "--:--";

  // User clicks "Resume Exam"
  btnResumeExam.click();

  // Verify state restored
  assertEqual(state.questions.length, 5, "Questions array restored");
  assertEqual(state.timeLeft, 2730, "state.timeLeft restored to EXACT frozen 2730 seconds (no wall-clock elapsed time deducted)");
  assertEqual(examTimer.textContent, "45:30", "Timer display resumes cleanly at 45:30");
  assert(screenExam.classList.contains("active"), "Switched back to screen-exam");
  assert(state.timerInterval !== null, "Timer interval restarted for active simulation");

  // Clear timer interval to clean up
  resetExam();
  assert(mockLocalStorage["cbeh_saved_simulation"] === undefined, "cbeh_saved_simulation removed on exam reset");
  assert(mockLocalStorage["cbeh_active_exam_state_v1"] === undefined, "cbeh_active_exam_state_v1 removed on exam reset");
  assertEqual(btnResumeExam.style.display, "none", "Resume button hidden after exam reset");

  // ---------------------------------------------------------------------------
  // SUITE 6: ADVERSARIAL EDGE CASES & SUBMITTED STATE PERSISTENCE
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 6] Adversarial Edge Cases & State Robustness");

  // 1. Submitted Exam State Persistence
  startExamWithQuestions(sampleQuestions);
  state.answers[1] = "A";
  appScope.submitExam();

  assertEqual(state.isExamSubmitted, true, "state.isExamSubmitted is true after submitExam()");
  assert(mockLocalStorage["cbeh_saved_simulation"] === undefined, "cbeh_saved_simulation cleared on submit");
  
  const submittedActiveExam = JSON.parse(mockLocalStorage["cbeh_active_exam_state_v1"]);
  assertEqual(submittedActiveExam.isExamSubmitted, true, "cbeh_active_exam_state_v1 persisted with isExamSubmitted: true");

  // Simulate reloading app state
  state.isExamSubmitted = false;
  appScope.loadAppState();
  assertEqual(state.isExamSubmitted, true, "loadAppState() restores isExamSubmitted: true");
  
  appScope.updateResumeButtonUI();
  assertEqual(btnResumeExam.style.display, "none", "Resume button is hidden when saved active exam is submitted");

  // 2. Uppercase shortcut keys & rapid navigation
  resetExam();
  startExamWithQuestions(sampleQuestions);
  mockDoc.activeElement = null;

  // Press uppercase 'N' (e.g. CapsLock or Shift+N)
  fireKeyDown({ key: "N", code: "KeyN" });
  assertEqual(state.currentQuestionIndex, 1, "Uppercase 'N' advances to next question");

  fireKeyDown({ key: "P", code: "KeyP" });
  assertEqual(state.currentQuestionIndex, 0, "Uppercase 'P' returns to previous question");

  // Uppercase 'B' selects option B
  fireKeyDown({ key: "B", code: "KeyB" });
  assertEqual(state.answers[1], "B", "Uppercase 'B' selects option B");

  // Uppercase 'M' bookmarks question
  state.bookmarks = [];
  fireKeyDown({ key: "M", code: "KeyM" });
  assertEqual(state.bookmarks.length, 1, "Uppercase 'M' toggles bookmark");

  // 3. Defensive null checks when state.questions is empty
  state.questions = [];
  state.currentQuestionIndex = 0;
  
  let noCrash = true;
  try {
    appScope.saveAnswer();
    appScope.selectOptionByIndex(0);
    elementsById["flag-checkbox"].dispatchEvent(new Event("change"));
    if (elementsById["btn-bookmark-question"]) {
      elementsById["btn-bookmark-question"].click();
    }
    fireKeyDown({ key: "n", code: "KeyN" });
    fireKeyDown({ key: "a", code: "KeyA" });
    fireKeyDown({ key: "m", code: "KeyM" });
  } catch (err) {
    noCrash = false;
    mockConsole.error("Crash on empty questions: " + err.message);
  }
  assert(noCrash, "App functions handle empty questions and bounds without throwing errors");

  // Clean up
  resetExam();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  mockConsole.log("================================================================================");
  mockConsole.log(`TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  if (failed > 0) {
    mockConsole.error("SOME TESTS FAILED:");
    failureReports.forEach(r => mockConsole.error(`- ${r.message}: ${r.details}`));
    return false;
  }
  mockConsole.log("SUCCESS: ALL KEYBOARD SHORTCUT & TIMER FREEZE TESTS PASSED!");
  return true;
}

runKeyboardAndTimerTests();
