const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Question } = require("../Model");
const { protect, authorize } = require("../MiddleWare/auth");
const {
  classifyDifficulty,
  generateQuestions,
} = require("../AIservices/aiServices");

router.use(protect);

// GET /api/questions
router.get("/", authorize("teacher", "admin"), async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.query.subject) where.subject = req.query.subject.toLowerCase();
    if (req.query.topic) where.topic = req.query.topic.toLowerCase();
    if (req.query.difficulty) where.difficulty = Number(req.query.difficulty);

    const questions = await Question.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/questions — create one question manually
router.post("/", authorize("teacher", "admin"), async (req, res) => {
  try {
    const data = { ...req.body, createdById: req.user.id };
    if (!data.difficulty) {
      data.difficulty = await classifyDifficulty(data.text, data.subject);
    }
    // Normalise case
    if (data.subject) data.subject = data.subject.toLowerCase();
    if (data.topic) data.topic = data.topic.toLowerCase();

    const question = await Question.create(data);
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/questions/generate — AI generate questions
router.post("/generate", authorize("teacher", "admin"), async (req, res) => {
  try {
    const { topic, subject, difficulty, count } = req.body;
    const result = await generateQuestions(
      topic,
      subject,
      difficulty,
      count || 5
    );
    if (!result.success)
      return res
        .status(500)
        .json({ success: false, message: "AI generation failed" });

    const toSave = result.questions.map((q) => ({
      ...q,
      createdById: req.user.id,
      aiGenerated: true,
      subject: subject.toLowerCase(),
      topic: topic.toLowerCase(),
    }));
    const saved = await Question.bulkCreate(toSave);
    res
      .status(201)
      .json({ success: true, count: saved.length, questions: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/questions/:id
router.put("/:id", authorize("teacher", "admin"), async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.id);
    if (!q)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    await q.update(req.body);
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/questions/:id (soft delete)
router.delete("/:id", authorize("teacher", "admin"), async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.id);
    if (!q)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    await q.update({ isActive: false });
    res.json({ success: true, message: "Question deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
