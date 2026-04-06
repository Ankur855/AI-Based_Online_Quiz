const { Op } = require("sequelize");
const Question = require("../Model/question");
const { updateTheta, selectNextDifficulty, selectBestQuestion } = require("../Utility/irtScoring");

/**
 * Get the next adaptive question for a student.
 * Fixes: always parse arrays before passing to Sequelize Op.notIn / Op.in
 */
const getNextAdaptiveQuestion = async (
  theta,
  subject,
  topics,
  answeredIds,
  adaptiveSettings
) => {
  try {
    const { minDifficulty, maxDifficulty } = selectNextDifficulty(theta);

    const min = Math.max(minDifficulty, adaptiveSettings?.minDifficulty || 1);
    const max = Math.min(maxDifficulty, adaptiveSettings?.maxDifficulty || 5);

    // ── CRITICAL FIX ──────────────────────────────────────────
    // Always ensure these are real JS arrays, not JSON strings
    // SQLite stores arrays as "[1,2,3]" strings — parse them first
    const safeAnsweredIds = parseToArray(answeredIds);
    const safeTopics      = parseToArray(topics);
    // ──────────────────────────────────────────────────────────

    // Build the where clause
    const where = {
      subject:    subject.toLowerCase(),
      difficulty: { [Op.between]: [min, max] },
      isActive:   true,
    };

    // Only add notIn if there are answered questions
    if (safeAnsweredIds.length > 0) {
      where.id = { [Op.notIn]: safeAnsweredIds };
    }

    // Only filter by topic if topics array is not empty
    if (safeTopics.length > 0) {
      where.topic = { [Op.in]: safeTopics };
    }

    let candidates = await Question.findAll({ where, raw: true });

    // Fallback: widen difficulty range if no candidates found
    if (candidates.length === 0) {
      const fallbackWhere = {
        subject:  subject.toLowerCase(),
        isActive: true,
      };
      if (safeAnsweredIds.length > 0) {
        fallbackWhere.id = { [Op.notIn]: safeAnsweredIds };
      }
      candidates = await Question.findAll({ where: fallbackWhere, raw: true });
    }

    if (candidates.length === 0) return null;

    return selectBestQuestion(theta, candidates);
  } catch (error) {
    console.error("getNextAdaptiveQuestion error:", error.message);
    return null;
  }
};

/**
 * Process one answer and update theta using IRT.
 */
const processAnswer = (question, isCorrect, currentTheta) => {
  const abilityBefore = currentTheta;
  const newTheta = updateTheta(
    currentTheta,
    question.difficulty,
    isCorrect,
    question.discrimination || 1.0
  );
  return { newTheta, abilityBefore, abilityAfter: newTheta };
};

/**
 * Calculate per-topic performance from answers array.
 */
const calculateTopicBreakdown = (answers) => {
  const safeAnswers = parseToArray(answers);
  const breakdown = {};

  for (const answer of safeAnswers) {
    const topic = answer.questionTopic || "unknown";
    if (!breakdown[topic]) {
      breakdown[topic] = { correct: 0, total: 0, percent: 0 };
    }
    breakdown[topic].total++;
    if (answer.isCorrect) breakdown[topic].correct++;
  }

  for (const topic in breakdown) {
    const { correct, total } = breakdown[topic];
    breakdown[topic].percent = Math.round((correct / total) * 100);
  }

  return breakdown;
};

/**
 * Helper: safely parse a value into a real JS array.
 * Handles: actual arrays, JSON strings, undefined, null.
 */
const parseToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

module.exports = {
  getNextAdaptiveQuestion,
  processAnswer,
  calculateTopicBreakdown,
  parseToArray,
};