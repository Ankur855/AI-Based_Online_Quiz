const express = require("express");
const router = express.Router();
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizStats,
} = require("../Controller/Quiz/quizController");
const { protect, authorize } = require("../MiddleWare/auth");

router.use(protect); // all quiz routes require login

router.get("/", getQuizzes);
router.get("/:id", getQuiz);
router.get("/:id/stats", authorize("teacher", "admin"), getQuizStats);
router.post("/", authorize("teacher", "admin"), createQuiz);
router.put("/:id", authorize("teacher", "admin"), updateQuiz);
router.delete("/:id", authorize("teacher", "admin"), deleteQuiz);

module.exports = router;
