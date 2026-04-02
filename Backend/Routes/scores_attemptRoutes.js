const express = require("express");
const router = express.Router();
const { Score, Quiz, Question, User } = require("../Model");
const { protect } = require("../MiddleWare/auth");
const {
  getNextAdaptiveQuestion,
  processAnswer,
  calculateTopicBreakdown,
} = require("../AIservices/adaptiveServices");
const {
  generateFeedbackSummary,
  generateHint,
} = require("../AIservices/aiServices");
const { abilityLabel } = require("../Utility/irtScoring");

// ── Helpers ────────────────────────────────────────────────────────
// Strip correct answer info before sending question to student
const sanitizeQuestion = (q) => {
  if (!q) return null;
  const safe = { ...q };
  if (safe.options) {
    safe.options = (
      typeof safe.options === "string" ? JSON.parse(safe.options) : safe.options
    ).map(({ text, id, _id }) => ({ text, id, _id })); // remove isCorrect
  }
  delete safe.correctAnswer;
  delete safe.explanation;
  return safe;
};

// POST /api/scores/start/:quizId
router.post("/start/:quizId", protect, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    if (quiz.status !== "published")
      return res
        .status(400)
        .json({ success: false, message: "Quiz not published" });

    const adaptiveSettings = quiz.adaptiveSettings;

    // Check max attempts
    if (quiz.maxAttempts > 0) {
      const done = await Score.count({
        where: { studentId: req.user.id, quizId: quiz.id, status: "completed" },
      });
      if (done >= quiz.maxAttempts)
        return res
          .status(400)
          .json({ success: false, message: "Maximum attempts reached" });
    }

    const student = await User.findByPk(req.user.id);
    const abilityScores = student.abilityScores;
    const theta = abilityScores[quiz.subject] || 0;

    const attemptNumber =
      (await Score.count({
        where: { studentId: req.user.id, quizId: quiz.id },
      })) + 1;
    const totalQuestions =
      quiz.mode === "adaptive"
        ? adaptiveSettings.totalQuestions
        : (quiz.fixedQuestionIds || []).length;

    const score = await Score.create({
      studentId: req.user.id,
      quizId: quiz.id,
      totalQuestions,
      startedAt: new Date(),
      startingAbility: theta,
      finalAbility: theta,
      attemptNumber,
      status: "in_progress",
    });

    let firstQuestion;
    if (quiz.mode === "adaptive") {
      firstQuestion = await getNextAdaptiveQuestion(
        theta,
        quiz.subject,
        quiz.topics,
        [],
        adaptiveSettings
      );
    } else {
      const ids = quiz.fixedQuestionIds;
      firstQuestion = ids.length
        ? await Question.findByPk(ids[0], { raw: true })
        : null;
    }

    res.status(201).json({
      success: true,
      attemptId: score.id,
      question: sanitizeQuestion(firstQuestion),
      questionNumber: 1,
      totalQuestions,
      theta,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/scores/:attemptId/answer
router.post("/:attemptId/answer", protect, async (req, res) => {
  try {
    const { questionId, selectedOption, textAnswer, timeTakenSeconds } =
      req.body;

    const score = await Score.findByPk(req.params.attemptId);
    if (!score)
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found" });
    if (score.studentId !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Not your attempt" });
    if (score.status !== "in_progress")
      return res
        .status(400)
        .json({ success: false, message: "Attempt already completed" });

    const question = await Question.findByPk(questionId, { raw: true });
    if (!question)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    // Parse options if stored as string
    const options =
      typeof question.options === "string"
        ? JSON.parse(question.options)
        : question.options;

    // Check already answered
    const currentAnswers = score.answers;
    if (currentAnswers.find((a) => a.questionId == questionId))
      return res
        .status(400)
        .json({ success: false, message: "Already answered this question" });

    // Grade answer
    let isCorrect = false;
    if (question.type === "mcq" || question.type === "true_false") {
      const correct = options.find((o) => o.isCorrect);
      isCorrect = correct && correct.text === selectedOption;
    } else if (question.type === "short_answer") {
      isCorrect =
        question.correctAnswer &&
        question.correctAnswer.toLowerCase().trim() ===
          (textAnswer || "").toLowerCase().trim();
    }

    const { newTheta, abilityBefore, abilityAfter } = processAnswer(
      question,
      isCorrect,
      score.finalAbility
    );

    // Append answer
    const newAnswers = [
      ...currentAnswers,
      {
        questionId,
        questionTopic: question.topic,
        selectedOption,
        textAnswer,
        isCorrect,
        timeTakenSeconds: timeTakenSeconds || 0,
        difficulty: question.difficulty,
        abilityBefore,
        abilityAfter,
      },
    ];

    // Update question stats
    await Question.update(
      {
        timesAnswered: question.timesAnswered + 1,
        timesCorrect: question.timesCorrect + (isCorrect ? 1 : 0),
      },
      { where: { id: questionId } }
    );

    const diffProg = [...score.difficultyProgression, question.difficulty];
    const isComplete = newAnswers.length >= score.totalQuestions;

    await score.update({
      answers: newAnswers,
      finalAbility: newTheta,
      difficultyProgression: diffProg,
    });

    const correctOption = options.find((o) => o.isCorrect);
    const correctText = correctOption?.text || question.correctAnswer;

    if (isComplete) {
      return res.json({
        success: true,
        isCorrect,
        correct: correctText,
        explanation: question.explanation,
        newTheta,
        isComplete: true,
        message: "Quiz complete! Call POST /finish to get results.",
      });
    }

    // Get next question
    const quiz = await Quiz.findByPk(score.quizId);
    const answeredIds = newAnswers.map((a) => a.questionId);
    let nextQuestion;

    if (quiz.mode === "adaptive") {
      nextQuestion = await getNextAdaptiveQuestion(
        newTheta,
        quiz.subject,
        quiz.topics,
        answeredIds,
        quiz.adaptiveSettings
      );
    } else {
      const nextId = quiz.fixedQuestionIds[newAnswers.length];
      nextQuestion = nextId
        ? await Question.findByPk(nextId, { raw: true })
        : null;
    }

    res.json({
      success: true,
      isCorrect,
      correct: correctText,
      explanation: question.explanation,
      newTheta,
      abilityLevel: abilityLabel(newTheta),
      isComplete: false,
      question: sanitizeQuestion(nextQuestion),
      questionNumber: newAnswers.length + 1,
      totalQuestions: score.totalQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/scores/:attemptId/finish
router.post("/:attemptId/finish", protect, async (req, res) => {
  try {
    const score = await Score.findByPk(req.params.attemptId);
    if (!score)
      return res
        .status(404)
        .json({ success: false, message: "Attempt not found" });
    if (score.studentId !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Not your attempt" });

    const quiz = await Quiz.findByPk(score.quizId);
    const student = await User.findByPk(req.user.id);

    const topicBreakdown = calculateTopicBreakdown(score.answers);
    const submittedAt = new Date();
    const timeTaken = Math.round(
      (submittedAt - new Date(score.startedAt)) / 60000
    );
    const passed = score.scorePercent >= (quiz.passingScore || 60);
    const level = abilityLabel(score.finalAbility);

    const aiFeedback = await generateFeedbackSummary(
      student.name,
      score.scorePercent,
      topicBreakdown,
      level
    );

    await score.update({
      topicBreakdown,
      submittedAt,
      timeTakenMinutes: timeTaken,
      passed,
      status: "completed",
      aiFeedback,
    });

    // Update student's ability for this subject
    const updated = {
      ...student.abilityScores,
      [quiz.subject]: score.finalAbility,
    };
    await student.update({ abilityScores: updated });

    await quiz.update({ totalAttempts: quiz.totalAttempts + 1 });

    res.json({
      success: true,
      result: {
        scorePercent: score.scorePercent,
        correctAnswers: score.correctAnswers,
        totalQuestions: score.totalQuestions,
        passed,
        timeTakenMinutes: timeTaken,
        finalAbility: score.finalAbility,
        abilityLevel: level,
        topicBreakdown,
        aiFeedback,
        difficultyProgression: score.difficultyProgression,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/scores/hint/:questionId
router.get("/hint/:questionId", protect, async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.questionId);
    if (!q)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    const hint = await generateHint(q.text, q.options);
    res.json({ success: true, hint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/scores/my
router.get("/my", protect, async (req, res) => {
  try {
    const scores = await Score.findAll({
      where: { studentId: req.user.id, status: "completed" },
      include: [
        { model: Quiz, as: "quiz", attributes: ["id", "title", "subject"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    res.json({ success: true, scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
