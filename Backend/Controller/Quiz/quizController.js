const { Op } = require("sequelize");
const { Quiz, Score, User } = require("../models");

// GET /api/quizzes
const getQuizzes = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === "teacher") {
      where.createdById = req.user.id;
    } else if (req.user.role === "student") {
      where.status = "published";
    }

    const quizzes = await Quiz.findAll({
      where,
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // For students: filter to quizzes assigned to them OR open to all
    let filtered = quizzes;
    if (req.user.role === "student") {
      filtered = quizzes.filter((q) => {
        const assigned = q.assignedTo;
        return assigned.length === 0 || assigned.includes(req.user.id);
      });
    }

    res.json({ success: true, count: filtered.length, quizzes: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/quizzes/:id
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/quizzes
const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdById: req.user.id });
    res.status(201).json({ success: true, quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    if (quiz.createdById !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorised" });

    await quiz.update(req.body);
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    if (quiz.createdById !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorised" });

    await quiz.destroy();
    res.json({ success: true, message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/quizzes/:id/stats
const getQuizStats = async (req, res) => {
  try {
    const scores = await Score.findAll({
      where: { quizId: req.params.id, status: "completed" },
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
      ],
    });

    const total = scores.length;
    const avg = total
      ? Math.round(scores.reduce((s, r) => s + r.scorePercent, 0) / total)
      : 0;
    const passed = scores.filter((s) => s.passed).length;

    res.json({
      success: true,
      stats: {
        totalAttempts: total,
        averageScore: avg,
        passRate: total ? Math.round((passed / total) * 100) : 0,
        scores: scores.map((s) => ({
          student: s.student,
          score: s.scorePercent,
          passed: s.passed,
          date: s.submittedAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizStats,
};
