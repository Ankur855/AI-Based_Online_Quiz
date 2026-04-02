const { Op } = require("sequelize");
const { Question } = require("../Model");
const {
  updateTheta,
  selectNextDifficulty,
  selectBestQuestion,
} = require("../Utility/irtScoring");

/**
 * Get the next adaptive question for a student.
 * Uses IRT theta to find the most informative question.
 */
const getNextAdaptiveQuestion = async (
  theta,
  subject,
  topics,
  answeredIds,
  adaptiveSettings
) => {
  const { minDifficulty, maxDifficulty } = selectNextDifficulty(theta);
  const min = Math.max(minDifficulty, adaptiveSettings.minDifficulty || 1);
  const max = Math.min(maxDifficulty, adaptiveSettings.maxDifficulty || 5);

  const where = {
    subject: subject.toLowerCase(),
    difficulty: { [Op.between]: [min, max] },
    isActive: true,
  };

  // Exclude already-answered questions
  if (answeredIds.length > 0) where.id = { [Op.notIn]: answeredIds };
  // Filter by topic if specified
  if (topics && topics.length > 0) where.topic = { [Op.in]: topics };

  let candidates = await Question.findAll({ where, raw: true });

  if (candidates.length === 0) {
    // Fallback: any unanswered question in this subject
    const fallbackWhere = { subject: subject.toLowerCase(), isActive: true };
    if (answeredIds.length > 0) fallbackWhere.id = { [Op.notIn]: answeredIds };
    candidates = await Question.findAll({ where: fallbackWhere, raw: true });
  }

  return selectBestQuestion(theta, candidates);
};

/**
 * Process one answer: update theta using IRT.
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
 * Each answer must have question.topic attached.
 */
const calculateTopicBreakdown = (answers) => {
  const breakdown = {};
  for (const answer of answers) {
    const topic = answer.questionTopic || "unknown";
    if (!breakdown[topic])
      breakdown[topic] = { correct: 0, total: 0, percent: 0 };
    breakdown[topic].total++;
    if (answer.isCorrect) breakdown[topic].correct++;
  }
  for (const topic in breakdown) {
    const { correct, total } = breakdown[topic];
    breakdown[topic].percent = Math.round((correct / total) * 100);
  }
  return breakdown;
};

module.exports = {
  getNextAdaptiveQuestion,
  processAnswer,
  calculateTopicBreakdown,
};
