/**
 * Adaptive trivia game engine — ports SimulateGame + GameController logic.
 */
class TriviaGame {
  constructor(settings) {
    this.settings = settings;
    this.resetState();
  }

  resetState() {
    this.mediumQuestions = [];
    this.hardQuestions = new MaxHeap();
    this.easyQuestions = new MinHeap();
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.wrongStreak = 0;
    this.correctStreak = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.totalPossibleScore = 0;
    this.currentQuestion = null;
    this.categoryName = "";
    this.answered = false;
  }

  async loadCategory(categoryId, categoryName) {
    this.resetState();
    this.categoryName = categoryName;

    const response = await fetch(`data/${categoryId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load questions for ${categoryName}`);
    }

    const questions = await response.json();
    for (const question of questions) {
      if (question.difficulty === 10) {
        this.mediumQuestions.push(question);
      } else if (question.difficulty < 10) {
        this.easyQuestions.push(question);
      } else {
        this.hardQuestions.push(question);
      }
    }

    this.shuffle(this.mediumQuestions);
  }

  shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  getNextQuestion() {
    if (this.currentQuestionIndex >= this.settings.questionsPerGame) {
      return null;
    }

    let question = null;

    if (this.wrongStreak >= 3 && !this.easyQuestions.isEmpty()) {
      question = this.easyQuestions.pop();
    } else if (this.correctStreak >= 3 && !this.hardQuestions.isEmpty()) {
      question = this.hardQuestions.pop();
      this.correctStreak = 0;
    } else if (this.mediumQuestions.length > 0) {
      question = this.mediumQuestions.pop();
    } else {
      return null;
    }

    this.currentQuestion = question;
    this.totalPossibleScore += this.getQuestionScore(question);
    this.currentQuestionIndex += 1;
    this.answered = false;
    return question;
  }

  checkAnswer(answerIndex) {
    if (!this.currentQuestion || this.answered) {
      return { isCorrect: false, timedOut: false };
    }

    this.answered = true;
    const timedOut = answerIndex === -1;
    const isCorrect = !timedOut && answerIndex === this.currentQuestion.correctIndex;

    if (isCorrect) {
      this.score += this.getQuestionScore(this.currentQuestion);
      this.correctStreak += 1;
      this.wrongStreak = 0;
      this.correctAnswers += 1;
    } else {
      this.wrongStreak += 1;
      this.correctStreak = 0;
      this.wrongAnswers += 1;
    }

    return { isCorrect, timedOut };
  }

  getQuestionScore(question) {
    if (question.difficulty === 10) {
      return 10;
    }
    if (question.difficulty < 10) {
      return 5;
    }
    return 20;
  }

  getDifficultyLabel(question) {
    if (question.difficulty === 10) {
      return "Medium";
    }
    if (question.difficulty < 10) {
      return "Easy";
    }
    return "Hard";
  }

  getDifficultyClass(question) {
    const label = this.getDifficultyLabel(question).toLowerCase();
    return `pill-${label}`;
  }

  isGameOver() {
    return this.currentQuestionIndex >= this.settings.questionsPerGame;
  }

  getScorePercentage() {
    if (this.totalPossibleScore === 0) {
      return 0;
    }
    return Math.round((this.score * 100) / this.totalPossibleScore);
  }

  getPerformanceMessage() {
    const percentage = this.getScorePercentage();
    if (percentage >= 90) {
      return "Outstanding! You're a trivia master!";
    }
    if (percentage >= 70) {
      return "Great job! You know your stuff!";
    }
    if (percentage >= 50) {
      return "Good effort! Keep practicing!";
    }
    return "Keep studying — you'll get better!";
  }
}

window.TriviaGame = TriviaGame;
