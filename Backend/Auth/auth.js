/**
 * IRT (Item Response Theory) - 1-Parameter Logistic Model
 * Used to estimate student ability (theta) and select optimal questions.
 *
 * theta  = student ability score (typically -3 to +3, starts at 0)
 * b      = question difficulty (we map our 1-5 scale to -2 to +2)
 * a      = discrimination parameter (how well question separates abilities)
 */

// Map difficulty 1-5 to IRT b-parameter -2 to +2
const difficultyToB = (difficulty) => {
  return difficulty - 3; // 1→-2, 2→-1, 3→0, 4→1, 5→2
};

// Probability of correct response: P(theta) = 1 / (1 + e^(-a*(theta - b)))
const probabilityCorrect = (theta, b, a = 1.0) => {
  return 1 / (1 + Math.exp(-a * (theta - b)));
};

/**
 * Update student theta after answering a question.
 * Uses simplified MLE update (gradient step).
 *
 * @param {number} theta - current ability estimate
 * @param {number} difficulty - question difficulty (1–5)
 * @param {boolean} isCorrect - did the student answer correctly?
 * @param {number} discrimination - question's a-parameter
 * @returns {number} updated theta
 */
const updateTheta = (theta, difficulty, isCorrect, discrimination = 1.0) => {
  const b = difficultyToB(difficulty);
  const p = probabilityCorrect(theta, b, discrimination);
  const response = isCorrect ? 1 : 0;

  // Step size controls how fast theta changes (learning rate)
  const learningRate = 0.5;
  const delta = learningRate * discrimination * (response - p);

  const newTheta = theta + delta;

  // Clamp to realistic range
  return Math.max(-4, Math.min(4, newTheta));
};

/**
 * Select the best next question difficulty for a student.
 * Picks difficulty closest to student's current ability.
 *
 * @param {number} theta - student's current ability
 * @returns {object} { minDifficulty, maxDifficulty, targetDifficulty }
 */
const selectNextDifficulty = (theta) => {
  // Map theta back to 1–5 scale
  const raw = theta + 3; // -2→1, 0→3, +2→5
  const target = Math.round(Math.min(5, Math.max(1, raw)));

  return {
    targetDifficulty: target,
    minDifficulty: Math.max(1, target - 1),
    maxDifficulty: Math.min(5, target + 1),
  };
};

/**
 * Calculate information value of a question for a student.
 * Higher = question tells us more about the student's true ability.
 * Used to pick the MOST informative question when multiple options exist.
 */
const questionInformation = (theta, difficulty, discrimination = 1.0) => {
  const b = difficultyToB(difficulty);
  const p = probabilityCorrect(theta, b, discrimination);
  const q = 1 - p;
  return discrimination ** 2 * p * q;
};

/**
 * Pick the best question from a list based on student theta.
 * @param {number} theta - student ability
 * @param {Array} questions - array of question objects with .difficulty and .discrimination
 * @returns {object} the most informative question
 */
const selectBestQuestion = (theta, questions) => {
  if (!questions || questions.length === 0) return null;

  let best = null;
  let bestInfo = -1;

  for (const q of questions) {
    const info = questionInformation(
      theta,
      q.difficulty,
      q.discrimination || 1.0
    );
    if (info > bestInfo) {
      bestInfo = info;
      best = q;
    }
  }

  return best;
};

/**
 * Estimate student performance level from theta.
 * @param {number} theta
 * @returns {string} label
 */
const abilityLabel = (theta) => {
  if (theta >= 2) return "Expert";
  if (theta >= 1) return "Advanced";
  if (theta >= 0) return "Intermediate";
  if (theta >= -1) return "Beginner";
  return "Novice";
};

module.exports = {
  updateTheta,
  selectNextDifficulty,
  selectBestQuestion,
  questionInformation,
  probabilityCorrect,
  abilityLabel,
  difficultyToB,
};
