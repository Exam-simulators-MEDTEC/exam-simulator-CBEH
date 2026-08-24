// Test JS Implementation for CBEH Exam Simulator (Milestone 1)

function runTests() {
  const fs = $.NSFileManager.defaultManager;
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
  // Read app.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  // Set up mock browser environment
  const mockLocalStorage = {};
  function createDummyEl() {
    return {
      classList: { add: function(){}, remove: function(){}, contains: function(){ return false; } },
      style: {},
      textContent: "",
      value: "",
      appendChild: function(){},
      addEventListener: function(){},
      click: function(){}
    };
  }

  const mockDoc = {
    body: { dataset: {} },
    getElementById: function(id) { return createDummyEl(); },
    querySelector: function(sel) { return createDummyEl(); },
    querySelectorAll: function(sel) { return []; },
    createElement: function(tag) { return createDummyEl(); },
    addEventListener: function(event, cb) {
      if (event === "DOMContentLoaded") {
        console.log("DOMContentLoaded listener registered!");
        try {
          cb();
          console.log("DOMContentLoaded finished successfully!");
        } catch(e) {
          console.log("DOMContentLoaded error: " + (e.stack || e));
        }
      }
    }
  };
  
  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    addEventListener: function(event, cb) {}
  };

  // Evaluate app.js in a mocked context
  const testFn = new Function("window", "document", "localStorage", "console", `
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    ${appJsCode}
    console.log("Inside testFn, window.getModuleFromQuestionId: " + (typeof window.getModuleFromQuestionId));
    console.log("Inside testFn, globalObj.getModuleFromQuestionId: " + (typeof globalObj.getModuleFromQuestionId));
    return {
      getModuleFromQuestionId: window.getModuleFromQuestionId || globalObj.getModuleFromQuestionId,
      cleanQuestionPromptText: window.cleanQuestionPromptText || globalObj.cleanQuestionPromptText,
      sanitizeQuestion: window.sanitizeQuestion || globalObj.sanitizeQuestion,
      sanitizeQuestionPool: window.sanitizeQuestionPool || globalObj.sanitizeQuestionPool,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText
    };
  `);

  const mockConsole = {
    log: function(msg) { console.log(msg); },
    error: function(msg) { console.log("ERR: " + msg); },
    warn: function(msg) { console.log("WARN: " + msg); }
  };

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  console.log("mockWindow keys: " + Object.keys(mockWindow).join(", "));
  console.log("Top-level this keys: " + Object.keys(this).filter(k => k.includes("Module") || k.includes("Question") || k.includes("Mock")).join(", "));
  var g = typeof globalThis !== "undefined" ? globalThis : this;
  console.log("globalThis keys: " + Object.keys(g).filter(k => k.includes("Module") || k.includes("Question") || k.includes("Mock")).join(", "));

  const { getModuleFromQuestionId, cleanQuestionPromptText, sanitizeQuestion, sanitizeQuestionPool, parseMockExamText } = exports;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log("PASS: " + message);
    } else {
      failed++;
      console.log("FAIL: " + message);
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual === expected) {
      passed++;
      console.log("PASS: " + message);
    } else {
      failed++;
      console.log("FAIL: " + message + " -> Expected: '" + expected + "', Got: '" + actual + "'");
    }
  }

  console.log("=== 1. Testing getModuleFromQuestionId ===");
  for (let i = 1; i <= 30; i++) {
    assertEqual(getModuleFromQuestionId(i), "Cell Biology", `Q${i} is Cell Biology`);
  }
  for (let i = 31; i <= 54; i++) {
    assertEqual(getModuleFromQuestionId(i), "Histology", `Q${i} is Histology`);
  }
  for (let i = 55; i <= 66; i++) {
    assertEqual(getModuleFromQuestionId(i), "Embryology", `Q${i} is Embryology`);
  }
  for (let i = 67; i <= 70; i++) {
    assertEqual(getModuleFromQuestionId(i), "Interdisciplinary", `Q${i} is Interdisciplinary`);
  }

  console.log("\n=== 2. Testing cleanQuestionPromptText ===");
  const testPairs = [
    ["70. and cellular energy is produced in the mitochondria.", "Cellular energy is produced in the mitochondria."],
    ["In the context of cancer metastasis, tumor cells often undergo EMT.", "In the context of cancer metastasis, tumor cells often undergo EMT."],
    ["The primary function of the Golgi apparatus is protein modification.", "The primary function of the Golgi apparatus is protein modification."],
    ["The two strands of a DNA double helix are antiparallel.", "The two strands of a DNA double helix are antiparallel."],
    ["During embryonic folding, the flat trilaminar disc transforms...", "During embryonic folding, the flat trilaminar disc transforms..."],
    ["Loss of E-cadherin is characteristic of EMT.", "Loss of E-cadherin is characteristic of EMT."],
    ["70. (Open Question - Max 200 words) ... and cellular energy...", "Cellular energy..."],
    ["MODULE 4: INTERDISCIPLINARY\n67. (Multiple Choice) In the context...", "In the context..."],
    ["68. - and dopaminergic neurons...", "Dopaminergic neurons..."],
    ["69. : and the cellular pathway...", "Cellular pathway..."],
    ["[Embryology + Histology] Explain the role of neural crest cells.", "Explain the role of neural crest cells."],
    ["and or but and cellular respiration occurs in mitochondria.", "Cellular respiration occurs in mitochondria."],
    ["... - : and the secondary oocyte arrests in metaphase II.", "Secondary oocyte arrests in metaphase II."],
    ["At what specific stage does meiotic arrest occur?", "At what specific stage does meiotic arrest occur?"],
    ["According to the fluid mosaic model, lipid bilayers...", "According to the fluid mosaic model, lipid bilayers..."],
    ["TOPIC: Cellular Communication\n1. What is signal transduction?", "What is signal transduction?"]
  ];

  testPairs.forEach(([input, expected], idx) => {
    assertEqual(cleanQuestionPromptText(input), expected, `Prompt test case #${idx + 1}`);
  });

  console.log("\n=== 3. Testing sanitizeQuestion ===");
  const testQ = {
    id: 67,
    question: "70. and cellular energy pathway in histology",
    module: "Histology" // initially wrongly set
  };
  sanitizeQuestion(testQ);
  assertEqual(testQ.module, "Interdisciplinary", "Q67 module sanitized to Interdisciplinary");
  assertEqual(testQ.question, "Cellular energy pathway in histology", "Q67 prompt cleaned of leading conjunctions");

  console.log("\n=== 4. Testing parseMockExamText with Simulation 4 (Markdown) ===");
  const sim4Path = $(projectRoot + "/Mock exams/CBEH_simulation_4.md");
  const sim4Data = $.NSString.stringWithContentsOfFileEncodingError(sim4Path, $.NSUTF8StringEncoding, null);
  const sim4Text = ObjC.unwrap(sim4Data);
  const sim4Questions = parseMockExamText(sim4Text);

  console.log("Sim 4 parsed IDs: " + sim4Questions.map(q => q.id).join(", "));
  const missing = [];
  for (let i = 1; i <= 70; i++) {
    if (!sim4Questions.some(q => q.id === i)) missing.push(i);
  }
  console.log("Sim 4 missing IDs: " + missing.join(", "));
  assertEqual(sim4Questions.length, 70, "Sim 4 parsed exactly 70 questions");
  const sim4Modules = sim4Questions.map(q => q.module);
  const sim4Cb = sim4Modules.filter(m => m === "Cell Biology").length;
  const sim4Hist = sim4Modules.filter(m => m === "Histology").length;
  const sim4Emb = sim4Modules.filter(m => m === "Embryology").length;
  const sim4Ind = sim4Modules.filter(m => m === "Interdisciplinary").length;

  assertEqual(sim4Cb, 30, "Sim 4 has 30 Cell Biology questions");
  assertEqual(sim4Hist, 24, "Sim 4 has 24 Histology questions");
  assertEqual(sim4Emb, 12, "Sim 4 has 12 Embryology questions");
  assertEqual(sim4Ind, 4, "Sim 4 has 4 Interdisciplinary questions");

  const q67 = sim4Questions.find(q => q.id === 67);
  const q68 = sim4Questions.find(q => q.id === 68);
  const q69 = sim4Questions.find(q => q.id === 69);
  const q70 = sim4Questions.find(q => q.id === 70);

  assert(q67 && q67.module === "Interdisciplinary", "Sim 4 Q67 is Interdisciplinary");
  assert(q67 && q67.question.startsWith("In the context of cancer metastasis"), "Sim 4 Q67 prompt starts with 'In the context...'");
  assert(q68 && q68.module === "Interdisciplinary", "Sim 4 Q68 is Interdisciplinary");
  assert(q69 && q69.module === "Interdisciplinary", "Sim 4 Q69 is Interdisciplinary");
  assert(q70 && q70.module === "Interdisciplinary", "Sim 4 Q70 is Interdisciplinary");

  console.log("\n=== 5. Testing parseMockExamText with Simulation 7 (Markdown) ===");
  const sim7Path = $(projectRoot + "/Mock exams/CBEH_simulation_7.md");
  const sim7Data = $.NSString.stringWithContentsOfFileEncodingError(sim7Path, $.NSUTF8StringEncoding, null);
  const sim7Text = ObjC.unwrap(sim7Data);
  const sim7Questions = parseMockExamText(sim7Text);

  assertEqual(sim7Questions.length, 70, "Sim 7 parsed exactly 70 questions");
  const q37 = sim7Questions.find(q => q.id === 37);
  assert(q37 !== undefined, "Sim 7 Q37 was parsed and NOT dropped");
  if (q37) {
    assertEqual(q37.module, "Histology", "Sim 7 Q37 module is Histology");
    assert(q37.question.startsWith("The periodic acid-Schiff (PAS) stain"), "Sim 7 Q37 prompt starts with 'The periodic acid-Schiff...'");
  }

  const sim7Modules = sim7Questions.map(q => q.module);
  const sim7Cb = sim7Modules.filter(m => m === "Cell Biology").length;
  const sim7Hist = sim7Modules.filter(m => m === "Histology").length;
  const sim7Emb = sim7Modules.filter(m => m === "Embryology").length;
  const sim7Ind = sim7Modules.filter(m => m === "Interdisciplinary").length;

  assertEqual(sim7Cb, 30, "Sim 7 has 30 Cell Biology questions");
  assertEqual(sim7Hist, 24, "Sim 7 has 24 Histology questions");
  assertEqual(sim7Emb, 12, "Sim 7 has 12 Embryology questions");
  assertEqual(sim7Ind, 4, "Sim 7 has 4 Interdisciplinary questions");

  console.log(`\n========================================`);
  console.log(`RESULTS: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================`);
  return failed === 0 ? "SUCCESS" : "FAILURE";
}

runTests();
