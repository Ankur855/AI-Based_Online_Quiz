const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Score = sequelize.define(
  "Score",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "quizzes", key: "id" },
    },
    // Full answers array stored as JSON
    // Each item: { questionId, selectedOption, textAnswer, isCorrect,
    //              timeTakenSeconds, difficulty, abilityBefore, abilityAfter, hintUsed }
    answers: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("answers") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue("answers", JSON.stringify(val || []));
      },
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    scorePercent: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    passed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timeTakenMinutes: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    startingAbility: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    finalAbility: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    difficultyProgression: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("difficultyProgression") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue("difficultyProgression", JSON.stringify(val || []));
      },
    },
    aiFeedback: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    topicBreakdown: {
      type: DataTypes.TEXT,
      defaultValue: "{}",
      get() {
        try {
          return JSON.parse(this.getDataValue("topicBreakdown") || "{}");
        } catch {
          return {};
        }
      },
      set(val) {
        this.setDataValue("topicBreakdown", JSON.stringify(val || {}));
      },
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM(
        "in_progress",
        "completed",
        "timed_out",
        "abandoned"
      ),
      defaultValue: "in_progress",
    },
  },
  {
    tableName: "scores",
    timestamps: true,
    hooks: {
      // Auto-calculate scorePercent before every save
      beforeSave: (score) => {
        const answers = score.answers || [];
        if (answers.length > 0) {
          score.correctAnswers = answers.filter((a) => a.isCorrect).length;
          score.scorePercent = Math.round(
            (score.correctAnswers / score.totalQuestions) * 100
          );
        }
      },
    },
    indexes: [
      { fields: ["studentId", "quizId"] },
      { fields: ["studentId", "createdAt"] },
    ],
  }
);

module.exports = Score;
