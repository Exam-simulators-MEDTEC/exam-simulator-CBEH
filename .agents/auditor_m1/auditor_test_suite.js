// Auditor Independent Test Suite for Milestone 1: Parser & Prompt Sanitization

function runAuditorTestSuite() {
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
        try { cb(); } catch(e) {}
      }
    }
  };
  
  const mockWindow = {
    CBEH_QUESTIONS: [],
    pdfjsLib: null,
    addEventListener: function(event, cb) {}
  };

  const testFn = new Function("window", "document", "localStorage", "console", `
    if (!console.error) console.error = function(){};
    if (!console.warn) console.warn = function(){};
    var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
    globalObj.window = window;
    globalObj.document = document;
    globalObj.localStorage = localStorage;
    ${appJsCode}
    return {
      getModuleFromQuestionId: window.getModuleFromQuestionId || globalObj.getModuleFromQuestionId,
      cleanQuestionPromptText: window.cleanQuestionPromptText || globalObj.cleanQuestionPromptText,
      sanitizeQuestion: window.sanitizeQuestion || globalObj.sanitizeQuestion,
      sanitizeQuestionPool: window.sanitizeQuestionPool || globalObj.sanitizeQuestionPool,
      parseMockExamText: window.parseMockExamText || globalObj.parseMockExamText
    };
  `);

  const mockConsole = { log: function(){}, error: function(){}, warn: function(){} };
  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const { getModuleFromQuestionId, cleanQuestionPromptText, sanitizeQuestion, sanitizeQuestionPool, parseMockExamText } = exports;

  let total = 0;
  let passed = 0;
  let failed = 0;
  const errors = [];

  function assert(name, condition, errorMsg) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      failed++;
      const msg = `[FAIL] ${name}: ${errorMsg || "Assertion failed"}`;
      console.log(msg);
      errors.push(msg);
    }
  }

  function assertEqual(name, actual, expected) {
    total++;
    if (actual === expected) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      failed++;
      const msg = `[FAIL] ${name} -> Expected: '${expected}', Got: '${actual}'`;
      console.log(msg);
      errors.push(msg);
    }
  }

  console.log("=== 1. Testing getModuleFromQuestionId ===");
  // Module ID Range verification for all 70 blueprint positions
  for (let id = 1; id <= 70; id++) {
    let expectedMod = "Cell Biology";
    if (id >= 67) expectedMod = "Interdisciplinary";
    else if (id >= 55) expectedMod = "Embryology";
    else if (id >= 31) expectedMod = "Histology";
    assertEqual(`ID ${id} -> ${expectedMod}`, getModuleFromQuestionId(id), expectedMod);
  }

  // Modulo boundary verification for cyclical question pools
  assertEqual("ID 71 (Sim 2 Q1) -> Cell Biology", getModuleFromQuestionId(71), "Cell Biology");
  assertEqual("ID 100 (Sim 2 Q30) -> Cell Biology", getModuleFromQuestionId(100), "Cell Biology");
  assertEqual("ID 101 (Sim 2 Q31) -> Histology", getModuleFromQuestionId(101), "Histology");
  assertEqual("ID 124 (Sim 2 Q54) -> Histology", getModuleFromQuestionId(124), "Histology");
  assertEqual("ID 125 (Sim 2 Q55) -> Embryology", getModuleFromQuestionId(125), "Embryology");
  assertEqual("ID 136 (Sim 2 Q66) -> Embryology", getModuleFromQuestionId(136), "Embryology");
  assertEqual("ID 137 (Sim 2 Q67) -> Interdisciplinary", getModuleFromQuestionId(137), "Interdisciplinary");
  assertEqual("ID 140 (Sim 2 Q70) -> Interdisciplinary", getModuleFromQuestionId(140), "Interdisciplinary");

  // Fallback and edge inputs
  assertEqual("ID 0 fallback", getModuleFromQuestionId(0), "Cell Biology");
  assertEqual("Negative ID fallback", getModuleFromQuestionId(-10), "Cell Biology");
  assertEqual("String '68' fallback", getModuleFromQuestionId("68"), "Interdisciplinary");
  assertEqual("Null fallback", getModuleFromQuestionId(null), "Cell Biology");
  assertEqual("Undefined fallback", getModuleFromQuestionId(undefined), "Cell Biology");
  assertEqual("NaN fallback", getModuleFromQuestionId(NaN), "Cell Biology");

  console.log("\n=== 2. Testing cleanQuestionPromptText ===");
  const promptTests = [
    // Conjunctions & orphaned leading words
    ["70. and cellular energy is produced in mitochondria.", "Cellular energy is produced in mitochondria."],
    ["70. (Open Question - Max 200 words) and cellular energy...", "Cellular energy..."],
    ["68. - and dopaminergic neurons...", "Dopaminergic neurons..."],
    ["69. : and the cellular pathway...", "Cellular pathway..."],
    ["and or but also & cellular metabolism...", "Cellular metabolism..."],
    ["... - : and the secondary oocyte...", "Secondary oocyte..."],
    
    // Capitalized sentence starters preservation
    ["In the context of cancer metastasis, tumor cells undergo EMT.", "In the context of cancer metastasis, tumor cells undergo EMT."],
    ["The primary function of the Golgi apparatus is protein modification.", "The primary function of the Golgi apparatus is protein modification."],
    ["During embryonic folding, the flat trilaminar disc transforms...", "During embryonic folding, the flat trilaminar disc transforms..."],
    ["Loss of E-cadherin is characteristic of EMT.", "Loss of E-cadherin is characteristic of EMT."],
    ["According to the fluid mosaic model, lipid bilayers...", "According to the fluid mosaic model, lipid bilayers..."],
    ["At what specific stage does meiotic arrest occur?", "At what specific stage does meiotic arrest occur?"],
    ["With respect to the cell cycle, p53 regulates G1/S.", "With respect to the cell cycle, p53 regulates G1/S."],
    ["For which of the following tissues is stratified squamous characteristic?", "For which of the following tissues is stratified squamous characteristic?"],
    
    // Leaked headers & tags
    ["MODULE 4: INTERDISCIPLINARY\n67. (Multiple Choice) In the context...", "In the context..."],
    ["PART IV - INTERDISCIPLINARY (4 Questions)\n68. Which of the following...", "Which of the following..."],
    ["TOPIC: Cellular Communication\n1. What is signal transduction?", "What is signal transduction?"],
    ["[Embryology + Histology] Explain the role of neural crest cells.", "Explain the role of neural crest cells."],
    ["[Stem Cells] Describe the niche of intestinal stem cells.", "Describe the niche of intestinal stem cells."],

    // Extreme noise
    [": : - - • • * * and the blastocyst implants on day 6.", "Blastocyst implants on day 6."],
    ["... and with in that the mitochondria produce ATP.", "Mitochondria produce ATP."]
  ];

  promptTests.forEach(([input, expected], idx) => {
    assertEqual(`Prompt cleaner test #${idx + 1}`, cleanQuestionPromptText(input), expected);
  });

  console.log("\n=== 3. Testing sanitizeQuestion Module Immunity ===");
  const testQ1 = {
    id: 67,
    type: "multiple-choice",
    module: "Histology",
    question: "67. (Multiple Choice) In the context of cancer metastasis, which cell biology pathway in histology is activated?"
  };
  sanitizeQuestion(testQ1);
  assertEqual("Q67 assigned to Interdisciplinary", testQ1.module, "Interdisciplinary");
  assert("Q67 prompt starts with 'In the context...'", testQ1.question.startsWith("In the context of cancer metastasis"));

  const testQ2 = {
    id: 35,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "35. (Multiple Choice) Which embryonic tissue forms the epidermis in histology?"
  };
  sanitizeQuestion(testQ2);
  assertEqual("Q35 assigned to Histology", testQ2.module, "Histology");

  console.log("\n=== 4. Testing parseMockExamText with Markdown Exams ===");
  const sim4Path = $(projectRoot + "/Mock exams/CBEH_simulation_4.md");
  const sim4Data = $.NSString.stringWithContentsOfFileEncodingError(sim4Path, $.NSUTF8StringEncoding, null);
  const sim4Qs = parseMockExamText(ObjC.unwrap(sim4Data));

  assertEqual("Sim 4 total question count", sim4Qs.length, 70);
  assertEqual("Sim 4 Cell Biology count", sim4Qs.filter(q => q.module === "Cell Biology").length, 30);
  assertEqual("Sim 4 Histology count", sim4Qs.filter(q => q.module === "Histology").length, 24);
  assertEqual("Sim 4 Embryology count", sim4Qs.filter(q => q.module === "Embryology").length, 12);
  assertEqual("Sim 4 Interdisciplinary count", sim4Qs.filter(q => q.module === "Interdisciplinary").length, 4);

  const sim7Path = $(projectRoot + "/Mock exams/CBEH_simulation_7.md");
  const sim7Data = $.NSString.stringWithContentsOfFileEncodingError(sim7Path, $.NSUTF8StringEncoding, null);
  const sim7Qs = parseMockExamText(ObjC.unwrap(sim7Data));

  assertEqual("Sim 7 total question count", sim7Qs.length, 70);
  assertEqual("Sim 7 Cell Biology count", sim7Qs.filter(q => q.module === "Cell Biology").length, 30);
  assertEqual("Sim 7 Histology count", sim7Qs.filter(q => q.module === "Histology").length, 24);
  assertEqual("Sim 7 Embryology count", sim7Qs.filter(q => q.module === "Embryology").length, 12);
  assertEqual("Sim 7 Interdisciplinary count", sim7Qs.filter(q => q.module === "Interdisciplinary").length, 4);

  // Verify Q37 in Sim 7
  const q37 = sim7Qs.find(q => q.id === 37);
  assert("Sim 7 Q37 was parsed and retained", q37 !== undefined);
  if (q37) {
    assertEqual("Sim 7 Q37 module", q37.module, "Histology");
    assert("Sim 7 Q37 prompt starts with 'The periodic acid-Schiff (PAS) stain'", q37.question.startsWith("The periodic acid-Schiff (PAS) stain"));
  }

  console.log(`\n========================================`);
  console.log(`AUDITOR TEST RESULTS: Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================`);

  return failed === 0 ? "VERIFIED_CLEAN" : "INTEGRITY_VIOLATION";
}

runAuditorTestSuite();
