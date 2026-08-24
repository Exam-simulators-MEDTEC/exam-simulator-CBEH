// Forensic Integrity Audit & Adversarial Test Suite for Milestone 1
// Tests app.js directly in an isolated sandbox

function runForensicAudit() {
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
    if (!console.error) console.error = console.log;
    if (!console.warn) console.warn = console.log;
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

  const mockConsole = {
    log: function(msg) {},
    error: function(msg) {},
    warn: function(msg) {}
  };

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const { getModuleFromQuestionId, cleanQuestionPromptText, sanitizeQuestion, sanitizeQuestionPool, parseMockExamText } = exports;

  let checksPassed = 0;
  let checksFailed = 0;
  const failureDetails = [];

  function check(name, condition, details) {
    if (condition) {
      checksPassed++;
      // console.log("PASS: " + name);
    } else {
      checksFailed++;
      const msg = "FAIL: " + name + (details ? " (" + details + ")" : "");
      console.log(msg);
      failureDetails.push(msg);
    }
  }

  function checkEqual(name, actual, expected) {
    if (actual === expected) {
      checksPassed++;
    } else {
      checksFailed++;
      const msg = "FAIL: " + name + " -> Expected: '" + expected + "', Got: '" + actual + "'";
      console.log(msg);
      failureDetails.push(msg);
    }
  }

  console.log("=================================================");
  console.log("STARTING FORENSIC INTEGRITY & ADVERSARIAL AUDIT");
  console.log("=================================================");

  // -------------------------------------------------------------
  // TEST SECTION 1: getModuleFromQuestionId Forensic Verification
  // -------------------------------------------------------------
  console.log("\n--- Section 1: Module Mapping & Boundary Logic ---");
  // Exact CBEH blueprint ranges
  for (let i = 1; i <= 30; i++) {
    checkEqual(`Q${i} mapped to Cell Biology`, getModuleFromQuestionId(i), "Cell Biology");
  }
  for (let i = 31; i <= 54; i++) {
    checkEqual(`Q${i} mapped to Histology`, getModuleFromQuestionId(i), "Histology");
  }
  for (let i = 55; i <= 66; i++) {
    checkEqual(`Q${i} mapped to Embryology`, getModuleFromQuestionId(i), "Embryology");
  }
  for (let i = 67; i <= 70; i++) {
    checkEqual(`Q${i} mapped to Interdisciplinary`, getModuleFromQuestionId(i), "Interdisciplinary");
  }

  // Modulo cyclical behavior (Sim 2: Q71..Q140, Sim 3: Q141..Q210, etc.)
  checkEqual("Cyclical Q71 -> Cell Biology", getModuleFromQuestionId(71), "Cell Biology");
  checkEqual("Cyclical Q100 -> Histology", getModuleFromQuestionId(100), "Histology");
  checkEqual("Cyclical Q137 -> Interdisciplinary", getModuleFromQuestionId(137), "Interdisciplinary");
  checkEqual("Cyclical Q140 -> Interdisciplinary", getModuleFromQuestionId(140), "Interdisciplinary");
  checkEqual("Cyclical Q487 -> Interdisciplinary", getModuleFromQuestionId(487), "Interdisciplinary");
  checkEqual("Cyclical Q490 -> Interdisciplinary", getModuleFromQuestionId(490), "Interdisciplinary");

  // Adversarial edge cases
  checkEqual("String ID '67'", getModuleFromQuestionId("67"), "Interdisciplinary");
  checkEqual("String ID ' 70 ' with whitespace", getModuleFromQuestionId(" 70 "), "Interdisciplinary");
  checkEqual("ID 0 fallback", getModuleFromQuestionId(0), "Cell Biology");
  checkEqual("Negative ID -5 fallback", getModuleFromQuestionId(-5), "Cell Biology");
  checkEqual("NaN fallback", getModuleFromQuestionId(NaN), "Cell Biology");
  checkEqual("Null fallback", getModuleFromQuestionId(null), "Cell Biology");
  checkEqual("Undefined fallback", getModuleFromQuestionId(undefined), "Cell Biology");
  checkEqual("Garbage string 'abc' fallback", getModuleFromQuestionId("abc"), "Cell Biology");

  // -------------------------------------------------------------
  // TEST SECTION 2: cleanQuestionPromptText Stress Testing
  // -------------------------------------------------------------
  console.log("\n--- Section 2: Prompt Sanitizer & Capitalization Preservation ---");
  
  const sanitizerCases = [
    // Requirement R1 test case: Orphaned leading words
    ["70. and cellular energy is produced in the mitochondria.", "Cellular energy is produced in the mitochondria."],
    ["70. (Open Question - Max 200 words) ... and cellular energy is produced in mitochondria.", "Cellular energy is produced in mitochondria."],
    ["68. - and dopaminergic neurons in the substantia nigra...", "Dopaminergic neurons in the substantia nigra..."],
    ["69. : and the cellular pathway involved in apoptosis...", "Cellular pathway involved in apoptosis..."],
    ["and or but also & cellular metabolism is regulated by insulin.", "Cellular metabolism is regulated by insulin."],
    ["... - : and the secondary oocyte arrests in metaphase II.", "Secondary oocyte arrests in metaphase II."],
    
    // Capitalized sentence starters MUST NOT be mutilated
    ["In the context of cancer metastasis, tumor cells undergo EMT.", "In the context of cancer metastasis, tumor cells undergo EMT."],
    ["The primary function of the Golgi apparatus is protein packaging.", "The primary function of the Golgi apparatus is protein packaging."],
    ["During embryonic folding, the trilaminar disc transforms into a cylinder.", "During embryonic folding, the trilaminar disc transforms into a cylinder."],
    ["Loss of E-cadherin is a molecular hallmark of EMT.", "Loss of E-cadherin is a molecular hallmark of EMT."],
    ["According to the fluid mosaic model, membrane proteins diffuse laterally.", "According to the fluid mosaic model, membrane proteins diffuse laterally."],
    ["At what stage of meiosis does crossing over take place?", "At what stage of meiosis does crossing over take place?"],
    ["With respect to the cell cycle, p53 regulates the G1/S checkpoint.", "With respect to the cell cycle, p53 regulates the G1/S checkpoint."],
    ["For which of the following epithelial types is microvilli characteristic?", "For which of the following epithelial types is microvilli characteristic?"],
    ["To determine cell viability, trypan blue exclusion is used.", "To determine cell viability, trypan blue exclusion is used."],
    ["Under physiological conditions, resting membrane potential is negative.", "Under physiological conditions, resting membrane potential is negative."],

    // Leaked headers & markdown horizontal dividers
    ["========================================\nMODULE 4: INTERDISCIPLINARY\n67. (Multiple Choice) In the context...", "In the context..."],
    ["--- \nPART IV - INTERDISCIPLINARY (4 Questions) ---\n68. Which of the following...", "Which of the following..."],
    ["TOPIC: Histology of the Respiratory Tract\n31. What is the epithelium?", "What is the epithelium?"],
    ["[Embryology + Histology] Explain the derivatives of the neural crest.", "Explain the derivatives of the neural crest."],
    ["[Stem Cells] Describe the niche of intestinal stem cells.", "Describe the niche of intestinal stem cells."],

    // Extreme leading noise
    [": : - - • • * * and the blastocyst implants on day 6.", "Blastocyst implants on day 6."],
    ["70. ... and with in that the mitochondria produce ATP.", "Mitochondria produce ATP."],
    ["67. (Fill in the gap) and the ___ is the powerhouse of the cell.", "The ___ is the powerhouse of the cell."]
  ];

  sanitizerCases.forEach(([input, expected], idx) => {
    const actual = cleanQuestionPromptText(input);
    checkEqual(`Sanitizer Case #${idx + 1}`, actual, expected);
  });

  // Non-string / empty safety
  checkEqual("Empty string prompt", cleanQuestionPromptText(""), "");
  checkEqual("Whitespace-only prompt", cleanQuestionPromptText("   \n\t  "), "");
  checkEqual("Null prompt", cleanQuestionPromptText(null), null);
  checkEqual("Undefined prompt", cleanQuestionPromptText(undefined), undefined);

  // -------------------------------------------------------------
  // TEST SECTION 3: sanitizeQuestion & Module Immunity
  // -------------------------------------------------------------
  console.log("\n--- Section 3: sanitizeQuestion Module Immunity ---");
  
  // Test that prompt mentioning HISTOLOGY does NOT override Interdisciplinary
  const interdisciplinaryQ = {
    id: 67,
    type: "multiple-choice",
    module: "Histology", // Wrongly set initially
    question: "67. (Multiple Choice) and in HISTOLOGY and CELL BIOLOGY, describe the basement membrane."
  };
  sanitizeQuestion(interdisciplinaryQ);
  checkEqual("Q67 module immune to HISTOLOGY prompt text", interdisciplinaryQ.module, "Interdisciplinary");
  checkEqual("Q67 prompt sanitized", interdisciplinaryQ.question, "Basement membrane.");

  const histologyQ = {
    id: 35,
    type: "multiple-choice",
    module: "Cell Biology", // Wrongly set initially
    question: "35. (Multiple Choice) EMBRYOLOGY of the neural tube."
  };
  sanitizeQuestion(histologyQ);
  checkEqual("Q35 module immune to EMBRYOLOGY prompt text", histologyQ.module, "Histology");

  // -------------------------------------------------------------
  // TEST SECTION 4: Real Mock Exam Files Parsing (Sim 4 & Sim 7)
  // -------------------------------------------------------------
  console.log("\n--- Section 4: Real Exam Parser Integrity ---");

  // Read Sim 4
  const sim4Path = $(projectRoot + "/Mock exams/CBEH_simulation_4.md");
  const sim4Data = $.NSString.stringWithContentsOfFileEncodingError(sim4Path, $.NSUTF8StringEncoding, null);
  const sim4Text = ObjC.unwrap(sim4Data);
  const sim4Qs = parseMockExamText(sim4Text);

  checkEqual("Sim 4 total question count", sim4Qs.length, 70);
  
  // Check that all 70 question IDs are present
  const sim4Ids = sim4Qs.map(q => q.id);
  const sim4UniqueIds = Array.from(new Set(sim4Ids));
  checkEqual("Sim 4 has 70 unique IDs", sim4UniqueIds.length, 70);
  for (let i = 1; i <= 70; i++) {
    check(`Sim 4 contains Q${i}`, sim4Ids.indexOf(i) !== -1, `Missing Q${i}`);
  }

  // Check module breakdown
  const sim4Modules = sim4Qs.map(q => q.module);
  checkEqual("Sim 4 Cell Biology count", sim4Modules.filter(m => m === "Cell Biology").length, 30);
  checkEqual("Sim 4 Histology count", sim4Modules.filter(m => m === "Histology").length, 24);
  checkEqual("Sim 4 Embryology count", sim4Modules.filter(m => m === "Embryology").length, 12);
  checkEqual("Sim 4 Interdisciplinary count", sim4Modules.filter(m => m === "Interdisciplinary").length, 4);

  // Check Q6-Q10 in Sim 4 were not swallowed
  const q6 = sim4Qs.find(q => q.id === 6);
  const q7 = sim4Qs.find(q => q.id === 7);
  const q8 = sim4Qs.find(q => q.id === 8);
  const q9 = sim4Qs.find(q => q.id === 9);
  const q10 = sim4Qs.find(q => q.id === 10);
  check("Sim 4 Q6 is matching", q6 && q6.type === "matching");
  check("Sim 4 Q7 parsed", q7 !== undefined);
  check("Sim 4 Q8 parsed", q8 !== undefined);
  check("Sim 4 Q9 parsed", q9 !== undefined);
  check("Sim 4 Q10 parsed", q10 !== undefined);

  // Check Q67 in Sim 4
  const sim4Q67 = sim4Qs.find(q => q.id === 67);
  check("Sim 4 Q67 parsed", sim4Q67 !== undefined);
  if (sim4Q67) {
    checkEqual("Sim 4 Q67 module", sim4Q67.module, "Interdisciplinary");
    check("Sim 4 Q67 prompt starts with 'In the context of cancer metastasis'", sim4Q67.question.startsWith("In the context of cancer metastasis"), "Got: " + sim4Q67.question);
  }

  // Read Sim 7
  const sim7Path = $(projectRoot + "/Mock exams/CBEH_simulation_7.md");
  const sim7Data = $.NSString.stringWithContentsOfFileEncodingError(sim7Path, $.NSUTF8StringEncoding, null);
  const sim7Text = ObjC.unwrap(sim7Data);
  const sim7Qs = parseMockExamText(sim7Text);

  checkEqual("Sim 7 total question count", sim7Qs.length, 70);
  const sim7Ids = sim7Qs.map(q => q.id);
  checkEqual("Sim 7 has 70 unique IDs", (new Set(sim7Ids)).size, 70);
  for (let i = 1; i <= 70; i++) {
    check(`Sim 7 contains Q${i}`, sim7Ids.indexOf(i) !== -1, `Missing Q${i}`);
  }

  const sim7Modules = sim7Qs.map(q => q.module);
  checkEqual("Sim 7 Cell Biology count", sim7Modules.filter(m => m === "Cell Biology").length, 30);
  checkEqual("Sim 7 Histology count", sim7Modules.filter(m => m === "Histology").length, 24);
  checkEqual("Sim 7 Embryology count", sim7Modules.filter(m => m === "Embryology").length, 12);
  checkEqual("Sim 7 Interdisciplinary count", sim7Modules.filter(m => m === "Interdisciplinary").length, 4);

  // Check Q37 in Sim 7
  const sim7Q37 = sim7Qs.find(q => q.id === 37);
  check("Sim 7 Q37 parsed", sim7Q37 !== undefined);
  if (sim7Q37) {
    checkEqual("Sim 7 Q37 module", sim7Q37.module, "Histology");
    check("Sim 7 Q37 prompt starts with 'The periodic acid-Schiff (PAS) stain'", sim7Q37.question.startsWith("The periodic acid-Schiff (PAS) stain"), "Got: " + sim7Q37.question);
  }

  // -------------------------------------------------------------
  // TEST SECTION 5: Adversarial Synthetic Exam Inputs
  // -------------------------------------------------------------
  console.log("\n--- Section 5: Adversarial Synthetic Inputs ---");

  // OCR Header variants: HART IN0, HART IV, SECTION IV, etc.
  const ocrExamText = `
HART I: CELL BIOLOGY
1. (Multiple Choice) Which organelle synthesizes ATP?
A. Mitochondria
B. Ribosome
C. Nucleus
D. Lysosome

HART II: HISTOLOGY
31. (Multiple Choice) Connective tissue proper contains:
A. Fibroblasts
B. Chondrocytes
C. Osteocytes
D. Neurons

HART III: EMBRYOLOGY
55. (Multiple Choice) The neural tube is derived from:
A. Ectoderm
B. Mesoderm
C. Endoderm
D. Neural crest

HART IN0: INTERDISCIPLINARY
67. (Multiple Choice) Tumor microenvironment interactions involve:
A. Integrins
B. Cadherins
C. Selectins
D. Immunoglobulins

68. (True or False) Angiogenesis is required for macroscopic tumor growth.
True
False

69. (Fill in the gap) The master regulator of angiogenesis is ___.

70. (Open Question - Max 200 words) and describe the EMT process.

ANSWER KEY
1. A (Mitochondria produce ATP)
31. A (Fibroblasts are in connective tissue proper)
55. A (Ectoderm forms neural tube)
67. A (Integrins mediate ECM interaction)
68. True (Required for blood supply)
69. VEGF
70. [Rubric - OQ]: EMT involves loss of E-cadherin and gain of vimentin.
`;

  const ocrParsed = parseMockExamText(ocrExamText);
  checkEqual("OCR Exam parsed 7 questions", ocrParsed.length, 7);
  
  const ocrQ1 = ocrParsed.find(q => q.id === 1);
  const ocrQ31 = ocrParsed.find(q => q.id === 31);
  const ocrQ55 = ocrParsed.find(q => q.id === 55);
  const ocrQ67 = ocrParsed.find(q => q.id === 67);
  const ocrQ68 = ocrParsed.find(q => q.id === 68);
  const ocrQ69 = ocrParsed.find(q => q.id === 69);
  const ocrQ70 = ocrParsed.find(q => q.id === 70);

  checkEqual("OCR Q1 module", ocrQ1 ? ocrQ1.module : null, "Cell Biology");
  checkEqual("OCR Q31 module", ocrQ31 ? ocrQ31.module : null, "Histology");
  checkEqual("OCR Q55 module", ocrQ55 ? ocrQ55.module : null, "Embryology");
  checkEqual("OCR Q67 module", ocrQ67 ? ocrQ67.module : null, "Interdisciplinary");
  checkEqual("OCR Q68 module", ocrQ68 ? ocrQ68.module : null, "Interdisciplinary");
  checkEqual("OCR Q69 module", ocrQ69 ? ocrQ69.module : null, "Interdisciplinary");
  checkEqual("OCR Q70 module", ocrQ70 ? ocrQ70.module : null, "Interdisciplinary");
  checkEqual("OCR Q70 prompt clean", ocrQ70 ? ocrQ70.question : null, "Describe the EMT process.");
  checkEqual("OCR Q1 correct answer", ocrQ1 ? ocrQ1.correctAnswer : null, "A");
  checkEqual("OCR Q68 correct answer", ocrQ68 ? ocrQ68.correctAnswer : null, "True");
  checkEqual("OCR Q69 correct answer", ocrQ69 ? ocrQ69.correctAnswer : null, "VEGF");

  // Error case: Missing ANSWER KEY
  let threwNoAnswerKey = false;
  try {
    parseMockExamText("1. (Multiple Choice) No answer key here\nA. Test");
  } catch(e) {
    threwNoAnswerKey = true;
  }
  check("Throws error when ANSWER KEY is missing", threwNoAnswerKey);

  console.log("\n=================================================");
  console.log(`TOTAL FORENSIC CHECKS: ${checksPassed + checksFailed}`);
  console.log(`PASSED: ${checksPassed}`);
  console.log(`FAILED: ${checksFailed}`);
  console.log("=================================================");

  if (checksFailed > 0) {
    console.log("\nFAILURE DETAILS:\n" + failureDetails.join("\n"));
  }

  return checksFailed === 0 ? "AUDIT_CLEAN" : "INTEGRITY_VIOLATION";
}

runForensicAudit();
