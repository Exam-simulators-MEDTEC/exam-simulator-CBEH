// ============================================================================
// VICTORY AUDITOR SENTINEL 1: INDEPENDENT EMPIRICAL AUDIT SUITE
// Verifying R1 (Keyboard Shortcuts & Navigation) and R2 (Timer Freeze & Resume)
// ============================================================================

function runIndependentVictoryAuditSuite() {
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  let passed = 0;
  let failed = 0;
  const failures = [];

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
      failures.push(message + (details ? " | " + details : ""));
      mockConsole.error("FAIL: " + message + (details ? " | " + details : ""));
    }
  }

  mockConsole.log("================================================================================");
  mockConsole.log("   VICTORY AUDITOR SENTINEL 1 — INDEPENDENT VERIFICATION RUNNER");
  mockConsole.log("================================================================================");

  // Mock DOM implementation
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
      this.children = [];
      this.parentElement = null;
      this.style = {};
      this.dataset = {};
      this._textContent = "";
      this.eventListeners = {};
      const self = this;
      this.classList = {
        _classes: new Set(),
        add: function(...cls) { cls.forEach(c => self.classList._classes.add(c)); },
        remove: function(...cls) { cls.forEach(c => self.classList._classes.delete(c)); },
        contains: function(c) { return self.classList._classes.has(c); },
        toggle: function(c) {
          if (self.classList.contains(c)) self.classList.remove(c);
          else self.classList.add(c);
        }
      };
    }

    get className() { return Array.from(this.classList._classes).join(" "); }
    set className(val) {
      this.classList._classes.clear();
      if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList._classes.add(c));
    }

    get textContent() { return this._textContent; }
    set textContent(val) {
      this._textContent = String(val);
      this.children = [];
    }

    get innerHTML() { return this._textContent; }
    set innerHTML(val) {
      this._textContent = String(val);
      this.children = [];
    }

    appendChild(child) {
      if (!child) return;
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }

    addEventListener(type, cb) {
      if (!this.eventListeners[type]) this.eventListeners[type] = [];
      this.eventListeners[type].push(cb);
    }

    removeEventListener(type, cb) {
      if (!this.eventListeners[type]) return;
      this.eventListeners[type] = this.eventListeners[type].filter(l => l !== cb);
    }

    dispatchEvent(evt) {
      const type = evt.type;
      const list = this.eventListeners[type] || [];
      for (const listener of list) {
        listener(evt);
      }
      if (evt.bubbles && this.parentElement) {
        this.parentElement.dispatchEvent(evt);
      }
    }

    click() {
      const evt = { type: "click", target: this, bubbles: true, defaultPrevented: false, preventDefault: function() { this.defaultPrevented = true; } };
      this.dispatchEvent(evt);
    }

    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k]; }

    querySelector(sel) {
      const res = this.querySelectorAll(sel);
      return res.length > 0 ? res[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      function match(el) {
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
  }

  const elementsById = {};
  function registerElement(id, tagName = "div") {
    const el = new MockElement(tagName);
    el.id = id;
    elementsById[id] = el;
    return el;
  }

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
  registerElement("btn-submit-exam", "button");
  registerElement("btn-restart-exam", "button");
  registerElement("btn-home-exam", "button");
  registerElement("btn-home-results", "button");
  registerElement("btn-prev-question", "button");
  registerElement("btn-next-question", "button");
  registerElement("question-index-counter", "span");
  registerElement("question-module-badge", "span");
  const examTimer = registerElement("exam-timer", "span");
  const timerBox = registerElement("timer-box", "div");
  registerElement("question-card", "div");
  registerElement("question-text", "p");
  const answerInputsArea = registerElement("answer-inputs-area", "div");
  const flagCheckbox = registerElement("flag-checkbox", "input");
  flagCheckbox.type = "checkbox";
  registerElement("flag-label-container", "label");
  const btnBookmarkQuestion = registerElement("btn-bookmark-question", "button");
  const bookmarkIconSvg = registerElement("bookmark-icon-svg", "svg");
  btnBookmarkQuestion.appendChild(bookmarkIconSvg);
  registerElement("questions-grid-container", "div");
  registerElement("upload-dropzone", "div");
  registerElement("file-input", "input");
  registerElement("uploaded-files-list", "div");
  registerElement("btn-process-files", "button");
  registerElement("upload-status", "div");
  registerElement("pool-status-count", "span");
  registerElement("pool-status-sims", "span");
  registerElement("btn-open-sim-manager", "button");
  registerElement("simulations-list-container", "div");
  registerElement("btn-clear-pool", "button");
  registerElement("score-overall-circle", "div");
  registerElement("overall-percentage", "span");
  registerElement("result-status-badge", "div");
  registerElement("fail-reasons-list", "ul");
  registerElement("score-cellbio", "span");
  registerElement("score-histology", "span");
  registerElement("score-embryo", "span");
  registerElement("score-interdisciplinary", "span");
  registerElement("card-result-cellbio", "div");
  registerElement("card-result-histology", "div");
  registerElement("card-result-embryo", "div");
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
    getElementById: (id) => {
      if (!elementsById[id]) {
        elementsById[id] = new MockElement("div");
        elementsById[id].id = id;
      }
      return elementsById[id];
    },
    querySelector: (sel) => {
      if (sel.startsWith("#")) return mockDoc.getElementById(sel.substring(1));
      for (const key of Object.keys(elementsById)) {
        const el = elementsById[key];
        const res = el.querySelector(sel);
        if (res) return res;
      }
      if (sel === ".custom-modal-overlay.active") {
        const overlay = elementsById["custom-modal-overlay"];
        if (overlay && overlay.classList.contains("active")) return overlay;
        return null;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const results = [];
      for (const key of Object.keys(elementsById)) {
        const el = elementsById[key];
        const found = el.querySelectorAll(sel);
        for (const item of found) results.push(item);
      }
      return results;
    },
    createElement: (tag) => new MockElement(tag),
    addEventListener: (type, cb) => {
      if (!docEventListeners[type]) docEventListeners[type] = [];
      docEventListeners[type].push(cb);
    },
    removeEventListener: (type, cb) => {
      if (!docEventListeners[type]) return;
      docEventListeners[type] = docEventListeners[type].filter(l => l !== cb);
    }
  };

  const storage = {};
  const mockLocalStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { for (let k in storage) delete storage[k]; }
  };

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

  const globalContext = {};
  const appRunner = new Function("window", "document", "localStorage", "console", "setInterval", "clearInterval", "setTimeout", "clearTimeout", "globalContext", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    globalObj.setInterval = setInterval;
    globalObj.clearInterval = clearInterval;
    globalObj.setTimeout = function(fn, ms) { return 1; };
    globalObj.clearTimeout = function() {};
    globalObj.globalContext = globalContext;
    if (typeof Event === "undefined") {
      globalObj.Event = function(type, opts) {
        this.type = type;
        this.bubbles = !!(opts && opts.bubbles);
      };
    }
    ${appJsCode}
    return globalContext;
  `);

  appRunner(mockWindow, mockDoc, mockLocalStorage, mockConsole, mockSetInterval, mockClearInterval, function() {}, function() {}, globalContext);

  const domLoadedListeners = docEventListeners["DOMContentLoaded"] || [];
  for (const listener of domLoadedListeners) {
    listener();
  }

  const state = mockWindow.state;
  const appScope = mockWindow;

  mockConsole.log("\n[CHECK 1] Navigation Shortcuts (N / P / Right / Left)");
  {
    state.questions = [
      { id: 1, module: "Cell Biology", type: "multiple-choice", question: "Q1", options: ["A. 1", "B. 2", "C. 3", "D. 4"], correctAnswer: "A" },
      { id: 2, module: "Cell Biology", type: "multiple-choice", question: "Q2", options: ["A. 1", "B. 2", "C. 3", "D. 4"], correctAnswer: "B" },
      { id: 3, module: "Histology", type: "multiple-choice", question: "Q3", options: ["A. 1", "B. 2", "C. 3", "D. 4"], correctAnswer: "C" },
      { id: 4, module: "Embryology", type: "multiple-choice", question: "Q4", options: ["A. 1", "B. 2", "C. 3", "D. 4"], correctAnswer: "D" },
      { id: 5, module: "Interdisciplinary", type: "multiple-choice", question: "Q5", options: ["A. 1", "B. 2", "C. 3", "D. 4", "E. 5"], correctAnswer: "E" }
    ];
    state.currentQuestionIndex = 0;
    state.isExamSubmitted = false;
    screenExam.classList.add("active");
    mockDoc.activeElement = null;
    appScope.renderQuestion();

    fireKeyDown({ key: "n", code: "KeyN" });
    assert(state.currentQuestionIndex === 1, "Pressing 'N' advances to Question 2");

    fireKeyDown({ key: "ArrowRight", code: "ArrowRight" });
    assert(state.currentQuestionIndex === 2, "Pressing ArrowRight advances to Question 3");

    fireKeyDown({ key: "p", code: "KeyP" });
    assert(state.currentQuestionIndex === 1, "Pressing 'P' returns to Question 2");

    fireKeyDown({ key: "ArrowLeft", code: "ArrowLeft" });
    assert(state.currentQuestionIndex === 0, "Pressing ArrowLeft returns to Question 1");
  }

  mockConsole.log("\n[CHECK 2] Option Selection (A-E, 1-5, T/F/V)");
  {
    state.currentQuestionIndex = 0;
    appScope.renderQuestion();

    fireKeyDown({ key: "b", code: "KeyB" });
    assert(state.answers[1] === "B", "Key 'B' selects Option B");

    fireKeyDown({ key: "4", code: "Digit4" });
    assert(state.answers[1] === "D", "Key '4' selects Option D");

    state.currentQuestionIndex = 4; // 5 options
    appScope.renderQuestion();
    fireKeyDown({ key: "e", code: "KeyE" });
    assert(state.answers[5] === "E", "Key 'E' selects Option E on 5-option question");
  }

  mockConsole.log("\n[CHECK 3] Bookmark Toggle (M)");
  {
    state.currentQuestionIndex = 0;
    const q1Text = state.questions[0].question;
    state.bookmarks = [];

    fireKeyDown({ key: "m", code: "KeyM" });
    assert(state.bookmarks.some(b => b.question === q1Text), "Key 'M' adds bookmark for active question");

    fireKeyDown({ key: "m", code: "KeyM" });
    assert(!state.bookmarks.some(b => b.question === q1Text), "Key 'M' removes bookmark for active question");
  }

  mockConsole.log("\n[CHECK 4] Focus Guards & Modifier Key Protection");
  {
    state.currentQuestionIndex = 0;
    state.answers[1] = "A";
    appScope.renderQuestion();

    const textarea = new MockElement("textarea");
    mockDoc.activeElement = textarea;
    fireKeyDown({ key: "b", code: "KeyB" });
    assert(state.answers[1] === "A", "Shortcuts ignored when TEXTAREA is focused");

    const textInput = new MockElement("input");
    textInput.type = "text";
    mockDoc.activeElement = textInput;
    fireKeyDown({ key: "n", code: "KeyN" });
    assert(state.currentQuestionIndex === 0, "Navigation ignored when text input is focused");

    mockDoc.activeElement = null;
    fireKeyDown({ key: "n", code: "KeyN", metaKey: true });
    assert(state.currentQuestionIndex === 0, "Cmd+N shortcut combination ignored");
  }

  mockConsole.log("\n[CHECK 5] Timer Duration Freeze on Save/Exit & Resume (R2)");
  {
    state.timeLeft = 2730; // 45:30
    state.currentQuestionIndex = 2;
    state.answers[1] = "B";
    state.answers[2] = "C";
    state.isExamSubmitted = false;

    appScope.saveCurrentSimulationProgress();

    const savedSim = JSON.parse(mockLocalStorage.getItem("cbeh_saved_simulation"));
    const activeExam = JSON.parse(mockLocalStorage.getItem("cbeh_active_exam_state_v1"));

    assert(savedSim && savedSim.timeLeft === 2730, "cbeh_saved_simulation preserves exact timeLeft: 2730s (45:30)");
    assert(activeExam && activeExam.timeLeft === 2730, "cbeh_active_exam_state_v1 preserves exact timeLeft: 2730s");

    // Clear runtime state to simulate fresh application reload
    state.questions = [];
    state.timeLeft = 5400;
    state.answers = {};

    btnResumeExam.click();

    assert(state.timeLeft === 2730, "Resumed state.timeLeft matches exact frozen duration (2730s)");
    assert(examTimer.textContent === "45:30", "examTimer text display is cleanly restored to 45:30");
    assert(state.currentQuestionIndex === 2, "currentQuestionIndex restored to question 3");
    assert(state.answers[1] === "B" && state.answers[2] === "C", "User answers preserved cleanly across session freeze and resume");
  }

  mockConsole.log("\n================================================================================");
  mockConsole.log(`INDEPENDENT AUDITOR RESULTS: Passed: ${passed}, Failed: ${failed}`);
  mockConsole.log("================================================================================");

  return { passed: passed, failed: failed, success: failed === 0 };
}

runIndependentVictoryAuditSuite();
