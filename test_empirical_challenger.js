// Comprehensive Adversarial & Empirical Test Harness for CBEH Exam Simulator (Milestone 1)
// Executed via JavaScriptCore (osascript -l JavaScript)

function runAdversarialTests() {
  const fs = $.NSFileManager.defaultManager;
  const projectRoot = "/Users/alessandronicoletti11/Desktop/exam simulator";
  
  // Read app.js
  const appJsPath = $(projectRoot + "/app.js");
  const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
  const appJsCode = ObjC.unwrap(appJsData);

  // Set up mock DOM / browser environment
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
    log: function(msg) { $.NSFileHandle.fileHandleWithStandardOutput.writeData($(msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
    error: function(msg) { $.NSFileHandle.fileHandleWithStandardError.writeData($("ERR: " + msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
    warn: function(msg) { $.NSFileHandle.fileHandleWithStandardError.writeData($("WARN: " + msg + "\n").dataUsingEncoding($.NSUTF8StringEncoding)); }
  };

  const exports = testFn(mockWindow, mockDoc, {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = v; },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  }, mockConsole);

  const { getModuleFromQuestionId, cleanQuestionPromptText, sanitizeQuestion, sanitizeQuestionPool, parseMockExamText } = exports;

  let passed = 0;
  let failed = 0;
  const failureReports = [];

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
  mockConsole.log("        EMPIRICAL CHALLENGER 1: ADVERSARIAL TEST SUITE (MILESTONE 1)");
  mockConsole.log("================================================================================");

  // ---------------------------------------------------------------------------
  // SUITE 1: Deterministic Module ID Mapping
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 1] Deterministic getModuleFromQuestionId across standard & extended pools");
  
  // Boundary tests
  assertEqual(getModuleFromQuestionId(1), "Cell Biology", "Q1 -> Cell Biology");
  assertEqual(getModuleFromQuestionId(30), "Cell Biology", "Q30 -> Cell Biology");
  assertEqual(getModuleFromQuestionId(31), "Histology", "Q31 -> Histology");
  assertEqual(getModuleFromQuestionId(54), "Histology", "Q54 -> Histology");
  assertEqual(getModuleFromQuestionId(55), "Embryology", "Q55 -> Embryology");
  assertEqual(getModuleFromQuestionId(66), "Embryology", "Q66 -> Embryology");
  assertEqual(getModuleFromQuestionId(67), "Interdisciplinary", "Q67 -> Interdisciplinary");
  assertEqual(getModuleFromQuestionId(70), "Interdisciplinary", "Q70 -> Interdisciplinary");

  // Multi-simulation wrapping: Simulation 2 (IDs 71-140)
  assertEqual(getModuleFromQuestionId(71), "Cell Biology", "Q71 -> Cell Biology (wrapped)");
  assertEqual(getModuleFromQuestionId(100), "Cell Biology", "Q100 -> Cell Biology (wrapped)");
  assertEqual(getModuleFromQuestionId(101), "Histology", "Q101 -> Histology (wrapped)");
  assertEqual(getModuleFromQuestionId(124), "Histology", "Q124 -> Histology (wrapped)");
  assertEqual(getModuleFromQuestionId(125), "Embryology", "Q125 -> Embryology (wrapped)");
  assertEqual(getModuleFromQuestionId(136), "Embryology", "Q136 -> Embryology (wrapped)");
  assertEqual(getModuleFromQuestionId(137), "Interdisciplinary", "Q137 -> Interdisciplinary (wrapped)");
  assertEqual(getModuleFromQuestionId(140), "Interdisciplinary", "Q140 -> Interdisciplinary (wrapped)");

  // Edge cases: 0, negative, NaN, non-numeric strings
  assertEqual(getModuleFromQuestionId(0), "Cell Biology", "Q0 -> Cell Biology fallback");
  assertEqual(getModuleFromQuestionId(-5), "Cell Biology", "Q-5 -> Cell Biology fallback");
  assertEqual(getModuleFromQuestionId("invalid"), "Cell Biology", "Q'invalid' -> Cell Biology fallback");
  assertEqual(getModuleFromQuestionId(null), "Cell Biology", "Q null -> Cell Biology fallback");
  assertEqual(getModuleFromQuestionId(undefined), "Cell Biology", "Q undefined -> Cell Biology fallback");

  // ---------------------------------------------------------------------------
  // SUITE 2: Adversarial Prompt Cleaning & Sanitization (cleanQuestionPromptText)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 2] Adversarial Prompt Cleaning (cleanQuestionPromptText)");

  const adversarialPromptCases = [
    // 2.1 Capitalized Biological & Scientific terms (MUST NOT BE STRIPPED)
    { input: "In vivo assessment of hematopoietic stem cell differentiation in bone marrow.",
      expected: "In vivo assessment of hematopoietic stem cell differentiation in bone marrow.",
      desc: "Capitalized 'In vivo' sentence start preserved" },
    { input: "In vitro fertilization (IVF) protocols rely on understanding oocyte maturation.",
      expected: "In vitro fertilization (IVF) protocols rely on understanding oocyte maturation.",
      desc: "Capitalized 'In vitro' sentence start preserved" },
    { input: "The following statements describe the sliding filament mechanism in sarcomeres.",
      expected: "The following statements describe the sliding filament mechanism in sarcomeres.",
      desc: "Capitalized 'The following' sentence start preserved" },
    { input: "During gastrulation, epiblast cells migrate through the primitive streak.",
      expected: "During gastrulation, epiblast cells migrate through the primitive streak.",
      desc: "Capitalized 'During' sentence start preserved" },
    { input: "Loss of function in the tumor suppressor p53 leads to genomic instability.",
      expected: "Loss of function in the tumor suppressor p53 leads to genomic instability.",
      desc: "Capitalized 'Loss of' sentence start preserved" },
    { input: "According to the fluid mosaic model, membrane proteins diffuse laterally.",
      expected: "According to the fluid mosaic model, membrane proteins diffuse laterally.",
      desc: "Capitalized 'According to' sentence start preserved" },
    { input: "At physiological pH, amino acids exist predominantly as zwitterions.",
      expected: "At physiological pH, amino acids exist predominantly as zwitterions.",
      desc: "Capitalized 'At physiological' sentence start preserved" },
    { input: "Within the mitochondrial intermembrane space, cytochrome c accumulation triggers apoptosis.",
      expected: "Within the mitochondrial intermembrane space, cytochrome c accumulation triggers apoptosis.",
      desc: "Capitalized 'Within the' sentence start preserved" },
    { input: "Because FGFR3 signaling inhibits chondrocyte proliferation, gain-of-function causes achondroplasia.",
      expected: "Because FGFR3 signaling inhibits chondrocyte proliferation, gain-of-function causes achondroplasia.",
      desc: "Capitalized 'Because' sentence start preserved" },
    { input: "Whereas skeletal muscle fibers are multinucleated syncytia, cardiac myocytes are mononucleated.",
      expected: "Whereas skeletal muscle fibers are multinucleated syncytia, cardiac myocytes are mononucleated.",
      desc: "Capitalized 'Whereas' sentence start preserved" },
    { input: "While the primary oocyte completes meiosis I, the first polar body is extruded.",
      expected: "While the primary oocyte completes meiosis I, the first polar body is extruded.",
      desc: "Capitalized 'While the' sentence start preserved" },
    { input: "With regard to epithelial junctions, desmosomes provide mechanical attachment.",
      expected: "With regard to epithelial junctions, desmosomes provide mechanical attachment.",
      desc: "Capitalized 'With regard' sentence start preserved" },
    { input: "To which embryonic germ layer does the adrenal cortex belong?",
      expected: "To which embryonic germ layer does the adrenal cortex belong?",
      desc: "Capitalized 'To which' sentence start preserved" },
    { input: "For an enzyme with Michaelis-Menten kinetics, Km represents substrate affinity.",
      expected: "For an enzyme with Michaelis-Menten kinetics, Km represents substrate affinity.",
      desc: "Capitalized 'For an' sentence start preserved" },
    { input: "Of the following cell types, which possesses motile cilia?",
      expected: "Of the following cell types, which possesses motile cilia?",
      desc: "Capitalized 'Of the' sentence start preserved" },
    { input: "By what mechanism does the sodium-potassium ATPase maintain resting potential?",
      expected: "By what mechanism does the sodium-potassium ATPase maintain resting potential?",
      desc: "Capitalized 'By what' sentence start preserved" },
    { input: "From which pharyngeal pouch is the thymus derived?",
      expected: "From which pharyngeal pouch is the thymus derived?",
      desc: "Capitalized 'From which' sentence start preserved" },
    { input: "On the apical surface of enterocytes, microvilli increase surface area.",
      expected: "On the apical surface of enterocytes, microvilli increase surface area.",
      desc: "Capitalized 'On the' sentence start preserved" },
    { input: "That which distinguishes heterochromatin from euchromatin is high electron density.",
      expected: "That which distinguishes heterochromatin from euchromatin is high electron density.",
      desc: "Capitalized 'That which' sentence start preserved" },
    { input: "Which organelle is responsible for post-translational protein glycosylation?",
      expected: "Which organelle is responsible for post-translational protein glycosylation?",
      desc: "Capitalized 'Which organelle' sentence start preserved" },

    // 2.2 Truncated & Orphaned conjunctions and lowercase prepositions (MUST BE STRIPPED)
    { input: "70. and cellular energy production is dependent on oxidative phosphorylation.",
      expected: "Cellular energy production is dependent on oxidative phosphorylation.",
      desc: "Strip leading '70. and '" },
    { input: "68. or which of the following signaling cascades regulates stem cell self-renewal?",
      expected: "Which of the following signaling cascades regulates stem cell self-renewal?",
      desc: "Strip leading '68. or '" },
    { input: "69. but the presence of Nissl bodies in neurons indicates active protein synthesis.",
      expected: "The presence of Nissl bodies in neurons indicates active protein synthesis.",
      desc: "Strip leading '69. but '" },
    { input: "70. also the second meiotic arrest occurs at metaphase II.",
      expected: "The second meiotic arrest occurs at metaphase II.",
      desc: "Strip leading '70. also '" },
    { input: "70. as well as the blood-brain barrier which is formed by astrocyte end-feet.",
      expected: "The blood-brain barrier which is formed by astrocyte end-feet.",
      desc: "Strip leading '70. as well as '" },
    { input: "70. & mitochondrial matrix enzymes participate in the Krebs cycle.",
      expected: "Mitochondrial matrix enzymes participate in the Krebs cycle.",
      desc: "Strip leading '70. & '" },
    { input: "70. ... - : and or with in the endoplasmic reticulum calcium is stored.",
      expected: "Endoplasmic reticulum calcium is stored.",
      desc: "Iteratively strip nested punctuation and conjunction/preposition sequence" },
    { input: "70. with in for of by at on from that which whereas while because the a an lysosomal hydrolases are active at acidic pH.",
      expected: "Lysosomal hydrolases are active at acidic pH.",
      desc: "Iteratively strip long chain of lowercase-only fragment prepositions" },
    { input: "--- === ___ *** 70. and cellular ATP synthesis.",
      expected: "Cellular ATP synthesis.",
      desc: "Strip leading divider bars and conjunction" },

    // 2.3 Leaked Headers & Metadata Prefixes
    { input: "MODULE 4: INTERDISCIPLINARY 67. (Multiple Choice) In the context of cancer metastasis...",
      expected: "In the context of cancer metastasis...",
      desc: "Strip 'MODULE 4: INTERDISCIPLINARY 67. (Multiple Choice) '" },
    { input: "PART IV - INTERDISCIPLINARY (4 Questions): 67. In the context of cancer metastasis...",
      expected: "In the context of cancer metastasis...",
      desc: "Strip 'PART IV - INTERDISCIPLINARY (4 Questions): 67. '" },
    { input: "SECTION 4: INTERDISCIPLINARY\n67. In the context of cancer metastasis...",
      expected: "In the context of cancer metastasis...",
      desc: "Strip 'SECTION 4: INTERDISCIPLINARY\n67. '" },
    { input: "CELL BIOLOGY:\n1. (Multiple Choice) Which organelle is double-membraned?",
      expected: "Which organelle is double-membraned?",
      desc: "Strip 'CELL BIOLOGY:\n1. (Multiple Choice) '" },
    { input: "HISTOLOGY: 31. (Multiple Choice) Which epithelium lines the trachea?",
      expected: "Which epithelium lines the trachea?",
      desc: "Strip 'HISTOLOGY: 31. (Multiple Choice) '" },
    { input: "EMBRYOLOGY: 55. (Multiple Choice) Which structure gives rise to the notochord?",
      expected: "Which structure gives rise to the notochord?",
      desc: "Strip 'EMBRYOLOGY: 55. (Multiple Choice) '" },
    { input: "TOPIC: Signal Transduction\n12. Describe G-protein coupled receptor activation.",
      expected: "Describe G-protein coupled receptor activation.",
      desc: "Strip 'TOPIC: ...\n12. '" },
    { input: "[Embryology + Histology] Explain neural crest cell migration into branchial arches.",
      expected: "Explain neural crest cell migration into branchial arches.",
      desc: "Strip '[Embryology + Histology] '" },
    { input: "[Stem Cells - Pluripotency] 68. and embryonic stem cells are derived from the ICM.",
      expected: "Embryonic stem cells are derived from the ICM.",
      desc: "Strip bracket tag and '68. and '" },
    { input: "70. (Open Question - Max 200 words): Describe mitochondrial uncoupling in brown adipose tissue.",
      expected: "Describe mitochondrial uncoupling in brown adipose tissue.",
      desc: "Strip '70. (Open Question - Max 200 words): '" },
    { input: "70. (Fill in the gap): Microtubules are composed of polymers of _____ and beta-tubulin.",
      expected: "Microtubules are composed of polymers of _____ and beta-tubulin.",
      desc: "Strip '70. (Fill in the gap): '" },
    { input: "70. (Matching): Match each cytoskeleton component with its diameter.",
      expected: "Match each cytoskeleton component with its diameter.",
      desc: "Strip '70. (Matching): '" },
    { input: "70. (True or False Cluster): Evaluate the following statements regarding meiosis.",
      expected: "Evaluate the following statements regarding meiosis.",
      desc: "Strip '70. (True or False Cluster): '" },
    { input: "### 70. (Multiple Choice) Which of the following is correct?",
      expected: "Which of the following is correct?",
      desc: "Strip markdown heading '### 70. (Multiple Choice) '" },

    // 2.4 Pathological & Extreme inputs
    { input: "", expected: "", desc: "Empty string -> empty string" },
    { input: "   \n\t  ", expected: "", desc: "Whitespace string -> empty string" },
    { input: "--- ... ::: === *** ###", expected: "", desc: "Only punctuation -> empty string" },
    { input: "and and and and and", expected: "", desc: "Only conjunctions -> empty string" },
    { input: "in with to for of by at on", expected: "", desc: "Only lowercase prepositions -> empty string" },
    { input: "a", expected: "A", desc: "Single character -> capitalized" },
    { input: "   multiple   spaces    between    words   ", expected: "Multiple spaces between words", desc: "Whitespace normalization" }
  ];

  adversarialPromptCases.forEach((tc, idx) => {
    const actual = cleanQuestionPromptText(tc.input);
    assertEqual(actual, tc.expected, `Adversarial Prompt Test #${idx + 1}: ${tc.desc}`);
  });

  // Test non-string resilience
  assertEqual(cleanQuestionPromptText(null), null, "Non-string null returned unchanged");
  assertEqual(cleanQuestionPromptText(undefined), undefined, "Non-string undefined returned unchanged");
  assertEqual(cleanQuestionPromptText(123), 123, "Non-string number returned unchanged");

  // ---------------------------------------------------------------------------
  // SUITE 3: Adversarial sanitizeQuestion & Keyword Immunity
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 3] Adversarial sanitizeQuestion & Prompt Keyword Override Immunity");

  // 3.1 Interdisciplinary questions mentioning Histology / Embryology / Cell Biology in prompt
  const interdisciplinaryTestCases = [
    { id: 67, question: "67. In the context of cancer metastasis, which histology stain confirms epithelial origin?", initialMod: "Histology" },
    { id: 68, question: "68. During embryology, neural crest migration coordinates with histology of branchial arches.", initialMod: "Embryology" },
    { id: 69, question: "69. Cell biology mechanisms in embryological organogenesis involve Wnt signaling.", initialMod: "Cell Biology" },
    { id: 70, question: "70. and cellular energy production during embryology tissue differentiation.", initialMod: "Histology" }
  ];

  interdisciplinaryTestCases.forEach((item, idx) => {
    const q = { id: item.id, question: item.question, module: item.initialMod };
    sanitizeQuestion(q);
    assertEqual(q.module, "Interdisciplinary", `Q${item.id} retained Interdisciplinary module despite mentioning other subjects`);
    assert(!q.question.startsWith("67.") && !q.question.startsWith("68.") && !q.question.startsWith("69.") && !q.question.startsWith("70."), `Q${item.id} stripped leading question number`);
    assert(!q.question.startsWith("and "), `Q${item.id} stripped leading orphaned conjunction`);
  });

  // 3.2 Cell Biology mentioning Histology / Embryology in prompt
  const cbTestQ = { id: 5, question: "5. (Multiple Choice) In cell biology, how does histology fixation affect chromatin?", module: "Cell Biology" };
  sanitizeQuestion(cbTestQ);
  assertEqual(cbTestQ.module, "Cell Biology", "Q5 stays Cell Biology despite mentioning histology");

  // 3.3 Histology mentioning Cell Biology in prompt
  const histTestQ = { id: 37, question: "37. The periodic acid-Schiff (PAS) stain is widely used in histology to detect cell biology glycogen deposits.", module: "Histology" };
  sanitizeQuestion(histTestQ);
  assertEqual(histTestQ.module, "Histology", "Q37 stays Histology despite mentioning cell biology");

  // 3.4 True-False Cluster conversion and option prefix cleaning
  const clusterQ = {
    id: 15,
    type: "multiple-choice",
    options: ["A. True", "B. False", "C. True", "D. False"],
    question: "Evaluate the statements regarding mitochondria."
  };
  sanitizeQuestion(clusterQ);
  assertEqual(clusterQ.type, "true-false-cluster", "Cluster question detected and converted");
  assert(Array.isArray(clusterQ.statements) && clusterQ.statements.length === 4, "Cluster statements array created with 4 items");
  assert(clusterQ.options === undefined, "Old options property deleted on cluster conversion");

  // 3.5 Option prefix cleaning
  const mcQ = {
    id: 20,
    type: "multiple-choice",
    options: ["ASertoli cells", "BLeydig cells", "CSpermatogonia", "DSpermatids"],
    question: "Which cell type forms the blood-testis barrier?"
  };
  sanitizeQuestion(mcQ);
  assertEqual(mcQ.options[0], "Sertoli cells", "Option prefix 'ASertoli' cleaned to 'Sertoli cells'");
  assertEqual(mcQ.options[1], "Leydig cells", "Option prefix 'BLeydig' cleaned to 'Leydig cells'");

  // ---------------------------------------------------------------------------
  // SUITE 4: Parser Stress Testing on Tricky Layouts & Edge Cases
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 4] Parser Stress Testing (parseMockExamText)");

  // 4.1 Mock Exam with unanchored headers in prompts
  const trickyExamText = `
MODULE 1: CELL BIOLOGY
1. (Multiple Choice) Which organelle is known as the powerhouse of the cell?
A. Nucleus
B. Mitochondria
C. Ribosome
D. Lysosome

2. (Multiple Choice) In histology and cell biology, which junction provides intercellular communication?
A. Tight junction
B. Gap junction
C. Desmosome
D. Hemidesmosome

MODULE 2: HISTOLOGY
31. (Multiple Choice) The periodic acid-Schiff (PAS) stain is widely used in histology to detect basement membranes.
A. True
B. False
C. Sometimes
D. Never

MODULE 3: EMBRYOLOGY
55. (Multiple Choice) During embryology, which germ layer gives rise to the neural tube?
A. Ectoderm
B. Mesoderm
C. Endoderm
D. Neural crest

MODULE 4: INTERDISCIPLINARY
67. (Multiple Choice) In the context of cancer metastasis, which cell biology pathway is often hyperactivated in histology tumor specimens?
A. MAPK
B. PI3K
C. Wnt
D. All of the above

68. (Matching) Match the following concepts:
1) Mitochondria
2) Ribosome
3) Lysosome
4) Golgi
A. ATP synthesis
B. Translation
C. Degradation
D. Packaging

69. (True or False Cluster) Evaluate the following statements:
A. Meiosis I is a reductional division.
B. Meiosis II separates homologous chromosomes.
C. Polar bodies are diploid.
D. Spermatogenesis yields 4 haploid gametes.

70. (Open Question - Max 200 words) Describe the role of epithelial-mesenchymal transition in embryonic development and cancer.

ANSWER KEY
1. B (Powerhouse)
2. B (Gap junction)
31. A (PAS stain)
55. A (Ectoderm)
67. D (All of the above)
68. 1-A, 2-B, 3-C, 4-D
69.
A) True
B) False
C) False
D) True
70. Open Concept: EMT is crucial for gastrulation and metastasis.
`;

  const parsedTricky = parseMockExamText(trickyExamText);
  assertEqual(parsedTricky.length, 8, "Tricky exam parsed all 8 questions without dropping any");

  const trickyQ2 = parsedTricky.find(q => q.id === 2);
  assert(trickyQ2 !== undefined, "Q2 not dropped by 'histology' in prompt");
  if (trickyQ2) assertEqual(trickyQ2.module, "Cell Biology", "Q2 module is Cell Biology");

  const trickyQ31 = parsedTricky.find(q => q.id === 31);
  assert(trickyQ31 !== undefined, "Q31 not dropped by 'histology' in prompt");
  if (trickyQ31) assertEqual(trickyQ31.module, "Histology", "Q31 module is Histology");

  const trickyQ55 = parsedTricky.find(q => q.id === 55);
  assert(trickyQ55 !== undefined, "Q55 not dropped by 'embryology' in prompt");
  if (trickyQ55) assertEqual(trickyQ55.module, "Embryology", "Q55 module is Embryology");

  const trickyQ67 = parsedTricky.find(q => q.id === 67);
  assert(trickyQ67 !== undefined, "Q67 not dropped by 'cell biology' / 'histology' in prompt");
  if (trickyQ67) {
    assertEqual(trickyQ67.module, "Interdisciplinary", "Q67 module is Interdisciplinary");
    assertEqual(trickyQ67.correctAnswer, "D", "Q67 correct answer parsed");
  }

  const trickyQ68 = parsedTricky.find(q => q.id === 68);
  assert(trickyQ68 !== undefined && trickyQ68.type === "matching", "Q68 matching parsed");
  if (trickyQ68) {
    assertEqual(trickyQ68.leftItems.length, 4, "Q68 has 4 left items");
    assertEqual(trickyQ68.rightItems.length, 4, "Q68 has 4 right items");
    assert(trickyQ68.correctAnswers !== null, "Q68 matching pairs parsed");
  }

  const trickyQ69 = parsedTricky.find(q => q.id === 69);
  assert(trickyQ69 !== undefined && trickyQ69.type === "true-false-cluster", "Q69 cluster parsed");
  if (trickyQ69) {
    assertEqual(trickyQ69.statements.length, 4, "Q69 has 4 statements");
    assertEqual(trickyQ69.statements[0].correctAnswer, "True", "Q69 stmt A is True");
    assertEqual(trickyQ69.statements[1].correctAnswer, "False", "Q69 stmt B is False");
  }

  const trickyQ70 = parsedTricky.find(q => q.id === 70);
  assert(trickyQ70 !== undefined && trickyQ70.type === "open", "Q70 open question parsed");
  if (trickyQ70) {
    assert(trickyQ70.modelAnswer.includes("EMT is crucial for gastrulation"), "Q70 model answer parsed");
  }

  // 4.2 Error handling when ANSWER KEY is missing
  let answerKeyErrorThrown = false;
  try {
    parseMockExamText("1. (Multiple Choice) Test prompt\nA. Opt1\nB. Opt2");
  } catch(e) {
    answerKeyErrorThrown = true;
  }
  assert(answerKeyErrorThrown, "Throws error when ANSWER KEY is missing");

  // ---------------------------------------------------------------------------
  // SUITE 5: Full Mock Exam Parsing (Markdown Simulations 4 & 7)
  // ---------------------------------------------------------------------------
  mockConsole.log("\n[SUITE 5] Parsing Real Markdown Mock Exams (Simulation 4 & 7)");

  const mdFiles = ["CBEH_simulation_4.md", "CBEH_simulation_7.md"];
  mdFiles.forEach(fileName => {
    const filePath = $(projectRoot + "/Mock exams/" + fileName);
    const fileData = $.NSString.stringWithContentsOfFileEncodingError(filePath, $.NSUTF8StringEncoding, null);
    const fileText = ObjC.unwrap(fileData);
    const questions = parseMockExamText(fileText);

    assertEqual(questions.length, 70, `${fileName} parses exactly 70 questions`);
    
    // Check module counts
    const cb = questions.filter(q => q.module === "Cell Biology").length;
    const hist = questions.filter(q => q.module === "Histology").length;
    const emb = questions.filter(q => q.module === "Embryology").length;
    const ind = questions.filter(q => q.module === "Interdisciplinary").length;

    assertEqual(cb, 30, `${fileName}: 30 Cell Biology questions (IDs 1-30)`);
    assertEqual(hist, 24, `${fileName}: 24 Histology questions (IDs 31-54)`);
    assertEqual(emb, 12, `${fileName}: 12 Embryology questions (IDs 55-66)`);
    assertEqual(ind, 4, `${fileName}: 4 Interdisciplinary questions (IDs 67-70)`);

    // Verify all IDs 1-70 present and contiguous
    for (let id = 1; id <= 70; id++) {
      const q = questions.find(item => item.id === id);
      assert(q !== undefined, `${fileName}: Question ID ${id} exists`);
      if (q) {
        // Verify prompt is not empty and has no orphaned starting conjunctions
        assert(q.question && q.question.trim().length > 0, `${fileName} Q${id} prompt is not empty`);
        assert(!/^(?:and|or|but|also|as well as|&)\s+/i.test(q.question), `${fileName} Q${id} has no leading orphaned conjunctions`);
      }
    }

    // Verify Interdisciplinary questions 67-70
    [67, 68, 69, 70].forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        assertEqual(q.module, "Interdisciplinary", `${fileName} Q${id} module is Interdisciplinary`);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Summary & Verdict
  // ---------------------------------------------------------------------------
  mockConsole.log("\n================================================================================");
  mockConsole.log(`TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    mockConsole.log("FAILED TESTS:");
    failureReports.forEach((f, i) => {
      mockConsole.log(`  ${i + 1}. ${f.message}: ${f.details}`);
    });
  }
  mockConsole.log("================================================================================");

  return failed === 0 ? "SUCCESS" : "FAILURE";
}

runAdversarialTests();
