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
    },
    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
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
        this.setDataValue(
          "answers",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
      },
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
        this.setDataValue(
          "difficultyProgression",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
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
        this.setDataValue(
          "topicBreakdown",
          typeof val === "string" ? val : JSON.stringify(val || {})
        );
      },
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "in_progress",
      // values: 'in_progress', 'completed', 'timed_out', 'abandoned'
    },
  },
  {
    tableName: "scores",
    timestamps: true,
    hooks: {
      beforeSave: (score) => {
        const answers = score.answers || [];
        if (answers.length > 0 && score.totalQuestions > 0) {
          score.correctAnswers = answers.filter((a) => a.isCorrect).length;
          score.scorePercent = Math.round(
            (score.correctAnswers / score.totalQuestions) * 100
          );
        }
      },
    },
  }
);

// Export the model directly — NOT as { Score }
module.exports = Score;