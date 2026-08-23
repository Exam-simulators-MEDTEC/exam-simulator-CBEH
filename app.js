// Immediately restore theme on script load to prevent flashing of unstyled content (FOUC)
const savedTheme = localStorage.getItem("cbeh_theme");
if (savedTheme === "light") {
  document.body.classList.add("light-theme");
}

document.addEventListener("DOMContentLoaded", () => {
  // Theme Switcher Logic
  const themeBtn = document.getElementById("theme-switcher-btn");
  const iconSun = document.getElementById("theme-icon-sun");
  const iconMoon = document.getElementById("theme-icon-moon");

  function updateThemeIcons() {
    if (document.body.classList.contains("light-theme")) {
      iconSun.style.display = "block";
      iconMoon.style.display = "none";
    } else {
      iconSun.style.display = "none";
      iconMoon.style.display = "block";
    }
  }

  if (themeBtn) {
    updateThemeIcons();
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      localStorage.setItem("cbeh_theme", isLight ? "light" : "dark");
      updateThemeIcons();
    });
  }

  // Check if questions database is loaded
  if (!window.CBEH_QUESTIONS) {
    console.error("Questions database not found!");
    return;
  }

  // Set up PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  // Application State
  const state = {
    questions: [], // Currently active exam questions (dynamically selected)
    questionsPool: [], // Master question pool (starts empty by default)
    uploadedSimulationsCount: 0, // Compiled exams count
    currentQuestionIndex: 0,
    answers: {}, // Maps question ID to user response
    flags: {}, // Maps question ID to boolean
    bookmarks: JSON.parse(localStorage.getItem("cbeh_bookmarks")) || [],
    history: JSON.parse(localStorage.getItem("cbeh_history")) || [],
    timeLeft: 90 * 60, // 90 minutes in seconds
    timerInterval: null,
    selfGradedScores: {}, // Maps open question ID to 1 or 0 (defaults to 0)
    isExamSubmitted: false
  };

  let aiGenerationAbortController = null;

  // DOM Elements
  const screenWelcome = document.getElementById("screen-welcome");
  const screenExam = document.getElementById("screen-exam");
  const screenResults = document.getElementById("screen-results");
  
  const btnStartExam = document.getElementById("btn-start-exam");
  const btnSubmitExam = document.getElementById("btn-submit-exam");
  const btnRestartExam = document.getElementById("btn-restart-exam");
  const btnHomeExam = document.getElementById("btn-home-exam");
  const btnHomeResults = document.getElementById("btn-home-results");
  
  const btnPrevQuestion = document.getElementById("btn-prev-question");
  const btnNextQuestion = document.getElementById("btn-next-question");
  
  const questionIndexCounter = document.getElementById("question-index-counter");
  const questionModuleBadge = document.getElementById("question-module-badge");
  const examTimer = document.getElementById("exam-timer");
  const timerBox = document.getElementById("timer-box");
  const questionCard = document.getElementById("question-card");
  const questionText = document.getElementById("question-text");
  const answerInputsArea = document.getElementById("answer-inputs-area");
  
  const flagCheckbox = document.getElementById("flag-checkbox");
  const flagLabelContainer = document.getElementById("flag-label-container");
  const btnBookmarkQuestion = document.getElementById("btn-bookmark-question");
  const bookmarkIconSvg = document.getElementById("bookmark-icon-svg");
  const questionsGridContainer = document.getElementById("questions-grid-container");
  
  // PDF upload elements
  const uploadDropzone = document.getElementById("upload-dropzone");
  const pdfFileInput = document.getElementById("pdf-file-input");
  const poolStatusCount = document.getElementById("pool-status-count");
  const poolStatusSims = document.getElementById("pool-status-sims");
  const uploadLog = document.getElementById("upload-log");
  
  // Results panel elements
  const resultStatusBadge = document.getElementById("result-status-badge");
  const resultScoreSummary = document.getElementById("result-score-summary");
  
  const scoreCellBio = document.getElementById("score-cellbio");
  const statusCellBio = document.getElementById("status-cellbio");
  const cardCellBio = document.getElementById("card-result-cellbio");
  
  const scoreHistology = document.getElementById("score-histology");
  const statusHistology = document.getElementById("status-histology");
  const cardHistology = document.getElementById("card-result-histology");
  
  const scoreEmbryo = document.getElementById("score-embryo");
  const statusEmbryo = document.getElementById("status-embryo");
  const cardEmbryo = document.getElementById("card-result-embryo");
  
  const scoreInterdisciplinary = document.getElementById("score-interdisciplinary");
  const statusInterdisciplinary = document.getElementById("status-interdisciplinary");
  const cardInterdisciplinary = document.getElementById("card-result-interdisciplinary");
  
  const tabBtnGrading = document.getElementById("tab-btn-grading");
  const tabBtnReview = document.getElementById("tab-btn-review");
  const tabContentGrading = document.getElementById("tab-content-grading");
  const tabContentReview = document.getElementById("tab-content-review");
  
  const openQuestionsGradingList = document.getElementById("open-questions-grading-list");
  const autoQuestionsReviewList = document.getElementById("auto-questions-review-list");

  // Keyboard Navigation Helpers
  document.addEventListener("keydown", (e) => {
    // Only navigate with keyboard if on the exam screen
    if (screenExam.classList.contains("active")) {
      // Do not trigger navigation if user is writing in the open text box
      if (document.activeElement && document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrevQuestion();
      } else if (e.key === "ArrowRight") {
        handleNextQuestion();
      }
    }
  });

  // WELCOME TABS SWITCHING
  const welcomeTabSettings = document.getElementById("welcome-tab-settings");
  const welcomeTabAi = document.getElementById("welcome-tab-ai");
  const welcomeTabBookmarks = document.getElementById("welcome-tab-bookmarks");
  const welcomeTabAnalytics = document.getElementById("welcome-tab-analytics");
  const welcomePanelSettings = document.getElementById("welcome-panel-settings");
  const welcomePanelAi = document.getElementById("welcome-panel-ai");
  const welcomePanelBookmarks = document.getElementById("welcome-panel-bookmarks");
  const welcomePanelAnalytics = document.getElementById("welcome-panel-analytics");
  
  const allWelcomeTabs = [welcomeTabSettings, welcomeTabAi, welcomeTabBookmarks, welcomeTabAnalytics].filter(Boolean);
  const allWelcomePanels = [welcomePanelSettings, welcomePanelAi, welcomePanelBookmarks, welcomePanelAnalytics].filter(Boolean);

  function switchWelcomeTab(activeTab, activePanel) {
    allWelcomeTabs.forEach(t => t.classList.remove("active"));
    allWelcomePanels.forEach(p => p.classList.remove("active"));
    if (activeTab) activeTab.classList.add("active");
    if (activePanel) activePanel.classList.add("active");
    
    if (activeTab === welcomeTabBookmarks) {
      renderBookmarksList();
    } else if (activeTab === welcomeTabAnalytics) {
      updateAnalyticsUI();
    }
  }

  if (welcomeTabSettings) welcomeTabSettings.addEventListener("click", () => switchWelcomeTab(welcomeTabSettings, welcomePanelSettings));
  if (welcomeTabAi) welcomeTabAi.addEventListener("click", () => switchWelcomeTab(welcomeTabAi, welcomePanelAi));
  if (welcomeTabBookmarks) welcomeTabBookmarks.addEventListener("click", () => switchWelcomeTab(welcomeTabBookmarks, welcomePanelBookmarks));
  if (welcomeTabAnalytics) welcomeTabAnalytics.addEventListener("click", () => switchWelcomeTab(welcomeTabAnalytics, welcomePanelAnalytics));

  function renderBookmarksList() {
    const listContainer = document.getElementById("bookmarks-list");
    const btnStartQuiz = document.getElementById("btn-start-bookmarks-quiz");
    if (!listContainer || !btnStartQuiz) return;

    if (welcomeTabBookmarks) {
      welcomeTabBookmarks.textContent = `Bookmarks (${state.bookmarks.length})`;
    }
    
    if (state.bookmarks.length === 0) {
      listContainer.innerHTML = '<p class="no-bookmarks-msg" style="text-align: center; padding: 2rem 0; color: var(--text-muted);">You have no bookmarked questions. Click the star icon during an exam to save questions here for review.</p>';
      btnStartQuiz.disabled = true;
      return;
    }
    
    btnStartQuiz.disabled = false;
    listContainer.innerHTML = "";
    
    state.bookmarks.forEach((q, idx) => {
      const el = document.createElement("div");
      el.className = "bookmark-item";
      el.style.cssText = "padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;";
      
      el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-primary); text-transform: uppercase;">${q.module} &bull; ${q.type.replace("-", " ")}</div>
          <button class="btn-remove-bookmark" data-index="${idx}" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.75rem; text-decoration: underline; padding: 0;">Remove</button>
        </div>
        <div style="font-size: 0.95rem; color: #fff; line-height: 1.4;">${q.question}</div>
      `;
      listContainer.appendChild(el);
    });

    listContainer.querySelectorAll('.btn-remove-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        state.bookmarks.splice(index, 1);
        localStorage.setItem("cbeh_bookmarks", JSON.stringify(state.bookmarks));
        renderBookmarksList();
      });
    });
  }

  // Initialize Bookmarks Quiz Button
  const btnStartBookmarksQuiz = document.getElementById("btn-start-bookmarks-quiz");
  if (btnStartBookmarksQuiz) {
    btnStartBookmarksQuiz.addEventListener("click", () => {
      if (state.bookmarks.length === 0) return;
      
      // Clone bookmarked questions, shuffle them, and assign display IDs
      const bookmarkedQuestions = JSON.parse(JSON.stringify(state.bookmarks));
      shuffleArray(bookmarkedQuestions);
      bookmarkedQuestions.forEach((q, i) => q.id = i + 1);
      
      startExamWithQuestions(bookmarkedQuestions);
    });
  }

  // Set initial bookmarks count badge text
  if (welcomeTabBookmarks) {
    welcomeTabBookmarks.textContent = `Bookmarks (${state.bookmarks.length})`;
  }

  // API KEY PASSWORD SHOW/HIDE
  const aiApiKey = document.getElementById("ai-api-key");
  const btnToggleApiKey = document.getElementById("btn-toggle-api-key");
  
  if (aiApiKey && btnToggleApiKey) {
    // Load saved API Key on startup if it exists
    if (localStorage.getItem("cbeh_gemini_api_key")) {
      aiApiKey.value = localStorage.getItem("cbeh_gemini_api_key");
    }
    
    btnToggleApiKey.addEventListener("click", () => {
      if (aiApiKey.type === "password") {
        aiApiKey.type = "text";
        btnToggleApiKey.querySelector("svg").style.color = "var(--color-primary)";
      } else {
        aiApiKey.type = "password";
        btnToggleApiKey.querySelector("svg").style.color = "var(--text-muted)";
      }
    });
  }

  // GENERATE AI SIMULATION EVENT
  const btnGenerateAi = document.getElementById("btn-generate-ai");
  const aiLoadingOverlay = document.getElementById("ai-loading-overlay");
  const aiLoadingStatus = document.getElementById("ai-loading-status");
  const aiProgressBar = document.getElementById("ai-progress-bar");
  const aiGenType = document.getElementById("ai-gen-type");
  const aiFocusTopic = document.getElementById("ai-focus-topic");
  const btnCancelAiGeneration = document.getElementById("btn-cancel-ai-generation");
  
  if (btnCancelAiGeneration) {
    btnCancelAiGeneration.addEventListener("click", () => {
      if (aiGenerationAbortController) {
        aiGenerationAbortController.abort();
        aiGenerationAbortController = null;
        aiLoadingStatus.textContent = "Cancelling generation...";
      }
    });
  }
  
  if (btnGenerateAi) {
    btnGenerateAi.addEventListener("click", async () => {
      const key = aiApiKey.value.trim();
      if (!key) {
        alert("Please enter a valid Gemini API Key.");
        return;
      }
      
      // Save key in local storage
      localStorage.setItem("cbeh_gemini_api_key", key);
      
      const genType = aiGenType.value; // mini, medium, full
      const focusTopic = aiFocusTopic.value.trim();
      
      // Open loader screen inside panel and instantiate abort controller
      aiGenerationAbortController = new AbortController();
      aiLoadingOverlay.classList.add("active");
      aiProgressBar.style.width = "0%";
      
      try {
        let questions = [];
        if (genType === "mini") {
          aiLoadingStatus.textContent = "Generating 10-question quiz...";
          aiProgressBar.style.width = "20%";
          questions = await generateAiQuestionsBatch(key, 10, focusTopic, 1);
          aiProgressBar.style.width = "80%";
          state.questionsPool.push(...questions);
          state.uploadedSimulationsCount++;
          addLogEntry(`AI successfully generated 10 questions on: ${focusTopic || "General Syllabus"}`);
        } else if (genType === "medium") {
          aiLoadingStatus.textContent = "Generating 35-question exam...";
          aiProgressBar.style.width = "20%";
          questions = await generateAiQuestionsBatch(key, 35, focusTopic, 1);
          aiProgressBar.style.width = "80%";
          state.questionsPool.push(...questions);
          state.uploadedSimulationsCount++;
          addLogEntry(`AI successfully generated 35 questions on: ${focusTopic || "General Syllabus"}`);
        } else if (genType === "full") {
          aiLoadingStatus.textContent = "Generating Full Exam - Batch 1 of 2 (35 questions)...";
          aiProgressBar.style.width = "10%";
          const batch1 = await generateAiQuestionsBatch(key, 35, focusTopic, 1);
          
          // Check for abort between batches
          if (!aiGenerationAbortController) return;
          
          aiProgressBar.style.width = "50%";
          aiLoadingStatus.textContent = "Generating Full Exam - Batch 2 of 2 (35 questions)...";
          const batch2 = await generateAiQuestionsBatch(key, 35, focusTopic, 2);
          aiProgressBar.style.width = "90%";
          
          questions = [...batch1, ...batch2];
          state.questionsPool.push(...questions);
          state.uploadedSimulationsCount++;
          addLogEntry(`AI successfully generated 70 questions on: ${focusTopic || "General Syllabus"}`);
        }
        
        // Tag with AI source description and clean display IDs
        const aiSource = `AI Generated: ${focusTopic || "General Syllabus"} (${new Date().toLocaleDateString()})`;
        questions.forEach((q, idx) => {
          q.id = idx + 1;
          q.sourceFilename = aiSource;
        });

        // Recalculate stats and save
        updateUploadedSimulationsCount();
        saveAppState();
        updateSimulationsManagerUI();
        
        // Update welcome screen stats UI
        poolStatusCount.textContent = state.questionsPool.length;
        poolStatusSims.textContent = state.uploadedSimulationsCount;
        
        aiProgressBar.style.width = "100%";
        aiLoadingStatus.textContent = "Success! Launching simulation...";
        setTimeout(() => {
          aiLoadingOverlay.classList.remove("active");
          // Directly start the exam with these AI generated questions!
          startExamWithQuestions(questions);
        }, 1000);
        
      } catch (err) {
        if (err.name === "AbortError" || err.message === "The user aborted a request.") {
          console.log("AI Generation aborted by user.");
          addLogEntry("AI Generation cancelled by user.");
        } else {
          console.error(err);
          alert(`AI Generation Failed: ${err.message}`);
          addLogEntry(`AI Generation Error: ${err.message}`, true);
        }
        aiLoadingOverlay.classList.remove("active");
      } finally {
        aiGenerationAbortController = null;
      }
    });
  }

  const btnLoadDefault = document.getElementById("btn-load-default");
  if (btnLoadDefault) {
    btnLoadDefault.addEventListener("click", () => {
      const alreadyLoaded = state.questionsPool.some(q => (q.sourceFilename || "Official Syllabus Mock Exam") === "Official Syllabus Mock Exam");
      if (alreadyLoaded) {
        alert("The default mock exam is already loaded in the pool!");
        return;
      }
      
      const defaultQs = JSON.parse(JSON.stringify(window.CBEH_QUESTIONS));
      defaultQs.forEach(q => {
        q.sourceFilename = "Official Syllabus Mock Exam";
      });
      
      state.questionsPool.push(...defaultQs);
      
      updateUploadedSimulationsCount();
      saveAppState();
      updateSimulationsManagerUI();
      
      poolStatusCount.textContent = state.questionsPool.length;
      poolStatusSims.textContent = state.uploadedSimulationsCount;
      
      addLogEntry("Loaded default official mock exam (70 questions).");
    });
  }

  const btnResetPool = document.getElementById("btn-reset-pool");
  if (btnResetPool) {
    btnResetPool.addEventListener("click", () => {
      const confirmReset = confirm("Are you sure you want to clear all simulation files from the pool?\nThis will permanently delete all uploaded files and AI generated questions.");
      if (confirmReset) {
        state.questionsPool = [];
        state.uploadedSimulationsCount = 0;
        
        // If there is an active exam, return home
        resetExam();
        
        // Save and update UI
        updateUploadedSimulationsCount();
        saveAppState();
        updateSimulationsManagerUI();
        
        poolStatusCount.textContent = state.questionsPool.length;
        poolStatusSims.textContent = state.uploadedSimulationsCount;
        
        addLogEntry("Cleared all simulations. Question pool is empty.");
      }
    });
  }

  // START SIMULATION
  btnStartExam.addEventListener("click", () => {
    const modeSelect = document.getElementById("practice-mode-select");
    const mode = modeSelect ? modeSelect.value : "standard";
    
    if (mode === "standard") {
      startExam();
    } else {
      let targetModule = "";
      if (mode === "cell-biology") targetModule = "Cell Biology";
      else if (mode === "histology") targetModule = "Histology";
      else if (mode === "embryology") targetModule = "Embryology";
      else if (mode === "interdisciplinary") targetModule = "Interdisciplinary";
      
      const filtered = state.questionsPool.filter(q => q.module === targetModule);
      if (filtered.length === 0) {
        alert(`No questions found in the pool for module "${targetModule}". Please upload a simulation or generate AI questions for this topic first!`);
        return;
      }
      
      // Clone and shuffle options for all questions in this module focus
      const clonedFocusList = filtered.map(q => cloneAndShuffleQuestionOptions(q));
      shuffleArray(clonedFocusList);
      
      // Slice to exactly 20 questions (or all if not enough, e.g. interdisciplinary)
      const selectedQuestions = clonedFocusList.slice(0, Math.min(20, clonedFocusList.length));
      
      // Assign consecutive display IDs (1 to N)
      selectedQuestions.forEach((q, idx) => {
        q.id = idx + 1;
      });
      
      // Launch custom simulation focused on this module (with exactly 20 questions)
      startExamWithQuestions(selectedQuestions);
    }
  });

  // NAVIGATION BUTTONS
  btnPrevQuestion.addEventListener("click", handlePrevQuestion);
  btnNextQuestion.addEventListener("click", handleNextQuestion);

  // FLAG CHANGE EVENT
  flagCheckbox.addEventListener("change", (e) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    state.flags[currentQuestion.id] = e.target.checked;
    updateNavigationGrid();
    saveAppState();
  });

  // BOOKMARK EVENT
  if (btnBookmarkQuestion) {
    btnBookmarkQuestion.addEventListener("click", () => {
      const q = state.questions[state.currentQuestionIndex];
      const bookmarkIndex = state.bookmarks.findIndex(b => b.question === q.question);
      
      if (bookmarkIndex >= 0) {
        state.bookmarks.splice(bookmarkIndex, 1);
        bookmarkIconSvg.setAttribute("fill", "none");
        bookmarkIconSvg.style.color = "currentColor";
      } else {
        state.bookmarks.push(JSON.parse(JSON.stringify(q)));
        bookmarkIconSvg.setAttribute("fill", "var(--color-primary)");
        bookmarkIconSvg.style.color = "var(--color-primary)";
      }
      
      localStorage.setItem("cbeh_bookmarks", JSON.stringify(state.bookmarks));
      
      if (welcomeTabBookmarks) {
        welcomeTabBookmarks.textContent = `Bookmarks (${state.bookmarks.length})`;
      }
      if (typeof renderBookmarksList === "function") {
        renderBookmarksList();
      }
    });
  }

  // SUBMIT EXAM
  btnSubmitExam.addEventListener("click", () => {
    const unansweredCount = state.questions.length - Object.keys(state.answers).length;
    let message = "Are you sure you want to submit the exam?";
    if (unansweredCount > 0) {
      message += ` You have ${unansweredCount} unanswered questions. Unanswered questions will be scored as 0 points.`;
    }
    
    if (confirm(message)) {
      submitExam();
    }
  });

  // RESTART / HOME EXAM
  btnRestartExam.addEventListener("click", () => {
    resetExam();
  });

  if (btnHomeExam) {
    btnHomeExam.addEventListener("click", () => {
      if (confirm("Are you sure you want to exit the exam and return to the main menu? Your progress on this simulation will be lost.")) {
        resetExam();
      }
    });
  }

  if (btnHomeResults) {
    btnHomeResults.addEventListener("click", () => {
      resetExam();
    });
  }

  // RESULTS TABS
  tabBtnGrading.addEventListener("click", () => {
    tabBtnGrading.classList.add("active");
    tabBtnReview.classList.remove("active");
    tabContentGrading.classList.add("active");
    tabContentReview.classList.remove("active");
  });

  tabBtnReview.addEventListener("click", () => {
    tabBtnReview.classList.add("active");
    tabBtnGrading.classList.remove("active");
    tabContentReview.classList.add("active");
    tabContentGrading.classList.remove("active");
  });

  // CORE FUNCTIONS
  function startExam() {
    if (state.questionsPool.length === 0) {
      alert("Your simulation pool is currently empty! Please upload a PDF, Markdown, or Plain Text simulation file (or generate questions with AI) first.");
      return;
    }
    const compiled = generateRandomSimulation();
    startExamWithQuestions(compiled);
  }

  function startExamWithQuestions(questionsList) {
    state.questions = questionsList;
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.flags = {};
    state.selfGradedScores = {};
    
    // Scale timer dynamically based on question count
    if (questionsList.length <= 10) {
      state.timeLeft = 15 * 60;
    } else if (questionsList.length <= 35) {
      state.timeLeft = 45 * 60;
    } else {
      state.timeLeft = 90 * 60;
    }
    
    state.isExamSubmitted = false;

    // Reset UI
    timerBox.classList.remove("warning");
    
    // Build Navigation Grid
    buildGridNavigator();
    
    // Render first question
    renderQuestion();

    // Switch screen
    switchScreen("screen-exam");

    // Initialize Timer
    updateTimerDisplay();
    saveAppState();
    
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      updateTimerDisplay();
      saveAppState(); // save timer updates on each tick
      
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        alert("Time is up! Submitting your exam.");
        submitExam();
      }
    }, 1000);
  }

  function switchScreen(screenId) {
    const screens = [screenWelcome, screenExam, screenResults];
    screens.forEach(screen => {
      if (screen.id === screenId) {
        screen.classList.add("active");
      } else {
        screen.classList.remove("active");
      }
    });
    window.scrollTo(0, 0);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");
    examTimer.textContent = `${formattedMinutes}:${formattedSeconds}`;
    
    if (state.timeLeft < 5 * 60) { // 5 minutes warning
      timerBox.classList.add("warning");
    }
  }

  function buildGridNavigator() {
    questionsGridContainer.innerHTML = "";
    
    // Group questions by module
    const modules = ["Cell Biology", "Histology", "Embryology", "Interdisciplinary"];
    
    modules.forEach(moduleName => {
      // Filter questions in this module
      const moduleQuestions = [];
      state.questions.forEach((q, idx) => {
        if (q.module === moduleName) {
          moduleQuestions.push({ q, idx });
        }
      });
      
      if (moduleQuestions.length > 0) {
        // Create section wrapper
        const section = document.createElement("div");
        section.className = "sidebar-module-section";
        
        // Create header
        const header = document.createElement("div");
        header.className = "sidebar-module-header";
        header.textContent = moduleName;
        section.appendChild(header);
        
        // Create grid
        const grid = document.createElement("div");
        grid.className = "questions-grid";
        
        // Add boxes
        moduleQuestions.forEach(({ q, idx }) => {
          const box = document.createElement("div");
          box.className = "grid-box";
          box.textContent = q.id;
          box.setAttribute("data-index", idx);
          
          box.addEventListener("click", () => {
            saveAnswer();
            state.currentQuestionIndex = idx;
            renderQuestion();
          });
          
          grid.appendChild(box);
        });
        
        section.appendChild(grid);
        questionsGridContainer.appendChild(section);
      }
    });
  }

  function updateNavigationGrid() {
    const boxes = questionsGridContainer.querySelectorAll(".grid-box");
    boxes.forEach((box) => {
      const idx = parseInt(box.getAttribute("data-index"), 10);
      const q = state.questions[idx];
      box.classList.remove("active", "answered", "flagged");
      
      if (idx === state.currentQuestionIndex) {
        box.classList.add("active");
      }
      
      // Answered state (check if user answered this question)
      const hasAnswer = checkIfAnswered(q.id);
      
      // Flagged state takes precedence or colors differently
      if (state.flags[q.id]) {
        box.classList.add("flagged");
      } else if (hasAnswer) {
        box.classList.add("answered");
      }
    });
  }

  function checkIfAnswered(qId) {
    const ans = state.answers[qId];
    if (ans === undefined || ans === null) return false;
    
    const q = state.questions.find(item => item.id === qId);
    if (!q) return false;
    
    if (q.type === "matching") {
      // Must have matched at least one item
      return Object.keys(ans).length > 0;
    }
    
    if (q.type === "true-false-cluster") {
      // Must have answered all parts
      return Object.keys(ans).length === q.statements.length;
    }
    
    if (typeof ans === "string") {
      return ans.trim() !== "";
    }
    
    return true;
  }

  // Enforce Word Count for Textarea
  function countWords(str) {
    if (!str) return 0;
    const words = str.trim().split(/\s+/);
    return words[0] === "" ? 0 : words.length;
  }

  function setupWordLimiter(textarea, counterText, counterWrapper) {
    textarea.addEventListener("keydown", (e) => {
      const words = countWords(textarea.value);
      
      // Control keys are always allowed
      const isControlKey = 
        e.key === "Backspace" || 
        e.key === "Delete" || 
        e.key.startsWith("Arrow") || 
        e.key === "Tab" || 
        e.key === "Enter" || 
        (e.ctrlKey && e.key === "a") || 
        (e.metaKey && e.key === "a");
      
      if (words >= 200 && !isControlKey) {
        e.preventDefault();
      }
    });

    textarea.addEventListener("input", () => {
      let words = textarea.value.trim().split(/\s+/);
      if (words[0] === "") words = [];
      
      if (words.length > 200) {
        // Truncate to 200 words
        textarea.value = words.slice(0, 200).join(" ");
        words = textarea.value.trim().split(/\s+/);
      }
      
      const count = words.length;
      counterText.textContent = count;
      
      if (count >= 200) {
        counterWrapper.classList.add("limit-reached");
      } else {
        counterWrapper.classList.remove("limit-reached");
      }
    });
  }

  // RENDER DYNAMIC INPUTS
  function renderQuestion() {
    const q = state.questions[state.currentQuestionIndex];
    
    // Set Header Info
    questionIndexCounter.textContent = `Question ${q.id} of ${state.questions.length}`;
    questionModuleBadge.textContent = q.module;
    
    // Set Question text
    if (q.type === "fill-in-the-gap") {
      questionText.textContent = `${q.id}. Fill in the blank with the correct term:`;
    } else {
      questionText.textContent = `${q.id}. ${q.question}`;
    }
    
    // Flag Checkbox state
    flagCheckbox.checked = !!state.flags[q.id];

    // Bookmark Button State
    if (bookmarkIconSvg) {
      const isBookmarked = state.bookmarks.some(b => b.question === q.question);
      if (isBookmarked) {
        bookmarkIconSvg.setAttribute("fill", "var(--color-primary)");
        bookmarkIconSvg.style.color = "var(--color-primary)";
      } else {
        bookmarkIconSvg.setAttribute("fill", "none");
        bookmarkIconSvg.style.color = "currentColor";
      }
    }
    
    // Clear Answer Inputs Area
    answerInputsArea.innerHTML = "";
    
    // Load existing answer if any
    const existingAnswer = state.answers[q.id];
    
    // Generate Inputs Based on Question Type
    if (q.type === "multiple-choice") {
      const optionsList = document.createElement("div");
      optionsList.className = "options-list";
      
      q.options.forEach(option => {
        const optionVal = option.charAt(0); // A, B, C, D, E
        const label = document.createElement("label");
        label.className = `option-item ${existingAnswer === optionVal ? 'selected' : ''}`;
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `question-${q.id}`;
        radio.value = optionVal;
        radio.checked = existingAnswer === optionVal;
        
        radio.addEventListener("change", () => {
          // Remove selected class from all options
          optionsList.querySelectorAll(".option-item").forEach(item => item.classList.remove("selected"));
          label.classList.add("selected");
          saveAnswer();
        });
        
        const span = document.createElement("span");
        span.className = "option-text";
        span.textContent = option;
        
        label.appendChild(radio);
        label.appendChild(span);
        optionsList.appendChild(label);
      });
      
      answerInputsArea.appendChild(optionsList);
      
    } else if (q.type === "true-false") {
      const optionsList = document.createElement("div");
      optionsList.className = "options-list";
      
      q.options.forEach(option => {
        const label = document.createElement("label");
        label.className = `option-item ${existingAnswer === option ? 'selected' : ''}`;
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `question-${q.id}`;
        radio.value = option;
        radio.checked = existingAnswer === option;
        
        radio.addEventListener("change", () => {
          optionsList.querySelectorAll(".option-item").forEach(item => item.classList.remove("selected"));
          label.classList.add("selected");
          saveAnswer();
        });
        
        const span = document.createElement("span");
        span.className = "option-text";
        span.textContent = option;
        
        label.appendChild(radio);
        label.appendChild(span);
        optionsList.appendChild(label);
      });
      
      answerInputsArea.appendChild(optionsList);
      
    } else if (q.type === "fill-in-the-gap") {
      const container = document.createElement("div");
      container.className = "fill-gap-container";
      
      const gapText = document.createElement("p");
      gapText.className = "fill-gap-text";
      
      // Split the question by the underscore blank and replace with a custom DOM element
      const blankIndex = q.question.indexOf("________");
      if (blankIndex !== -1) {
        const startText = q.question.substring(0, blankIndex);
        const endText = q.question.substring(blankIndex + 8);
        
        const textSpan1 = document.createElement("span");
        textSpan1.textContent = startText;
        
        const placeholder = document.createElement("span");
        placeholder.className = "gap-placeholder";
        placeholder.id = `gap-placeholder-${q.id}`;
        placeholder.textContent = existingAnswer ? existingAnswer : "[Choose Option]";
        
        const textSpan2 = document.createElement("span");
        textSpan2.textContent = endText;
        
        gapText.appendChild(textSpan1);
        gapText.appendChild(placeholder);
        gapText.appendChild(textSpan2);
      } else {
        gapText.textContent = q.question;
      }
      
      container.appendChild(gapText);
      
      // Render 4 options cards
      const optionsList = document.createElement("div");
      optionsList.className = "options-list";
      
      q.options.forEach(option => {
        const label = document.createElement("label");
        label.className = `option-item ${existingAnswer === option ? 'selected' : ''}`;
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `question-${q.id}`;
        radio.value = option;
        radio.checked = existingAnswer === option;
        
        radio.addEventListener("change", () => {
          optionsList.querySelectorAll(".option-item").forEach(item => item.classList.remove("selected"));
          label.classList.add("selected");
          
          const placeholder = document.getElementById(`gap-placeholder-${q.id}`);
          if (placeholder) {
            placeholder.textContent = option;
          }
          saveAnswer();
        });
        
        const span = document.createElement("span");
        span.className = "option-text";
        span.textContent = option;
        
        label.appendChild(radio);
        label.appendChild(span);
        optionsList.appendChild(label);
      });
      
      container.appendChild(optionsList);
      answerInputsArea.appendChild(container);
      
    } else if (q.type === "open") {
      const container = document.createElement("div");
      container.className = "open-answer-container";
      
      const textarea = document.createElement("textarea");
      textarea.className = "open-textarea scrollbar-styled";
      textarea.placeholder = "Write your answer here (up to 200 words)...";
      textarea.value = existingAnswer ? existingAnswer : "";
      
      const counterWrapper = document.createElement("div");
      counterWrapper.className = "word-counter-wrapper";
      counterWrapper.id = "counter-wrapper";
      
      const currentCountText = document.createElement("span");
      currentCountText.id = "word-count-val";
      
      const initialCount = countWords(textarea.value);
      currentCountText.textContent = initialCount;
      
      counterWrapper.appendChild(currentCountText);
      counterWrapper.appendChild(document.createTextNode(" / 200 words"));
      
      if (initialCount >= 200) {
        counterWrapper.classList.add("limit-reached");
      }
      
      container.appendChild(textarea);
      container.appendChild(counterWrapper);
      answerInputsArea.appendChild(container);
      
      // Attach word limiter logic
      setupWordLimiter(textarea, currentCountText, counterWrapper);
      
      // Auto-save open questions on blur or input changes
      textarea.addEventListener("blur", () => {
        saveAnswer();
      });
      
    } else if (q.type === "matching") {
      const container = document.createElement("div");
      container.className = "matching-container";
      
      // Render reference list of lettered options (Full Text) at the top of the matching container
      const keyContainer = document.createElement("div");
      keyContainer.className = "matching-key-container";
      keyContainer.style.cssText = "margin-bottom: 1.25rem; padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem; text-align: left;";
      
      const keyTitle = document.createElement("h5");
      keyTitle.style.cssText = "margin: 0 0 0.25rem 0; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;";
      keyTitle.textContent = "Available Options Key:";
      keyContainer.appendChild(keyTitle);
      
      q.rightItems.forEach(rightItem => {
        const keyRow = document.createElement("div");
        keyRow.style.cssText = "font-size: 0.85rem; color: #fff; line-height: 1.4; padding: 0.15rem 0;";
        keyRow.textContent = rightItem;
        keyContainer.appendChild(keyRow);
      });
      
      container.appendChild(keyContainer);
      
      q.leftItems.forEach((leftItem, idx) => {
        const row = document.createElement("div");
        row.className = "matching-row";
        
        const leftSpan = document.createElement("span");
        leftSpan.className = "matching-left";
        leftSpan.textContent = leftItem;
        
        const connector = document.createElement("span");
        connector.className = "matching-connector";
        connector.textContent = "↔";
        
        const select = document.createElement("select");
        select.className = "matching-select";
        select.name = `matching-${q.id}-${idx}`;
        
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "-- Choose match --";
        select.appendChild(defaultOpt);
        
        q.rightItems.forEach((rightItem, rIdx) => {
          const opt = document.createElement("option");
          opt.value = rIdx; // Store index
          
          // Extract the option letter prefix (A, B, C, D, E)
          const letterMatch = rightItem.match(/^([A-E])[\.\)]/i);
          const displayLetter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + rIdx);
          opt.textContent = displayLetter;
          
          const currentVal = existingAnswer && existingAnswer[idx];
          if (currentVal !== undefined && currentVal.toString() === rIdx.toString()) {
            opt.selected = true;
          }
          
          select.appendChild(opt);
        });
        
        select.addEventListener("change", () => {
          saveAnswer();
        });
        
        row.appendChild(leftSpan);
        row.appendChild(connector);
        row.appendChild(select);
        container.appendChild(row);
      });
      
      answerInputsArea.appendChild(container);
      
    } else if (q.type === "true-false-cluster") {
      const container = document.createElement("div");
      container.className = "tf-cluster-container";
      
      q.statements.forEach(statement => {
        const row = document.createElement("div");
        row.className = "tf-cluster-row";
        
        const textSpan = document.createElement("span");
        textSpan.className = "tf-cluster-text";
        textSpan.textContent = statement.text;
        
        const btnContainer = document.createElement("div");
        btnContainer.className = "tf-cluster-btns";
        
        const btnTrue = document.createElement("button");
        btnTrue.className = "tf-btn";
        btnTrue.textContent = "True";
        
        const btnFalse = document.createElement("button");
        btnFalse.className = "tf-btn";
        btnFalse.textContent = "False";
        
        // Load existing answers for this statement
        const currentAns = existingAnswer && existingAnswer[statement.id];
        if (currentAns === "True") {
          btnTrue.classList.add("selected-true");
        } else if (currentAns === "False") {
          btnFalse.classList.add("selected-false");
        }
        
        btnTrue.addEventListener("click", () => {
          btnTrue.classList.add("selected-true");
          btnFalse.classList.remove("selected-false");
          
          if (!state.answers[q.id]) state.answers[q.id] = {};
          state.answers[q.id][statement.id] = "True";
          
          saveAnswer();
          updateNavigationGrid();
        });
        
        btnFalse.addEventListener("click", () => {
          btnFalse.classList.add("selected-false");
          btnTrue.classList.remove("selected-true");
          
          if (!state.answers[q.id]) state.answers[q.id] = {};
          state.answers[q.id][statement.id] = "False";
          
          saveAnswer();
          updateNavigationGrid();
        });
        
        btnContainer.appendChild(btnTrue);
        btnContainer.appendChild(btnFalse);
        
        row.appendChild(textSpan);
        row.appendChild(btnContainer);
        container.appendChild(row);
      });
      
      answerInputsArea.appendChild(container);
    }
    
    // Enable/Disable navigation buttons
    btnPrevQuestion.disabled = state.currentQuestionIndex === 0;
    btnNextQuestion.disabled = state.currentQuestionIndex === state.questions.length - 1;
    
    updateNavigationGrid();
  }

  function handlePrevQuestion() {
    if (state.currentQuestionIndex > 0) {
      saveAnswer();
      state.currentQuestionIndex--;
      renderQuestion();
    }
  }

  function handleNextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      saveAnswer();
      state.currentQuestionIndex++;
      renderQuestion();
    }
  }

  function saveAnswer() {
    const q = state.questions[state.currentQuestionIndex];
    
    if (q.type === "multiple-choice" || q.type === "true-false" || q.type === "fill-in-the-gap") {
      const selectedRadio = answerInputsArea.querySelector("input[type='radio']:checked");
      if (selectedRadio) {
        state.answers[q.id] = selectedRadio.value;
      }
    } else if (q.type === "open") {
      const textarea = answerInputsArea.querySelector("textarea");
      if (textarea) {
        state.answers[q.id] = textarea.value;
      }
    } else if (q.type === "matching") {
      const selects = answerInputsArea.querySelectorAll("select");
      const matchAnswer = {};
      selects.forEach((select, idx) => {
        if (select.value !== "") {
          matchAnswer[idx] = select.value;
        }
      });
      state.answers[q.id] = matchAnswer;
    }
    // True/False Cluster answers are saved directly in their click event handlers
    
    updateNavigationGrid();
    saveAppState();
  }

  // SUBMIT & GRADING PROCESS
  function submitExam() {
    saveAnswer();
    
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    
    state.isExamSubmitted = true;
    
    // Automatically set up the 16 open questions in the self-grading list
    initializeSelfGradingList();
    
    // Calculate initial automatic grading (for MC, T/F, Fill, Matching)
    calculateScores();
    
    // Switch to Results
    switchScreen("screen-results");
    
    // Scroll to top of results screen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initializeSelfGradingList() {
    openQuestionsGradingList.innerHTML = "";
    
    const openQuestions = state.questions.filter(q => q.type === "open");
    
    // Dynamically update the tab button label text
    const tabBtnGrading = document.getElementById("tab-btn-grading");
    if (tabBtnGrading) {
      tabBtnGrading.textContent = `Self-Grading (${openQuestions.length} Open Questions)`;
    }
    
    openQuestions.forEach((q) => {
      const userVal = state.answers[q.id] || "";
      state.selfGradedScores[q.id] = 0; // Default to 0 points until graded
      
      const itemCard = document.createElement("div");
      itemCard.className = "grading-item-card graded-incorrect";
      itemCard.id = `grading-card-${q.id}`;
      
      const title = document.createElement("div");
      title.className = "item-q-title";
      title.textContent = `Question ${q.id} - ${q.module}`;
      
      const text = document.createElement("div");
      text.className = "item-q-text";
      text.textContent = q.question;
      
      const comparison = document.createElement("div");
      comparison.className = "response-comparison";
      
      // User answer box
      const userBox = document.createElement("div");
      userBox.className = "comparison-box";
      const userTitle = document.createElement("h5");
      userTitle.textContent = "Your Written Answer";
      userBox.appendChild(userTitle);
      
      const userContent = document.createElement("p");
      if (userVal.trim() === "") {
        userContent.className = "user-no-response";
        userContent.textContent = "[No answer submitted]";
      } else {
        userContent.textContent = userVal;
      }
      userBox.appendChild(userContent);
      
      // Model answer box
      const modelBox = document.createElement("div");
      modelBox.className = "comparison-box";
      const modelTitle = document.createElement("h5");
      modelTitle.textContent = "Official Model Answer & Criteria";
      modelBox.appendChild(modelTitle);
      
      const modelContent = document.createElement("p");
      modelContent.textContent = q.modelAnswer;
      modelBox.appendChild(modelContent);
      
      comparison.appendChild(userBox);
      comparison.appendChild(modelBox);
      
      // Self-grade Action buttons
      const actions = document.createElement("div");
      actions.className = "grading-actions";
      
      const btnIncorrect = document.createElement("button");
      btnIncorrect.className = "btn grading-btn incorrect active";
      btnIncorrect.textContent = "Incorrect (0 pts)";
      
      const btnCorrect = document.createElement("button");
      btnCorrect.className = "btn grading-btn correct";
      btnCorrect.textContent = "Correct (1 pt)";
      
      btnIncorrect.addEventListener("click", () => {
        btnIncorrect.classList.add("active");
        btnCorrect.classList.remove("active");
        itemCard.classList.remove("graded-correct");
        itemCard.classList.add("graded-incorrect");
        state.selfGradedScores[q.id] = 0;
        calculateScores();
      });
      
      btnCorrect.addEventListener("click", () => {
        btnCorrect.classList.add("active");
        btnIncorrect.classList.remove("active");
        itemCard.classList.remove("graded-incorrect");
        itemCard.classList.add("graded-correct");
        state.selfGradedScores[q.id] = 1;
        calculateScores();
      });
      
      actions.appendChild(btnIncorrect);
      actions.appendChild(btnCorrect);
      
      itemCard.appendChild(title);
      itemCard.appendChild(text);
      itemCard.appendChild(comparison);
      itemCard.appendChild(actions);
      
      openQuestionsGradingList.appendChild(itemCard);
    });
  }

  function calculateScores() {
    // Totals
    let totalScore = 0;
    
    // Module specific tallies (calculated dynamically below)
    const moduleScores = {
      "Cell Biology": { score: 0, total: 0, reqPass: 0 },
      "Histology": { score: 0, total: 0, reqPass: 0 },
      "Embryology": { score: 0, total: 0, reqPass: 0 },
      "Interdisciplinary": { score: 0, total: 0, reqPass: 0 }
    };
    
    // Calculate actual totals per module from active exam questions
    state.questions.forEach(q => {
      if (moduleScores[q.module]) {
        moduleScores[q.module].total++;
      }
    });
    
    // Set required pass counts (50% of the total, rounded up)
    for (let key in moduleScores) {
      moduleScores[key].reqPass = Math.ceil(moduleScores[key].total * 0.5);
    }
    
    // Auto questions review list builder (refresh on each calculation)
    autoQuestionsReviewList.innerHTML = "";
    
    state.questions.forEach((q) => {
      let isCorrect = false;
      const uAns = state.answers[q.id];
      
      if (q.type === "open") {
        // Open question score is determined by self-grading
        isCorrect = state.selfGradedScores[q.id] === 1;
        
      } else if (q.type === "multiple-choice" || q.type === "true-false" || q.type === "fill-in-the-gap") {
        isCorrect = uAns === q.correctAnswer;
        
        // Render Auto-graded Review item
        renderAutoReviewCard(q, isCorrect, uAns);
        
      } else if (q.type === "matching") {
        // Must match all pairs
        let allMatched = true;
        if (!uAns) {
          allMatched = false;
        } else {
          for (let key in q.correctAnswers) {
            if (uAns[key] === undefined || uAns[key].toString() !== q.correctAnswers[key].toString()) {
              allMatched = false;
              break;
            }
          }
        }
        isCorrect = allMatched;
        
        // Render Auto-graded Review item
        renderAutoReviewCard(q, isCorrect, uAns);
        
      } else if (q.type === "true-false-cluster") {
        // Must answer all statements correctly
        let allCorrect = true;
        if (!uAns) {
          allCorrect = false;
        } else {
          q.statements.forEach(statement => {
            if (uAns[statement.id] !== statement.correctAnswer) {
              allCorrect = false;
            }
          });
        }
        isCorrect = allCorrect;
        
        // Render Auto-graded Review item
        renderAutoReviewCard(q, isCorrect, uAns);
      }
      
      // Update scores
      if (isCorrect) {
        totalScore++;
        if (moduleScores[q.module]) {
          moduleScores[q.module].score++;
        }
      }
    });
    
    // Update Module Card UI
    updateModuleResultsUI(moduleScores);
    
    // Final Pass/Fail evaluation
    const overallPercent = (totalScore / state.questions.length) * 100;
    
    // Passing criteria: >=60% overall AND >=50% in each module (passed automatically if module has 0 questions)
    const passOverall = overallPercent >= 60;
    const passCellBio = moduleScores["Cell Biology"].total === 0 || (moduleScores["Cell Biology"].score / moduleScores["Cell Biology"].total) >= 0.5;
    const passHistology = moduleScores["Histology"].total === 0 || (moduleScores["Histology"].score / moduleScores["Histology"].total) >= 0.5;
    const passEmbryo = moduleScores["Embryology"].total === 0 || (moduleScores["Embryology"].score / moduleScores["Embryology"].total) >= 0.5;
    const passInterdisciplinary = moduleScores["Interdisciplinary"].total === 0 || (moduleScores["Interdisciplinary"].score / moduleScores["Interdisciplinary"].total) >= 0.5;
    
    const isPassed = passOverall && passCellBio && passHistology && passEmbryo && passInterdisciplinary;
    
    // Calculate Italian university grade (out of 30)
    const gradeFloat = (totalScore / state.questions.length) * 30;
    let gradeStr = "";
    if (totalScore === state.questions.length) {
      gradeStr = "30L";
    } else {
      gradeStr = Math.round(gradeFloat).toString();
    }
    
    // Update grade display with conditional coloring
    const resultGradeDisplay = document.getElementById("result-grade-display");
    if (resultGradeDisplay) {
      const isGradePassing = totalScore / state.questions.length >= 0.6; // 60%
      const gradeColor = isGradePassing ? "var(--color-primary)" : "#f87171";
      resultGradeDisplay.innerHTML = `Grade: <span style="color: ${gradeColor}; font-size: 2.4rem; font-weight: 900;">${gradeStr}</span>`;
    }

    // Update Header Badge & Score Text
    resultScoreSummary.innerHTML = `You answered <strong>${totalScore}</strong> out of <strong>${state.questions.length}</strong> questions correctly (<strong>${overallPercent.toFixed(1)}%</strong>)`;
    
    if (isPassed) {
      resultStatusBadge.className = "result-badge pass";
      resultStatusBadge.textContent = "PASSED";
    } else {
      resultStatusBadge.className = "result-badge fail";
      
      let failReasons = [];
      if (!passOverall) failReasons.push("Overall score below 60%");
      if (!passCellBio) failReasons.push("Cell Biology below 50%");
      if (!passHistology) failReasons.push("Histology below 50%");
      if (!passEmbryo) failReasons.push("Embryology below 50%");
      if (!passInterdisciplinary) failReasons.push("Interdisciplinary below 50%");
      
      resultStatusBadge.textContent = "FAILED";
      resultScoreSummary.innerHTML += `<div style="font-size: 0.95rem; color: #f87171; margin-top: 0.5rem; font-weight: 500;">Reasons for fail: ${failReasons.join(", ")}</div>`;
    }
    
    // SAVE ATTEMPT TO HISTORY
    const attemptRecord = {
      date: new Date().toISOString(),
      mode: state.questions.length === 10 ? "Mini-Quiz" : (state.questions.length === 35 ? "Half-Exam" : "Full Simulation"),
      totalScore: totalScore,
      totalQuestions: state.questions.length,
      grade: gradeStr,
      isPassed: isPassed,
      moduleScores: moduleScores
    };
    state.history.push(attemptRecord);
    localStorage.setItem("cbeh_history", JSON.stringify(state.history));
    
    if (typeof updateAnalyticsUI === "function") {
      updateAnalyticsUI();
    }
    
    saveAppState();
  }

  function updateModuleResultsUI(moduleScores) {
    // Cell Bio
    const cb = moduleScores["Cell Biology"];
    scoreCellBio.textContent = `${cb.score} / ${cb.total}`;
    const cbPassing = document.querySelector("#card-result-cellbio .module-passing");
    if (cbPassing) cbPassing.textContent = `Req: >= 50% (${cb.reqPass}/${cb.total})`;
    if (cb.score >= cb.reqPass) {
      statusCellBio.textContent = "MET";
      statusCellBio.className = "module-status met";
      cardCellBio.style.borderColor = "rgba(16, 185, 129, 0.3)";
    } else {
      statusCellBio.textContent = "NOT MET";
      statusCellBio.className = "module-status not-met";
      cardCellBio.style.borderColor = "rgba(239, 68, 68, 0.3)";
    }
    
    // Histology
    const hist = moduleScores["Histology"];
    scoreHistology.textContent = `${hist.score} / ${hist.total}`;
    const histPassing = document.querySelector("#card-result-histology .module-passing");
    if (histPassing) histPassing.textContent = `Req: >= 50% (${hist.reqPass}/${hist.total})`;
    if (hist.score >= hist.reqPass) {
      statusHistology.textContent = "MET";
      statusHistology.className = "module-status met";
      cardHistology.style.borderColor = "rgba(16, 185, 129, 0.3)";
    } else {
      statusHistology.textContent = "NOT MET";
      statusHistology.className = "module-status not-met";
      cardHistology.style.borderColor = "rgba(239, 68, 68, 0.3)";
    }
    
    // Embryo
    const emb = moduleScores["Embryology"];
    scoreEmbryo.textContent = `${emb.score} / ${emb.total}`;
    const embPassing = document.querySelector("#card-result-embryo .module-passing");
    if (embPassing) embPassing.textContent = `Req: >= 50% (${emb.reqPass}/${emb.total})`;
    if (emb.score >= emb.reqPass) {
      statusEmbryo.textContent = "MET";
      statusEmbryo.className = "module-status met";
      cardEmbryo.style.borderColor = "rgba(16, 185, 129, 0.3)";
    } else {
      statusEmbryo.textContent = "NOT MET";
      statusEmbryo.className = "module-status not-met";
      cardEmbryo.style.borderColor = "rgba(239, 68, 68, 0.3)";
    }
    
    // Interdisciplinary
    const ind = moduleScores["Interdisciplinary"];
    scoreInterdisciplinary.textContent = `${ind.score} / ${ind.total}`;
    const indPassing = document.querySelector("#card-result-interdisciplinary .module-passing");
    if (indPassing) indPassing.textContent = `Req: >= 50% (${ind.reqPass}/${ind.total})`;
    if (ind.score >= ind.reqPass) {
      statusInterdisciplinary.textContent = "MET";
      statusInterdisciplinary.className = "module-status met";
      cardInterdisciplinary.style.borderColor = "rgba(16, 185, 129, 0.3)";
    } else {
      statusInterdisciplinary.textContent = "NOT MET";
      statusInterdisciplinary.className = "module-status not-met";
      cardInterdisciplinary.style.borderColor = "rgba(239, 68, 68, 0.3)";
    }
  }

  function renderAutoReviewCard(q, isCorrect, uAns) {
    const card = document.createElement("div");
    card.className = `review-item-card ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const title = document.createElement("div");
    title.className = "item-q-title";
    title.textContent = `Question ${q.id} - ${q.module} [${q.type.replace("-", " ").toUpperCase()}]`;
    
    const text = document.createElement("div");
    text.className = "item-q-text";
    text.textContent = q.question;
    
    const answersGrid = document.createElement("div");
    answersGrid.className = "review-answers-grid";
    
    if (q.type === "multiple-choice" || q.type === "true-false" || q.type === "fill-in-the-gap") {
      const userLine = document.createElement("div");
      userLine.className = `review-answer-line user ${isCorrect ? 'correct-selection' : ''}`;
      
      let userDisplay = uAns ? uAns : "[No selection made]";
      if (q.type === "multiple-choice" && uAns) {
        const matchingOpt = q.options.find(opt => opt.startsWith(uAns));
        if (matchingOpt) userDisplay = matchingOpt;
      }
      userLine.textContent = `Your Answer: ${userDisplay}`;
      
      const correctLine = document.createElement("div");
      correctLine.className = "review-answer-line correct";
      let correctDisplay = q.correctAnswer;
      if (q.type === "multiple-choice") {
        const matchingOpt = q.options.find(opt => opt.startsWith(q.correctAnswer));
        if (matchingOpt) correctDisplay = matchingOpt;
      }
      correctLine.textContent = `Correct Answer: ${correctDisplay}`;
      
      answersGrid.appendChild(userLine);
      if (!isCorrect) {
        answersGrid.appendChild(correctLine);
      }
      
    } else if (q.type === "matching") {
      q.leftItems.forEach((leftItem, idx) => {
        const matchLine = document.createElement("div");
        matchLine.className = "review-answer-line";
        
        const userValIdx = uAns && uAns[idx];
        const correctValIdx = q.correctAnswers[idx];
        
        const userValText = userValIdx !== undefined ? q.rightItems[userValIdx] : "[No selection]";
        const correctValText = q.rightItems[correctValIdx];
        
        const isPairCorrect = userValIdx !== undefined && userValIdx.toString() === correctValIdx.toString();
        
        matchLine.innerHTML = `<strong>${leftItem}</strong>: matched to 
          <span style="color: ${isPairCorrect ? '#10b981' : '#f87171'}">${userValText}</span>
          ${isPairCorrect ? '' : ` (Correct: <span style="color: #34d399">${correctValText}</span>)`}`;
        
        answersGrid.appendChild(matchLine);
      });
      
    } else if (q.type === "true-false-cluster") {
      q.statements.forEach(statement => {
        const stmtLine = document.createElement("div");
        stmtLine.className = "review-answer-line";
        
        const userVal = uAns && uAns[statement.id];
        const correctVal = statement.correctAnswer;
        const isStmtCorrect = userVal === correctVal;
        
        stmtLine.innerHTML = `<strong>${statement.id}</strong>: ${statement.text} <br>
          Your Answer: <span style="color: ${isStmtCorrect ? '#10b981' : '#f87171'}">${userVal || "[No selection]"}</span>
          ${isStmtCorrect ? '' : ` (Correct: <span style="color: #34d399">${correctVal}</span>)`}`;
        
        answersGrid.appendChild(stmtLine);
      });
    }
    
    const explanation = document.createElement("div");
    explanation.className = "review-explanation";
    explanation.textContent = `Explanation: ${q.explanation}`;
    
    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(answersGrid);
    card.appendChild(explanation);
    
    autoQuestionsReviewList.appendChild(card);
  }

  function resetExam() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    state.questions = [];
    state.answers = {};
    state.flags = {};
    state.selfGradedScores = {};
    state.isExamSubmitted = false;
    
    switchScreen("screen-welcome");
    saveAppState();
  }

  // ==========================================
  // PDF UPLOAD, PARSING AND RANDOM SIMULATION GENERATOR
  // ==========================================

  // Fisher-Yates shuffle
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Shuffle multiple choice options and recalculate correct letter pointer
  function shuffleMultipleChoiceOptions(q) {
    if (!q.options || q.options.length === 0) return;
    
    // Strip prefixes like A. B. C.
    const rawOptions = q.options.map(opt => opt.replace(/^[A-E][\.\)]\s*/i, ""));
    const correctLetter = q.correctAnswer;
    const correctIdx = correctLetter.charCodeAt(0) - 65;
    const correctText = rawOptions[correctIdx];
    
    // Create matching index array and shuffle
    const indices = Array.from({ length: rawOptions.length }, (_, i) => i);
    shuffleArray(indices);
    
    const shuffledRaw = indices.map(idx => rawOptions[idx]);
    const newCorrectIdx = shuffledRaw.indexOf(correctText);
    
    q.correctAnswer = String.fromCharCode(65 + newCorrectIdx);
    q.options = shuffledRaw.map((txt, i) => String.fromCharCode(65 + i) + ". " + txt);
  }

  // Shuffle right-side matching items and re-map correct matches
  function shuffleMatchingOptions(q) {
    if (!q.rightItems || q.rightItems.length === 0) return;
    
    const rawRight = q.rightItems.map(opt => opt.replace(/^[A-E][\.\)]\s*/i, ""));
    const oldRightText = [...rawRight];
    
    // Shuffle right items
    const indices = Array.from({ length: rawRight.length }, (_, i) => i);
    shuffleArray(indices);
    
    const shuffledRaw = indices.map(idx => rawRight[idx]);
    
    // Update correctAnswers mapping
    const newCorrectAnswers = {};
    for (let leftIdx in q.correctAnswers) {
      const oldRightIdx = q.correctAnswers[leftIdx];
      const targetText = oldRightText[oldRightIdx];
      const newRightIdx = shuffledRaw.indexOf(targetText);
      newCorrectAnswers[leftIdx] = newRightIdx;
    }
    
    q.correctAnswers = newCorrectAnswers;
    q.rightItems = shuffledRaw.map((txt, i) => String.fromCharCode(65 + i) + ". " + txt);
  }

  // Shuffle statement order in True/False clusters
  function shuffleClusterStatements(q) {
    if (q.statements && q.statements.length > 0) {
      shuffleArray(q.statements);
    }
  }

  // Select questions from master pool and compile a customized 70-question simulation
  function generateRandomSimulation() {
    const pool = state.questionsPool;
    
    // Required counts per module and open questions allocations (Sum = 70 questions, 16 open)
    const modules = [
      { name: "Cell Biology", total: 30, open: 7 },
      { name: "Histology", total: 24, open: 6 },
      { name: "Embryology", total: 12, open: 2 },
      { name: "Interdisciplinary", total: 4, open: 1 }
    ];
    
    const finalExamQuestions = [];
    
    modules.forEach(mod => {
      // Get all questions in the pool for this module
      const modulePool = pool.filter(q => q.module === mod.name);
      
      // Separate open and non-open questions
      const openPool = modulePool.filter(q => q.type === "open");
      const nonOpenPool = modulePool.filter(q => q.type !== "open");
      
      // Shuffle both pools
      shuffleArray(openPool);
      shuffleArray(nonOpenPool);
      
      // Select questions
      const selectedOpen = openPool.slice(0, Math.min(mod.open, openPool.length));
      const neededNonOpen = mod.total - selectedOpen.length;
      const selectedNonOpen = nonOpenPool.slice(0, Math.min(neededNonOpen, nonOpenPool.length));
      
      // Combine and shuffle to randomize order within the module section
      const combined = [...selectedOpen, ...selectedNonOpen];
      shuffleArray(combined);
      
      // Deep clone questions and randomize options/answers
      const finalizedModuleQuestions = combined.map(q => cloneAndShuffleQuestionOptions(q));
      
      finalExamQuestions.push(...finalizedModuleQuestions);
    });
    
    // Assign display IDs from 1 to 70 consecutively
    finalExamQuestions.forEach((q, index) => {
      q.id = index + 1;
    });
    
    return finalExamQuestions;
  }

  function cloneAndShuffleQuestionOptions(q) {
    const cloned = JSON.parse(JSON.stringify(q));
    
    // Randomize options/answers for the cloned question
    if (cloned.type === "multiple-choice") {
      shuffleMultipleChoiceOptions(cloned);
    } else if (cloned.type === "fill-in-the-gap") {
      // Shuffle options list
      if (!cloned.options || cloned.options.length === 0) {
        // Distractor fallback to meet 4 option criteria
        const distractors = ["Spliceosome", "Sarcomere", "Fibroblast", "Sertoli", "Restriction", "Nucleus", "Apoptosome", "Neurulation", "Intramembranous", "Chondrocytes", "Tight"]
          .filter(w => w.toLowerCase() !== cloned.correctAnswer.toLowerCase());
        shuffleArray(distractors);
        cloned.options = [cloned.correctAnswer, ...distractors.slice(0, 3)];
      }
      shuffleArray(cloned.options);
    } else if (cloned.type === "matching") {
      shuffleMatchingOptions(cloned);
    } else if (cloned.type === "true-false-cluster") {
      shuffleClusterStatements(cloned);
    }
    
    return cloned;
  }

  // PDF Text Extraction using PDF.js
  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Reconstruct text layout checking vertical coordinates (Y values)
      let lastY = -1;
      let pageText = "";
      for (let item of textContent.items) {
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += "\n";
        }
        pageText += item.str + " ";
        lastY = item.transform[5];
      }
      fullText += pageText + "\n";
    }
    return fullText;
  }

  // Parse Mock Exam Text based on visual layout
  function parseMockExamText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Find ANSWER KEY index
    let answerKeyStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase().includes("ANSWER KEY")) {
        answerKeyStartIndex = i;
        break;
      }
    }
    
    if (answerKeyStartIndex === -1) {
      throw new Error("Could not find 'ANSWER KEY' header in the PDF.");
    }
    
    const questionLines = lines.slice(0, answerKeyStartIndex);
    const answerLines = lines.slice(answerKeyStartIndex);
    
    // Parse Questions
    const parsedQuestions = [];
    let currentModule = "Cell Biology";
    let currentQuestion = null;
    
    for (let i = 0; i < questionLines.length; i++) {
      const line = questionLines[i];
      const upperLine = line.toUpperCase();
      
      // Module sections transitions
      if (upperLine.includes("PART I:") || (upperLine.includes("CELL BIOLOGY") && upperLine.includes("QUESTIONS"))) {
        currentModule = "Cell Biology";
        continue;
      } else if (upperLine.includes("PART II:") || (upperLine.includes("HISTOLOGY") && upperLine.includes("QUESTIONS"))) {
        currentModule = "Histology";
        continue;
      } else if (upperLine.includes("PART III:") || (upperLine.includes("EMBRYOLOGY") && upperLine.includes("QUESTIONS"))) {
        currentModule = "Embryology";
        continue;
      } else if (upperLine.includes("PART IV:") || (upperLine.includes("INTERDISCIPLINARY") && upperLine.includes("QUESTIONS"))) {
        currentModule = "Interdisciplinary";
        continue;
      }
      
      // Detect question start: "ID. TYPE:"
      const qMatch = line.match(/^(\d+)\.\s*(Multiple Choice|True or False|Open Question|Fill in the gap|Matching|True or False Cluster):?\s*(.*)/i);
      
      if (qMatch) {
        if (currentQuestion) {
          parsedQuestions.push(currentQuestion);
        }
        
        const id = parseInt(qMatch[1], 10);
        const typeStr = qMatch[2].toLowerCase();
        let type = "open";
        if (typeStr.includes("multiple choice")) type = "multiple-choice";
        else if (typeStr.includes("true or false cluster")) type = "true-false-cluster";
        else if (typeStr.includes("true or false")) type = "true-false";
        else if (typeStr.includes("fill in the gap")) type = "fill-in-the-gap";
        else if (typeStr.includes("matching")) type = "matching";
        
        currentQuestion = {
          id: id,
          type: type,
          module: currentModule,
          question: qMatch[3],
          options: [],
          leftItems: [],
          rightItems: [],
          statements: [],
          correctAnswer: null,
          correctAnswers: null,
          modelAnswer: null,
          explanation: ""
        };
        
        if (type === "true-false") {
          currentQuestion.options = ["True", "False"];
        }
        
      } else if (currentQuestion) {
        // Appending details to active question
        if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false" || currentQuestion.type === "fill-in-the-gap") {
          const optMatch = line.match(/^([A-E])[\.\)]\s*(.*)/i);
          if (optMatch) {
            currentQuestion.options.push(line);
          } else {
            currentQuestion.question += " " + line;
          }
          
        } else if (currentQuestion.type === "matching") {
          const conceptMatch = line.match(/^(\d+)[\.\)]\s*(.*)/);
          const descMatch = line.match(/^([A-E])[\.\)]\s*(.*)/i);
          
          if (conceptMatch) {
            currentQuestion.leftItems.push(line);
          } else if (descMatch) {
            currentQuestion.rightItems.push(line);
          } else {
            currentQuestion.question += " " + line;
          }
          
        } else if (currentQuestion.type === "true-false-cluster") {
          const stmtMatch = line.match(/^([A-D])[\.\)]\s*(.*)/i);
          if (stmtMatch) {
            currentQuestion.statements.push({
              id: stmtMatch[1].toUpperCase(),
              text: line,
              correctAnswer: null
            });
          } else {
            currentQuestion.question += " " + line;
          }
        } else {
          currentQuestion.question += " " + line;
        }
      }
    }
    
    if (currentQuestion) {
      parsedQuestions.push(currentQuestion);
    }
    
    // Clean strings and check for inline multiple-choice options
    parsedQuestions.forEach(q => {
      q.question = q.question.replace(/\s+/g, " ").trim();
      
      if (q.type === "multiple-choice" && q.options.length === 0) {
        // Regex to match inline options e.g. A. option1 B. option2 ...
        const inlineRegex = /(?:^|\s)([A-E])[\.\)]\s+((?:(?!\s[A-E][\.\)]).)+)/gi;
        const matches = [...q.question.matchAll(inlineRegex)];
        
        if (matches.length >= 4) {
          const firstOptionIndex = q.question.search(/(?:^|\s)[A-E][\.\)]\s+/i);
          if (firstOptionIndex !== -1) {
            const mainQuestion = q.question.substring(0, firstOptionIndex).trim();
            const tempOptions = [];
            
            matches.forEach(m => {
              const letter = m[1].toUpperCase();
              const text = m[2].trim();
              tempOptions.push(`${letter}. ${text}`);
            });
            
            q.question = mainQuestion;
            q.options = tempOptions;
          }
        }
      }
    });
    
    // Parse answers from Answer Key
    let currentAnsId = -1;
    for (let j = 1; j < answerLines.length; j++) {
      const line = answerLines[j];
      const ansMatch = line.match(/^(\d+)\.\s*(.*)/);
      
      if (ansMatch) {
        currentAnsId = parseInt(ansMatch[1], 10);
        const ansContent = ansMatch[2].trim();
        
        const q = parsedQuestions.find(item => item.id === currentAnsId);
        if (q) {
          if (q.type === "multiple-choice") {
            q.correctAnswer = ansContent.charAt(0).toUpperCase();
            q.explanation = ansContent.substring(1).replace(/[\(\)]/g, "").trim() || "No explanation provided.";
          } else if (q.type === "true-false") {
            const isTrue = ansContent.toLowerCase().startsWith("true");
            q.correctAnswer = isTrue ? "True" : "False";
            q.explanation = ansContent.substring(isTrue ? 4 : 5).replace(/[\(\)]/g, "").trim() || "No explanation provided.";
          } else if (q.type === "fill-in-the-gap") {
            q.correctAnswer = ansContent;
            q.explanation = "Fill in the correct term to complete the gap.";
          } else if (q.type === "matching") {
            q.correctAnswers = {};
            const pairs = ansContent.match(/(\d+)-([A-E])/g);
            if (pairs) {
              pairs.forEach(pair => {
                const split = pair.split("-");
                const leftIdx = parseInt(split[0], 10) - 1;
                const rightLetter = split[1].toUpperCase();
                const rightIdx = rightLetter.charCodeAt(0) - 65;
                q.correctAnswers[leftIdx] = rightIdx;
              });
            }
            q.explanation = ansContent;
          } else if (q.type === "open") {
            let modelAns = ansContent;
            if (modelAns.startsWith("Open Concept:")) {
              modelAns = modelAns.substring(13).trim();
            } else if (modelAns.startsWith("Open:")) {
              modelAns = modelAns.substring(5).trim();
            }
            q.modelAnswer = modelAns;
            q.explanation = "Open question self-grading guide.";
          } else if (q.type === "true-false-cluster") {
            q.explanation = "Evaluate each statement as True or False.";
          }
        }
      } else if (currentAnsId !== -1) {
        const q = parsedQuestions.find(item => item.id === currentAnsId);
        if (q) {
          if (q.type === "open") {
            q.modelAnswer += " " + line;
          } else if (q.type === "true-false-cluster") {
            const clusterMatch = line.match(/^([A-D])[\)\.]\s*(True|False)/i);
            if (clusterMatch) {
              const letter = clusterMatch[1].toUpperCase();
              const val = clusterMatch[2].toLowerCase() === "true" ? "True" : "False";
              const stmt = q.statements.find(s => s.id === letter);
              if (stmt) stmt.correctAnswer = val;
            }
          } else if (q.type === "multiple-choice" || q.type === "true-false") {
            q.explanation += " " + line;
          }
        }
      }
    }
    
    // Clean final strings
    parsedQuestions.forEach(q => {
      if (q.explanation) q.explanation = q.explanation.replace(/\s+/g, " ").trim();
      if (q.modelAnswer) q.modelAnswer = q.modelAnswer.replace(/\s+/g, " ").trim();
    });
    
    return parsedQuestions;
  }

  // Upload Logic Logging
  function addLogEntry(text, isError = false) {
    const entry = document.createElement("div");
    entry.className = `log-entry ${isError ? 'error' : 'success'}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    uploadLog.appendChild(entry);
    uploadLog.scrollTop = uploadLog.scrollHeight;
  }

  // Drag and Drop Listeners
  if (uploadDropzone) {
    uploadDropzone.addEventListener("click", () => {
      pdfFileInput.click();
    });

    uploadDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadDropzone.classList.add("dragover");
    });

    uploadDropzone.addEventListener("dragleave", () => {
      uploadDropzone.classList.remove("dragover");
    });

    uploadDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadDropzone.classList.remove("dragover");
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFilesUpload(files);
      }
    });

    pdfFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFilesUpload(files);
      }
    });
  }

  async function handleFilesUpload(files) {
    const validExtensions = [".pdf", ".md", ".txt"];
    const uploadableFiles = Array.from(files).filter(f => {
      const name = f.name.toLowerCase();
      return validExtensions.some(ext => name.endsWith(ext));
    });
    
    if (uploadableFiles.length === 0) {
      addLogEntry("Error: Please select valid PDF, Markdown (.md), or Text (.txt) files.", true);
      return;
    }
    
    addLogEntry(`Starting processing of ${uploadableFiles.length} mock simulation file(s)...`);
    
    for (let file of uploadableFiles) {
      try {
        addLogEntry(`Parsing "${file.name}"...`);
        let text = "";
        
        if (file.name.toLowerCase().endsWith(".pdf")) {
          text = await extractTextFromPDF(file);
        } else {
          // Read markdown/text files natively using FileReader
          text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
          });
        }
        const parsedQuestions = parseMockExamText(text);
        
        if (parsedQuestions.length === 0) {
          throw new Error("Parsed 0 questions. Verify PDF formatting matches mock exam templates.");
        }
        
        // Tag with file name source
        parsedQuestions.forEach(q => {
          q.sourceFilename = file.name;
        });

        // Add parsed questions to master pool
        state.questionsPool.push(...parsedQuestions);
        
        // Recalculate uploadedSimulationsCount and save
        updateUploadedSimulationsCount();
        saveAppState();
        updateSimulationsManagerUI();
        
        addLogEntry(`Successfully parsed "${file.name}": added ${parsedQuestions.length} questions.`);
        
        // Update welcome screen stats
        poolStatusCount.textContent = state.questionsPool.length;
        poolStatusSims.textContent = state.uploadedSimulationsCount;
        
      } catch (err) {
        console.error(err);
        addLogEntry(`Error parsing "${file.name}": ${err.message}`, true);
      }
    }
  }

  // --- GEMINI AI MODEL DISCOVERY ---
  async function discoverAvailableModel(apiKey) {
    const urls = [
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    ];
    
    for (let url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.models) {
            const names = data.models
              .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
              .map(m => m.name.replace(/^models\//, ""));
            
            console.log("Discovered models available on key:", names);
            
            // Prioritize only stable and preview Flash models for quick, free-tier generation
            const priority = [
              "gemini-3.6-flash",
              "gemini-3.5-flash",
              "gemini-3.0-flash",
              "gemini-3.1-flash-preview",
              "gemini-3.0-flash-preview",
              "gemini-2.6-flash",
              "gemini-2.5-flash",
              "gemini-1.5-flash"
            ];
            
            for (let target of priority) {
              if (names.includes(target)) {
                const apiVer = url.includes("/v1beta/") ? "v1beta" : "v1";
                return { model: target, apiVer: apiVer };
              }
            }
            
            // Fallback to any model found
            if (names.length > 0) {
              const apiVer = url.includes("/v1beta/") ? "v1beta" : "v1";
              return { model: names[0], apiVer: apiVer };
            }
          }
        }
      } catch (e) {
        console.warn("Error discovering models:", e);
      }
    }
    
    // Default fallback if discovery fails completely
    return { model: "gemini-3.6-flash", apiVer: "v1beta" };
  }

  // --- GEMINI AI QUESTION BATCH GENERATOR ---
  async function generateAiQuestionsBatch(apiKey, count, focusTopic, batchNumber = 1) {
    const discovery = await discoverAvailableModel(apiKey);
    console.log(`Routing query to model: ${discovery.model} using API version: ${discovery.apiVer}`);
    
    // Distribute question counts based on total requested
    let cellBioCount = 0;
    let histologyCount = 0;
    let embryologyCount = 0;
    let interdisciplinaryCount = 0;
    let openCount = 0;
    
    if (count === 10) {
      cellBioCount = 4;
      histologyCount = 3;
      embryologyCount = 2;
      interdisciplinaryCount = 1;
      openCount = 2;
    } else if (count === 35) {
      cellBioCount = 15;
      histologyCount = 12;
      embryologyCount = 6;
      interdisciplinaryCount = 2;
      openCount = 8;
    }
    
    const focusStr = focusTopic ? `Focus particularly on the following custom area: "${focusTopic}".` : "";
    const batchStr = count === 35 && batchNumber ? ` (This is batch ${batchNumber} of 2. Make sure you generate a diverse and unique set of questions.)` : "";

    const promptText = `
You are a professor setting up a CBEH (Cell Biology, Histology, Embryology, and Interdisciplinary) exam mock simulation.
Please generate exactly ${count} mock exam questions conforming to the official syllabus and the exact structure specified below.

### DISTRIBUTION REQUIREMENT:
Generate:
- Exactly ${cellBioCount} Cell Biology questions
- Exactly ${histologyCount} Histology questions
- Exactly ${embryologyCount} Embryology questions
- Exactly ${interdisciplinaryCount} Interdisciplinary questions
- Out of these ${count} questions, exactly ${openCount} questions MUST be of type "open" (open questions requiring a short text box explanation).

${focusStr}
${batchStr}

### DETAILED SYLLABUS TOPICS:
- Cell Biology: Structure/function of cells, membranes, transport (Na+/K+ pump), cytoskeleton, nucleus, protein structure, DNA/chromatin compaction, replication, transcription, RNA splicing (introns/exons, spliceosome), translation/ribosomes, folding, sorting/secretory pathway, cell signaling (GPCR, RTK), cell cycle regulation (G1/S transition, checkpoints, Rb phosphorylation), mitosis, meiosis, genetics/Mendelian laws, cytogenetics, mutation/polymorphism, oncogenes/tumor suppressors, apoptosis, viruses, stem cells, gene editing (CRISPR-Cas9).
- Histology: Methods, staining, epithelial cell junctions (tight/zonula occludens, anchoring, gap), lining epithelia, exocrine/endocrine glands, proper connective tissue, cartilage, bone/osteogenesis, blood/haemopoiesis, lymphoid organs, muscle tissue (skeletal, cardiac, smooth), nervous tissue (neurons, fibers, synapses, neuroglia, blood-brain barrier).
- Embryology: Gametogenesis, hormonal control, fertilization, cleavage/blastocyst, implantation, gastrulation (trilaminar disc, ectoderm/mesoderm/endoderm fates), folding (gut tube formation), maternal-fetal relationship (placental barrier layers), digestive system development, nervous system development (neurulation, neural tube closure).
- Interdisciplinary: Questions linking multiple categories (e.g. cellular organelles, tissues, and embryonic development).

### QUESTION FORMAT CONSTRAINTS:
1. "multiple-choice":
   - Options array must contain exactly 5 options starting with prefix "A. ", "B. ", "C. ", "D. ", "E. ".
   - correctAnswer must be a single uppercase letter: "A", "B", "C", "D", or "E".
2. "true-false":
   - Options array must be exactly ["True", "False"].
   - correctAnswer must be either "True" or "False".
3. "fill-in-the-gap":
   - Options array must contain exactly 4 options.
   - The question text must contain a "________" blank placeholder.
   - correctAnswer must be a string matching one of the options.
4. "matching":
   - leftItems array must contain 4 concepts starting with "1. ", "2. ", "3. ", "4. ".
   - rightItems array must contain 4 descriptions starting with "A. ", "B. ", "C. ", "D. ".
   - correctAnswers mapping maps left index (0-3) to right index (0-3), e.g. { "0": 3, "1": 1, "2": 2, "3": 0 } for 1-D, 2-B, 3-C, 4-A.
5. "open":
   - Must have a modelAnswer string (approx. 50-100 words).
6. "true-false-cluster":
   - statements array must contain 4 statements, each with id ("A", "B", "C", "D"), text (starting with "A) ", "B) ", etc.), and correctAnswer ("True" or "False").

Respond strictly with a JSON array. Each question object must look like one of the following formats:
- Multiple choice: {"type":"multiple-choice","module":"Cell Biology","question":"...","options":["A. ...","B. ...","C. ...","D. ...","E. ..."],"correctAnswer":"A","explanation":"..."}
- True/False: {"type":"true-false","module":"Histology","question":"...","options":["True","False"],"correctAnswer":"True","explanation":"..."}
- Fill in the gap: {"type":"fill-in-the-gap","module":"Cell Biology","question":"The enzyme ________ is responsible...","options":["DNA Polymerase","RNA Polymerase","Helicase","Ligase"],"correctAnswer":"DNA Polymerase","explanation":"..."}
- Matching: {"type":"matching","module":"Histology","question":"Match...","leftItems":["1. X","2. Y","3. Z","4. W"],"rightItems":["A. ...","B. ...","C. ...","D. ..."],"correctAnswers":{"0":3,"1":1,"2":2,"3":0},"explanation":"..."}
- Open Question: {"type":"open","module":"Embryology","question":"...","modelAnswer":"...","explanation":"..."}
- True/False Cluster: {"type":"true-false-cluster","module":"Cell Biology","question":"Evaluate...","statements":[{"id":"A","text":"Statement A","correctAnswer":"True"},{"id":"B","text":"Statement B","correctAnswer":"False"},{"id":"C","text":"Statement C","correctAnswer":"True"},{"id":"D","text":"Statement D","correctAnswer":"False"}],"explanation":"..."}
Do not add markdown fences or other text. Return ONLY the raw JSON array.
`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const url = `https://generativelanguage.googleapis.com/${discovery.apiVer}/models/${discovery.model}:generateContent?key=${apiKey}`;
    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    };
    if (aiGenerationAbortController) {
      fetchOptions.signal = aiGenerationAbortController.signal;
    }
    
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `API call failed for ${discovery.model} (${discovery.apiVer})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error.message;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON array
    const questions = JSON.parse(resultText);
    
    // Clean and validate formats
    questions.forEach(q => {
      if (q.type === "true-false") {
        q.options = ["True", "False"];
      }
      if (q.type === "fill-in-the-gap" && (!q.options || q.options.length === 0)) {
        q.options = [q.correctAnswer, "Ribosome", "Nucleus", "Mitochondrion"];
        shuffleArray(q.options);
      }
    });

    return questions;
  }
  function updateUploadedSimulationsCount() {
    const sources = new Set();
    state.questionsPool.forEach(q => {
      if (q.sourceFilename) {
        sources.add(q.sourceFilename);
      }
    });
    state.uploadedSimulationsCount = sources.size;
  }

  function updateSimulationsManagerUI() {
    const listContainer = document.getElementById("simulations-list-container");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    if (state.questionsPool.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.cssText = "font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem 0;";
      emptyMsg.textContent = "No simulations uploaded yet. Pool is empty.";
      listContainer.appendChild(emptyMsg);
      return;
    }
    
    // Group questions by source filename
    const groups = {};
    state.questionsPool.forEach(q => {
      const src = q.sourceFilename || "Unknown Upload";
      if (!groups[src]) {
        groups[src] = 0;
      }
      groups[src]++;
    });
    
    // Convert to list items
    Object.keys(groups).forEach(sourceName => {
      const count = groups[sourceName];
      
      const item = document.createElement("div");
      item.className = "sim-list-item";
      item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 6px; gap: 0.5rem;";
      
      const info = document.createElement("div");
      info.style.cssText = "display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; flex: 1;";
      
      const nameSpan = document.createElement("span");
      nameSpan.style.cssText = "font-size: 0.8rem; font-weight: 500; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;";
      nameSpan.textContent = sourceName;
      nameSpan.title = sourceName;
      
      const countSpan = document.createElement("span");
      countSpan.style.cssText = "font-size: 0.7rem; color: var(--text-muted);";
      countSpan.textContent = `${count} question${count !== 1 ? 's' : ''} loaded`;
      
      info.appendChild(nameSpan);
      info.appendChild(countSpan);
      item.appendChild(info);
      
      const btnRemove = document.createElement("button");
      btnRemove.style.cssText = "background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; flex-shrink: 0;";
      btnRemove.textContent = "Remove";
      
      btnRemove.addEventListener("mouseover", () => {
        btnRemove.style.background = "rgba(239, 68, 68, 0.2)";
      });
      btnRemove.addEventListener("mouseout", () => {
        btnRemove.style.background = "rgba(239, 68, 68, 0.1)";
      });
      
      btnRemove.addEventListener("click", () => {
        const confirmRemove = confirm(`Are you sure you want to remove all questions from "${sourceName}"?\nThis will delete ${count} questions from your pool.`);
        if (confirmRemove) {
          // Delete questions from pool
          state.questionsPool = state.questionsPool.filter(q => (q.sourceFilename || "Unknown Upload") !== sourceName);
          
          // If the user has an active quiz containing deleted questions, return to home
          const hasDeletedQuestionsInExam = state.questions.some(q => (q.sourceFilename || "Unknown Upload") === sourceName);
          if (hasDeletedQuestionsInExam) {
            alert("The active simulation contained questions from the removed file. Returning to Welcome screen.");
            resetExam();
          }
          
          updateUploadedSimulationsCount();
          saveAppState();
          updateSimulationsManagerUI();
          
          // Update stats UI
          poolStatusCount.textContent = state.questionsPool.length;
          poolStatusSims.textContent = state.uploadedSimulationsCount;
          
          addLogEntry(`Removed "${sourceName}": deleted ${count} questions.`);
        }
      });
      item.appendChild(btnRemove);
      
      listContainer.appendChild(item);
    });
  }

  // --- PERSISTENCE: STATE STORAGE AND RETRIEVAL ---
  function saveAppState() {
    const stateToSave = {
      questionsPool: state.questionsPool,
      uploadedSimulationsCount: state.uploadedSimulationsCount,
      questions: state.questions,
      currentQuestionIndex: state.currentQuestionIndex,
      answers: state.answers,
      flags: state.flags,
      timeLeft: state.timeLeft,
      selfGradedScores: state.selfGradedScores,
      isExamSubmitted: state.isExamSubmitted,
      activeScreen: document.querySelector(".screen.active")?.id || "screen-welcome"
    };
    localStorage.setItem("cbeh_app_state_v1", JSON.stringify(stateToSave));
  }

  function loadAppState() {
    const saved = localStorage.getItem("cbeh_app_state_v1");
    if (!saved) return false;
    
    try {
      const parsed = JSON.parse(saved);
      
      // Restore master pool
      if (parsed.questionsPool) {
        state.questionsPool = parsed.questionsPool;
      }
      if (parsed.uploadedSimulationsCount) {
        state.uploadedSimulationsCount = parsed.uploadedSimulationsCount;
      }
      
      // Update welcome screen stats
      if (poolStatusCount) poolStatusCount.textContent = state.questionsPool.length;
      if (poolStatusSims) poolStatusSims.textContent = state.uploadedSimulationsCount;
      
      // If there is an active/submitted exam, restore it
      if (parsed.questions && parsed.questions.length > 0) {
        state.questions = parsed.questions;
        state.currentQuestionIndex = parsed.currentQuestionIndex || 0;
        state.answers = parsed.answers || {};
        state.flags = parsed.flags || {};
        state.timeLeft = parsed.timeLeft || 90 * 60;
        state.selfGradedScores = parsed.selfGradedScores || {};
        state.isExamSubmitted = !!parsed.isExamSubmitted;
        
        // Build navigation UI
        buildGridNavigator();
        
        if (state.isExamSubmitted) {
          // Submitted results screen
          initializeSelfGradingList();
          calculateScores();
          switchScreen("screen-results");
        } else {
          // Active exam screen - Resume timer!
          renderQuestion();
          switchScreen("screen-exam");
          updateTimerDisplay();
          
          if (state.timerInterval) clearInterval(state.timerInterval);
          state.timerInterval = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            saveAppState(); // save remaining time on each tick!
            
            if (state.timeLeft <= 0) {
              clearInterval(state.timerInterval);
              alert("Time is up! Submitting your exam.");
              submitExam();
            }
          }, 1000);
        }
        return true;
      }
    } catch (e) {
      console.error("Error loading app state:", e);
      localStorage.removeItem("cbeh_app_state_v1");
    }
    return false;
  }

  // Analytics Dashboard Calculation & Render Engine
  function updateAnalyticsUI() {
    const avgGradeEl = document.getElementById("analytics-avg-grade");
    const passRateEl = document.getElementById("analytics-pass-rate");
    const attemptsEl = document.getElementById("analytics-attempts");
    const calloutEl = document.getElementById("analytics-callout-msg");
    const historyList = document.getElementById("analytics-history-list");
    
    if (!avgGradeEl) return;
    
    if (!state.history || state.history.length === 0) {
      avgGradeEl.textContent = "-- / 30";
      passRateEl.textContent = "--%";
      attemptsEl.textContent = "0";
      calloutEl.innerHTML = `<p style="margin: 0; text-align: center; color: var(--text-muted);">Complete an exam to see your weakest vs strongest module.</p>`;
      historyList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1rem;">No exam attempts recorded yet.</p>`;
      return;
    }
    
    attemptsEl.textContent = state.history.length;
    
    let passCount = 0;
    let validGradeSum = 0;
    let validGradeCount = 0;
    
    let totalModuleStats = {
      "Cell Biology": { score: 0, total: 0 },
      "Histology": { score: 0, total: 0 },
      "Embryology": { score: 0, total: 0 },
      "Interdisciplinary": { score: 0, total: 0 }
    };
    
    historyList.innerHTML = "";
    
    const sortedHistory = [...state.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedHistory.forEach(attempt => {
      if (attempt.isPassed) passCount++;
      
      let numGrade = parseFloat(attempt.grade.replace("L", ""));
      if (!isNaN(numGrade)) {
        if (attempt.grade === "30L") numGrade = 31;
        validGradeSum += numGrade;
        validGradeCount++;
      }
      
      if (attempt.moduleScores) {
        for (let mod in totalModuleStats) {
          if (attempt.moduleScores[mod]) {
            totalModuleStats[mod].score += attempt.moduleScores[mod].score;
            totalModuleStats[mod].total += attempt.moduleScores[mod].total;
          }
        }
      }
      
      const dateStr = new Date(attempt.date).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const itemHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.5rem; background: rgba(255,255,255,0.02);">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">${attempt.mode} <span style="font-weight: normal; color: var(--text-muted); font-size: 0.8rem;">— ${dateStr}</span></div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Score: ${attempt.totalScore}/${attempt.totalQuestions}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: ${attempt.isPassed ? 'var(--color-primary)' : '#f87171'};">${attempt.isPassed ? 'PASS' : 'FAIL'}</div>
            <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">Grade: ${attempt.grade}</div>
          </div>
        </div>
      `;
      historyList.innerHTML += itemHTML;
    });
    
    const passRate = (passCount / state.history.length) * 100;
    passRateEl.textContent = `${passRate.toFixed(1)}%`;
    passRateEl.style.color = passRate >= 60 ? 'var(--color-primary)' : '#f87171';
    
    if (validGradeCount > 0) {
      let avgGrade = validGradeSum / validGradeCount;
      if (avgGrade > 30) avgGrade = 30; // visually cap at 30
      avgGradeEl.textContent = `${avgGrade.toFixed(1)} / 30`;
    }
    
    let strongestMod = "";
    let strongestPct = -1;
    let weakestMod = "";
    let weakestPct = 101;
    
    for (let mod in totalModuleStats) {
      if (totalModuleStats[mod].total > 0) {
        let pct = (totalModuleStats[mod].score / totalModuleStats[mod].total) * 100;
        if (pct > strongestPct) {
          strongestPct = pct;
          strongestMod = mod;
        }
        if (pct < weakestPct) {
          weakestPct = pct;
          weakestMod = mod;
        }
      }
    }
    
    if (strongestMod && weakestMod) {
      calloutEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; gap: 1rem; text-align: left;">
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Strongest Module</div>
            <div style="font-weight: 600; color: var(--color-primary); margin-top: 0.25rem;">${strongestMod} (${strongestPct.toFixed(0)}%)</div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Weakest Module</div>
            <div style="font-weight: 600; color: #f87171; margin-top: 0.25rem;">${weakestMod} (${weakestPct.toFixed(0)}%)</div>
          </div>
        </div>
      `;
    }
  }

  // Analytics Reset Trigger
  const btnResetAnalytics = document.getElementById("btn-reset-analytics");
  if (btnResetAnalytics) {
    btnResetAnalytics.addEventListener("click", () => {
      const confirmReset = confirm("Are you sure you want to delete all your exam statistics and history? This cannot be undone.");
      if (confirmReset) {
        state.history = [];
        localStorage.removeItem("cbeh_history");
        updateAnalyticsUI();
      }
    });
  }

  // Invoke state loading and manager UI render on startup
  loadAppState();
  updateSimulationsManagerUI();
  updateAnalyticsUI();

  // Set initial stats UI text in the DOM
  poolStatusCount.textContent = state.questionsPool.length;
  poolStatusSims.textContent = state.uploadedSimulationsCount;
});
