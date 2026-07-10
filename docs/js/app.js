const STORAGE_KEY = "adaptive-trivia-settings";
const STATS_KEY = "adaptive-trivia-stats";

const DEFAULT_SETTINGS = {
  questionsPerGame: 15,
  questionTimeLimit: 30,
  autoSubmitOnTimeUp: true,
  darkMode: false,
  username: "Player",
};

const views = {
  landing: document.getElementById("view-landing"),
  categories: document.getElementById("view-categories"),
  game: document.getElementById("view-game"),
  results: document.getElementById("view-results"),
};

let settings = loadSettings();
let stats = loadStats();
let categories = [];
let game = null;
let activeCategory = null;
let timerId = null;
let timerRemaining = 0;
let timerTotal = 0;

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{"gamesPlayed":0,"bestScore":0}');
  } catch {
    return { gamesPlayed: 0, bestScore: 0 };
  }
}

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function applyTheme() {
  document.documentElement.dataset.theme = settings.darkMode ? "dark" : "light";
  document.getElementById("theme-icon").textContent = settings.darkMode ? "☀️" : "🌙";
}

function showView(name) {
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("active", key === name);
  });
}

function setStreakDots(container, count, max = 3) {
  container.innerHTML = "";
  for (let i = 0; i < max; i += 1) {
    const dot = document.createElement("span");
    dot.className = `dot${i < count ? " filled" : ""}`;
    container.appendChild(dot);
  }
}

function updateStreakPanel() {
  setStreakDots(document.getElementById("correct-streak"), game.correctStreak);
  setStreakDots(document.getElementById("wrong-streak"), game.wrongStreak);

  const hint = document.getElementById("streak-hint");
  if (game.correctStreak >= 2) {
    hint.textContent = "One more correct answer unlocks a hard question!";
  } else if (game.wrongStreak >= 2) {
    hint.textContent = "Another miss and you'll get an easier question.";
  } else {
    hint.textContent = "Keep answering to unlock harder questions.";
  }
}

function updateHeroStats() {
  const heroStats = document.getElementById("hero-stats");
  if (stats.gamesPlayed === 0) {
    heroStats.hidden = true;
    return;
  }

  heroStats.hidden = false;
  document.getElementById("stat-best").textContent = `${stats.bestScore}%`;
  document.getElementById("stat-games").textContent = String(stats.gamesPlayed);
}

async function loadCategories() {
  const response = await fetch("data/categories.json");
  categories = await response.json();
  renderCategories();
}

function renderCategories() {
  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";

  categories.forEach((category) => {
    const card = document.createElement("button");
    card.className = "category-card";
    card.type = "button";
    card.style.setProperty("--accent", category.color);
    card.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.name}</span>
      <span class="category-count">${category.count} questions</span>
    `;
    card.addEventListener("click", () => startGame(category));
    grid.appendChild(card);
  });
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateTimerVisual() {
  const progress = document.getElementById("timer-progress");
  const text = document.getElementById("timer-text");
  const circumference = 2 * Math.PI * 18;
  const ratio = timerRemaining / timerTotal;
  progress.style.strokeDasharray = `${circumference}`;
  progress.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
  text.textContent = String(Math.max(timerRemaining, 0));

  progress.classList.toggle("warning", timerRemaining <= 5);
}

function startTimer() {
  stopTimer();
  timerTotal = settings.questionTimeLimit;
  timerRemaining = timerTotal;
  updateTimerVisual();

  timerId = setInterval(() => {
    timerRemaining -= 1;
    updateTimerVisual();

    if (timerRemaining <= 0) {
      stopTimer();
      if (settings.autoSubmitOnTimeUp) {
        handleAnswer(-1);
      }
    }
  }, 1000);
}

function renderQuestion() {
  const question = game.getNextQuestion();
  if (!question) {
    showResults();
    return;
  }

  document.getElementById("game-category").textContent = game.categoryName;
  document.getElementById("game-progress").textContent =
    `Question ${game.currentQuestionIndex} of ${settings.questionsPerGame}`;
  document.getElementById("game-score").textContent = String(game.score);
  document.getElementById("question-text").textContent = question.text;

  const badge = document.getElementById("difficulty-badge");
  const label = game.getDifficultyLabel(question);
  badge.textContent = label;
  badge.className = `difficulty-badge ${game.getDifficultyClass(question)}`;

  const optionsGrid = document.getElementById("options-grid");
  optionsGrid.innerHTML = "";
  const labels = ["A", "B", "C", "D"];

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.innerHTML = `<span class="option-label">${labels[index]}</span><span>${option}</span>`;
    button.addEventListener("click", () => handleAnswer(index));
    optionsGrid.appendChild(button);
  });

  document.getElementById("feedback-banner").hidden = true;
  updateStreakPanel();
  startTimer();
}

function handleAnswer(answerIndex) {
  if (!game || game.answered) {
    return;
  }

  stopTimer();
  const result = game.checkAnswer(answerIndex);
  const question = game.currentQuestion;
  const options = document.querySelectorAll(".option-btn");

  options.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correctIndex) {
      button.classList.add("correct");
    } else if (index === answerIndex && !result.isCorrect) {
      button.classList.add("incorrect");
    }
  });

  const banner = document.getElementById("feedback-banner");
  const feedbackText = document.getElementById("feedback-text");
  banner.hidden = false;

  if (result.isCorrect) {
    banner.className = "feedback-banner success";
    feedbackText.textContent = `Correct! +${game.getQuestionScore(question)} points`;
  } else if (result.timedOut) {
    banner.className = "feedback-banner error";
    feedbackText.textContent = `Time's up! The answer was ${String.fromCharCode(65 + question.correctIndex)}. ${question.options[question.correctIndex]}`;
  } else {
    banner.className = "feedback-banner error";
    feedbackText.textContent = `Incorrect. The answer was ${String.fromCharCode(65 + question.correctIndex)}. ${question.options[question.correctIndex]}`;
  }

  document.getElementById("game-score").textContent = String(game.score);
  updateStreakPanel();
}

function showResults() {
  stopTimer();

  const percentage = game.getScorePercentage();
  stats.gamesPlayed += 1;
  stats.bestScore = Math.max(stats.bestScore, percentage);
  saveStats();
  updateHeroStats();

  document.getElementById("results-title").textContent =
    percentage >= 70 ? "Great run!" : percentage >= 50 ? "Solid effort!" : "Keep going!";
  document.getElementById("results-percent").textContent = `${percentage}%`;
  document.getElementById("results-points").textContent =
    `${game.score} / ${game.totalPossibleScore} pts`;
  document.getElementById("results-correct").textContent = String(game.correctAnswers);
  document.getElementById("results-wrong").textContent = String(game.wrongAnswers);
  document.getElementById("results-category-label").textContent = game.categoryName;
  document.getElementById("results-message").textContent = game.getPerformanceMessage();

  showView("results");
}

async function startGame(category) {
  activeCategory = category;
  game = new TriviaGame(settings);

  try {
    await game.loadCategory(category.id, category.name);
  } catch (error) {
    alert(error.message);
    return;
  }

  showView("game");
  renderQuestion();
}

async function startRandomGame() {
  if (categories.length === 0) {
    await loadCategories();
  }
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  await startGame(randomCategory);
}

function openSettings() {
  document.getElementById("setting-questions").value = settings.questionsPerGame;
  document.getElementById("setting-timer").value = settings.questionTimeLimit;
  document.getElementById("setting-autosubmit").checked = settings.autoSubmitOnTimeUp;
  document.getElementById("setting-username").value = settings.username;
  document.getElementById("settings-modal").showModal();
}

function bindEvents() {
  document.getElementById("play-btn").addEventListener("click", () => showView("categories"));
  document.getElementById("random-btn").addEventListener("click", startRandomGame);
  document.getElementById("settings-btn").addEventListener("click", openSettings);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    settings.darkMode = !settings.darkMode;
    saveSettings();
    applyTheme();
  });

  document.getElementById("next-question-btn").addEventListener("click", () => {
    if (game.isGameOver()) {
      showResults();
    } else {
      renderQuestion();
    }
  });

  document.getElementById("play-again-btn").addEventListener("click", () => {
    if (activeCategory) {
      startGame(activeCategory);
    }
  });

  document.getElementById("quit-game-btn").addEventListener("click", () => {
    if (game && game.currentQuestionIndex > 0) {
      const confirmed = window.confirm("Quit this game? Your progress will be lost.");
      if (!confirmed) {
        return;
      }
    }
    stopTimer();
    showView("categories");
  });

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.nav));
  });

  document.getElementById("save-settings-btn").addEventListener("click", () => {
    settings.questionsPerGame = clamp(
      Number(document.getElementById("setting-questions").value),
      5,
      30
    );
    settings.questionTimeLimit = clamp(
      Number(document.getElementById("setting-timer").value),
      10,
      120
    );
    settings.autoSubmitOnTimeUp = document.getElementById("setting-autosubmit").checked;
    settings.username = document.getElementById("setting-username").value.trim() || "Player";
    saveSettings();
    document.getElementById("settings-modal").close();
  });

  document.getElementById("reset-settings-btn").addEventListener("click", () => {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    applyTheme();
    openSettings();
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function init() {
  applyTheme();
  bindEvents();
  updateHeroStats();
  await loadCategories();
}

init();
