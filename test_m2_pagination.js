// Comprehensive Milestone 2 Verification Test Suite
// Results Screen UI Pagination & Compact Actions
// Executed via JavaScriptCore (osascript -l JavaScript)

function runMilestone2Tests() {
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
  mockConsole.log("     MILESTONE 2 VERIFICATION: RESULTS PAGINATION & COMPACT ACTIONS");
  mockConsole.log("================================================================================");

  // DOM Mock Implementation
  class MockElement {
    constructor(tagName = "div") {
      this.tagName = tagName.toUpperCase();
      this.id = "";
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
        }
      };
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.children = [];
      this.parentElement = null;
      this.textContent = "";
      this._innerHTML = "";
      this.listeners = {};
    }

    get className() {
      return Array.from(this.classList._classes).join(" ");
    }

    set className(val) {
      this.classList._classes.clear();
      if (val) {
        val.split(/\s+/).filter(Boolean).forEach(c => this.classList._classes.add(c));
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
    }

    setAttribute(name, val) {
      this.attributes[name] = String(val);
    }

    getAttribute(name) {
      return this.attributes[name] || null;
    }

    removeAttribute(name) {
      delete this.attributes[name];
    }

    appendChild(child) {
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

    remove() {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      }
    }

    addEventListener(evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    }

    click() {
      if (this.listeners["click"]) {
        this.listeners["click"].forEach(fn => fn({ target: this, preventDefault: () => {} }));
      }
    }

    scrollIntoView(options) {
      this._scrolledIntoView = true;
      this._scrollOptions = options;
    }

    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      function traverse(node) {
        for (let child of node.children) {
          if (selector.startsWith("#") && child.id === selector.substring(1)) {
            results.push(child);
          } else if (selector.startsWith(".") && child.classList.contains(selector.substring(1))) {
            results.push(child);
          } else if (selector === child.tagName.toLowerCase()) {
            results.push(child);
          }
          traverse(child);
        }
      }
      traverse(this);
      return results;
    }
  }

  // Create environment
  const elementsById = {};
  const mockDoc = {
    body: new MockElement("body"),
    getElementById: (id) => elementsById[id] || null,
    createElement: (tag) => {
      const el = new MockElement(tag);
      return el;
    },
    querySelector: (sel) => mockDoc.body.querySelector(sel),
    querySelectorAll: (sel) => mockDoc.body.querySelectorAll(sel),
    addEventListener: (evt, fn) => {
      if (evt === "DOMContentLoaded") {
        try { fn(); } catch(e) {}
      }
    }
  };

  function registerElement(id, tag = "div", className = "") {
    const el = new MockElement(tag);
    el.id = id;
    if (className) el.classList.add(...className.split(" ").filter(Boolean));
    elementsById[id] = el;
    mockDoc.body.appendChild(el);
    return el;
  }

  // Register required DOM elements for app.js initialization
  registerElement("screen-welcome", "div", "screen active");
  registerElement("screen-exam", "div", "screen");
  registerElement("screen-results", "div", "screen");
  registerElement("btn-start-exam", "button");
  registerElement("btn-submit-exam", "button");
  registerElement("btn-restart-exam", "button");
  registerElement("btn-home-exam", "button");
  registerElement("btn-home-results", "button");
  registerElement("btn-home-results-top", "button");
  registerElement("downloadPdfBtn", "button");
  registerElement("downloadPdfBtnTop", "button");
  registerElement("btn-prev-question", "button");
  registerElement("btn-next-question", "button");
  registerElement("question-index-counter", "span");
  registerElement("question-module-badge", "span");
  registerElement("exam-timer", "span");
  registerElement("timer-box", "div");
  registerElement("question-card", "div");
  registerElement("question-text", "div");
  registerElement("answer-inputs-area", "div");
  registerElement("flag-checkbox", "input");
  registerElement("flag-label-container", "label");
  registerElement("btn-bookmark-question", "button");
  registerElement("bookmark-icon-svg", "svg");
  registerElement("questions-grid-container", "div");
  registerElement("upload-dropzone", "div");
  registerElement("pdf-file-input", "input");
  registerElement("pool-status-count", "span");
  registerElement("pool-status-sims", "span");
  registerElement("tab-btn-grading", "button");
  registerElement("tab-btn-review", "button");
  registerElement("tab-content-grading", "div");
  registerElement("tab-content-review", "div");
  registerElement("open-questions-grading-list", "div");
  registerElement("auto-questions-review-list", "div");
  registerElement("result-status-badge", "div");
  registerElement("result-grade-display", "div");
  registerElement("result-score-summary", "div");
  registerElement("card-result-cellbio", "div");
  registerElement("score-cellbio", "div");
  registerElement("status-cellbio", "div");
  registerElement("card-result-histology", "div");
  registerElement("score-histology", "div");
  registerElement("status-histology", "div");
  registerElement("card-result-embryo", "div");
  registerElement("score-embryo", "div");
  registerElement("status-embryo", "div");
  registerElement("card-result-interdisciplinary", "div");
  registerElement("score-interdisciplinary", "div");
  registerElement("status-interdisciplinary", "div");
  registerElement("btn-resume-exam", "button");
  registerElement("custom-modal-overlay", "div");
  registerElement("sim-questions-modal", "div");

  const mockLocalStorage = {};
  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    addEventListener: () => {},
    scrollTo: () => {}
  };

  const appRunner = new Function("window", "document", "localStorage", "console", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    ${appJsCode}
    return {
      applyReviewListPagination: window.applyReviewListPagination || globalObj.applyReviewListPagination,
      state: window.state || globalObj.state,
      generateAndDownloadResultsPDF: window.generateAndDownloadResultsPDF || globalObj.generateAndDownloadResultsPDF
    };
  `);

  const exports = appRunner(mockWindow, mockDoc, {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = v; },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  }, mockConsole);

  const { applyReviewListPagination, state } = exports;

  // ---------------------------------------------------------------------------
  // SUITE 1: Card Selector Robustness
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Robust Card Selector Matching");

  const testContainer = registerElement("test-review-container", "div");

  // Create cards with different classes: review-item-card, grading-item-card, question-card, review-card
  const card1 = mockDoc.createElement("div");
  card1.classList.add("review-item-card", "correct");
  testContainer.appendChild(card1);

  const card2 = mockDoc.createElement("div");
  card2.classList.add("grading-item-card", "graded-incorrect");
  testContainer.appendChild(card2);

  const card3 = mockDoc.createElement("div");
  card3.classList.add("question-card");
  testContainer.appendChild(card3);

  const card4 = mockDoc.createElement("div");
  card4.classList.add("review-card");
  testContainer.appendChild(card4);

  const card5 = mockDoc.createElement("div");
  card5.classList.add("review-item-card", "incorrect");
  testContainer.appendChild(card5);

  // Also add a non-card element (like toolbar) to ensure it's not counted as a card
  const toolbar = mockDoc.createElement("div");
  toolbar.classList.add("masterToolbar");
  testContainer.appendChild(toolbar);

  state.reviewPagination = {};
  applyReviewListPagination("test-review-container");

  // Check that 5 cards were found, first 3 visible (display: flex), cards 4 and 5 hidden (display: none)
  assertEqual(card1.style.display, "flex", "Card 1 (review-item-card) is flex");
  assertEqual(card2.style.display, "flex", "Card 2 (grading-item-card) is flex");
  assertEqual(card3.style.display, "flex", "Card 3 (question-card) is flex");
  assertEqual(card4.style.display, "none", "Card 4 (review-card) is hidden initially");
  assertEqual(card5.style.display, "none", "Card 5 (review-item-card) is hidden initially");

  // Check pagination control created
  const paginationControl = testContainer.querySelector(".review-pagination-control");
  assert(paginationControl !== null, "Pagination control element created");
  assertEqual(paginationControl.getAttribute("role"), "region", "Pagination control has role='region'");

  // Check toggle button
  const toggleBtn = testContainer.querySelector("#btn-show-more-test-review-container");
  assert(toggleBtn !== null, "Toggle button #btn-show-more-test-review-container exists");
  assert(toggleBtn.classList.contains("btn-show-more"), "Toggle button has class 'btn-show-more'");
  assertEqual(toggleBtn.getAttribute("aria-expanded"), "false", "Initial aria-expanded is 'false'");
  assertEqual(toggleBtn.getAttribute("aria-controls"), "test-review-container", "aria-controls matches container ID");
  assert(toggleBtn.innerHTML.includes("Show More Questions (2 remaining)"), "Toggle button text says '(2 remaining)'");

  // ---------------------------------------------------------------------------
  // SUITE 2: Compact Action Buttons
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Compact Action Buttons Presence & Click Routing");

  const compactActions = paginationControl.querySelector(".results-compact-actions");
  assert(compactActions !== null, ".results-compact-actions container exists");

  const btnHome = compactActions.querySelector("#btn-compact-home-test-review-container");
  assert(btnHome !== null, "Compact Home button exists");
  assert(btnHome.classList.contains("btn-compact-home"), "Home button has class 'btn-compact-home'");
  assert(btnHome.innerHTML.includes("Return Home"), "Home button contains text 'Return Home'");

  const btnRestart = compactActions.querySelector("#btn-compact-restart-test-review-container");
  assert(btnRestart !== null, "Compact Restart button exists");
  assert(btnRestart.classList.contains("btn-compact-restart"), "Restart button has class 'btn-compact-restart'");
  assert(btnRestart.innerHTML.includes("Retake Another Exam"), "Restart button contains text 'Retake Another Exam'");

  const btnPdf = compactActions.querySelector("#btn-compact-pdf-test-review-container");
  assert(btnPdf !== null, "Compact PDF button exists");
  assert(btnPdf.classList.contains("btn-compact-pdf"), "PDF button has class 'btn-compact-pdf'");
  assert(btnPdf.innerHTML.includes("Download Study Summary (PDF)"), "PDF button contains text 'Download Study Summary (PDF)'");

  // Test click routing
  let homeClicked = false;
  elementsById["btn-home-results"].addEventListener("click", () => { homeClicked = true; });
  btnHome.click();
  assert(homeClicked, "Clicking compact Home routes to #btn-home-results");

  let restartClicked = false;
  elementsById["btn-restart-exam"].addEventListener("click", () => { restartClicked = true; });
  btnRestart.click();
  assert(restartClicked, "Clicking compact Restart routes to #btn-restart-exam");

  // ---------------------------------------------------------------------------
  // SUITE 3: Expansion & Collapse Toggle Interaction
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] Toggle Expansion and Collapse");

  // Click Show More Questions
  toggleBtn.click();

  assertEqual(state.reviewPagination["test-review-container"], true, "State reviewPagination is true after click");
  assertEqual(toggleBtn.getAttribute("aria-expanded"), "true", "aria-expanded is 'true'");
  assert(toggleBtn.innerHTML.includes("Show Fewer Questions"), "Button text updated to 'Show Fewer Questions'");
  assertEqual(card4.style.display, "flex", "Card 4 is now visible (flex)");
  assertEqual(card5.style.display, "flex", "Card 5 is now visible (flex)");
  assert(card4.classList.contains("review-card-revealed"), "Card 4 has class 'review-card-revealed'");
  assert(card5.classList.contains("review-card-revealed"), "Card 5 has class 'review-card-revealed'");

  // Click Show Fewer Questions
  toggleBtn.click();

  assertEqual(state.reviewPagination["test-review-container"], false, "State reviewPagination is false after second click");
  assertEqual(toggleBtn.getAttribute("aria-expanded"), "false", "aria-expanded is 'false'");
  assert(toggleBtn.innerHTML.includes("Show More Questions (2 remaining)"), "Button text restored to '(2 remaining)'");
  assertEqual(card4.style.display, "none", "Card 4 is hidden again");
  assertEqual(card5.style.display, "none", "Card 5 is hidden again");
  assert(testContainer._scrolledIntoView, "Container smoothly scrolled into view on collapse");

  // ---------------------------------------------------------------------------
  // SUITE 4: List with <= 3 Items (No Pagination Needed)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Handling Small Lists (<= 3 Items)");

  const smallContainer = registerElement("small-review-container", "div");
  const sCard1 = mockDoc.createElement("div");
  sCard1.classList.add("review-item-card");
  const sCard2 = mockDoc.createElement("div");
  sCard2.classList.add("review-item-card");
  smallContainer.appendChild(sCard1);
  smallContainer.appendChild(sCard2);

  applyReviewListPagination("small-review-container");

  assertEqual(sCard1.style.display, "flex", "Small list Card 1 is visible");
  assertEqual(sCard2.style.display, "flex", "Small list Card 2 is visible");
  const smallPagination = smallContainer.querySelector(".review-pagination-control");
  assertEqual(smallPagination, null, "No pagination control rendered for list with <= 3 cards");

  // ---------------------------------------------------------------------------
  // SUITE 5: Re-render State Persistence (Self-Grading Simulation)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 5] State Persistence across Re-renders");

  // Expand testContainer again
  toggleBtn.click();
  assertEqual(state.reviewPagination["test-review-container"], true, "Container is expanded");

  // Simulate a re-render by calling applyReviewListPagination again on testContainer
  applyReviewListPagination("test-review-container");

  const reRenderedBtn = testContainer.querySelector("#btn-show-more-test-review-container");
  assert(reRenderedBtn !== null, "Re-rendered toggle button exists");
  assertEqual(reRenderedBtn.getAttribute("aria-expanded"), "true", "Re-rendered toggle preserves aria-expanded='true'");
  assert(reRenderedBtn.innerHTML.includes("Show Fewer Questions"), "Re-rendered toggle preserves 'Show Fewer Questions' text");
  assertEqual(card4.style.display, "flex", "Card 4 remains visible on re-render");
  assertEqual(card5.style.display, "flex", "Card 5 remains visible on re-render");

  // ---------------------------------------------------------------------------
  // SUITE 6: Auto-Graded Questions Review List (54 cards)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 6] Auto-Graded Questions Review List (54 cards)");

  const autoContainer = elementsById["auto-questions-review-list"];
  autoContainer.innerHTML = "";

  for (let i = 1; i <= 54; i++) {
    const c = mockDoc.createElement("div");
    c.classList.add("review-item-card", i % 2 === 0 ? "correct" : "incorrect");
    autoContainer.appendChild(c);
  }

  state.reviewPagination["auto-questions-review-list"] = false;
  applyReviewListPagination("auto-questions-review-list");

  const autoCards = autoContainer.children.filter(c => c.classList.contains("review-item-card"));
  assertEqual(autoCards.length, 54, "Auto-graded review list has 54 cards");
  assertEqual(autoCards[0].style.display, "flex", "Auto card 1 is visible");
  assertEqual(autoCards[1].style.display, "flex", "Auto card 2 is visible");
  assertEqual(autoCards[2].style.display, "flex", "Auto card 3 is visible");
  assertEqual(autoCards[3].style.display, "none", "Auto card 4 is hidden");
  assertEqual(autoCards[53].style.display, "none", "Auto card 54 is hidden");

  const autoToggle = autoContainer.querySelector("#btn-show-more-auto-questions-review-list");
  assert(autoToggle !== null, "Auto-graded toggle button exists");
  assert(autoToggle.innerHTML.includes("Show More Questions (51 remaining)"), "Auto-graded toggle says '(51 remaining)'");

  // Expand auto review list
  autoToggle.click();
  assertEqual(autoCards[3].style.display, "flex", "Auto card 4 visible after expand");
  assertEqual(autoCards[53].style.display, "flex", "Auto card 54 visible after expand");
  assert(autoToggle.innerHTML.includes("Show Fewer Questions"), "Auto toggle says 'Show Fewer Questions'");

  // ---------------------------------------------------------------------------
  // Summary & Verdict
  // ---------------------------------------------------------------------------
  mockConsole.log("\n================================================================================");
  mockConsole.log(`MILESTONE 2 TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    mockConsole.log("FAILED TESTS:");
    failureReports.forEach((f, i) => {
      mockConsole.log(`  ${i + 1}. ${f.message}: ${f.details}`);
    });
  }
  mockConsole.log("================================================================================");

  return failed === 0 ? "SUCCESS" : "FAILURE";
}

runMilestone2Tests();
