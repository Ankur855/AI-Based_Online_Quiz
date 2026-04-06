const { sequelize } = require("../db");

// Import all models — each file exports the model directly
const User         = require("./user");
const Question     = require("./question");
const Quiz         = require("./quiz");
const Score        = require("./score_Attempt");
const Notification = require("./notification");

// ── Associations ──────────────────────────────────────────────

// Teacher creates Questions
User.hasMany(Question,     { foreignKey: "createdById", as: "createdQuestions" });
Question.belongsTo(User,   { foreignKey: "createdById", as: "creator" });

// Teacher creates Quizzes
User.hasMany(Quiz,         { foreignKey: "createdById", as: "createdQuizzes" });
Quiz.belongsTo(User,       { foreignKey: "createdById", as: "creator" });

// Student attempts Quiz (Score/Attempt)
User.hasMany(Score,        { foreignKey: "studentId",   as: "attempts" });
Score.belongsTo(User,      { foreignKey: "studentId",   as: "student" });

Quiz.hasMany(Score,        { foreignKey: "quizId",      as: "attempts" });
Score.belongsTo(Quiz,      { foreignKey: "quizId",      as: "quiz" });

// Notifications
User.hasMany(Notification, { foreignKey: "recipientId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

module.exports = { sequelize, User, Question, Quiz, Score, Notification };