const User = require("./user");
const Question = require("./question");
const Quiz = require("./quiz");
const Notification = require("./notification");
const Attempt = require("./score_Attempt"); // or whatever your file name is

// ── Relationships ─────────────────────────────────

// User → Question (teacher creates questions)
User.hasMany(Question, { foreignKey: "createdById" });
Question.belongsTo(User, { foreignKey: "createdById" });

// User → Quiz (teacher creates quiz)
User.hasMany(Quiz, { foreignKey: "createdById" });
Quiz.belongsTo(User, { foreignKey: "createdById" });

// Quiz ↔ Question (Many-to-Many)
Quiz.belongsToMany(Question, { through: "QuizQuestions" });
Question.belongsToMany(Quiz, { through: "QuizQuestions" });

// User → Attempt (student attempts quiz)
User.hasMany(Attempt, { foreignKey: "userId" });
Attempt.belongsTo(User, { foreignKey: "userId" });

// Quiz → Attempt
Quiz.hasMany(Attempt, { foreignKey: "quizId" });
Attempt.belongsTo(Quiz, { foreignKey: "quizId" });

// User → Notification
User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

// ── Export ────────────────────────────────────────
module.exports = {
  User,
  Question,
  Quiz,
  Notification,
  Attempt,
};
