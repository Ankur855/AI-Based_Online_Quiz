const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Quiz = sequelize.define(
  "Quiz",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    topics: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("topics") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue(
          "topics",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
      },
    },
    mode: {
      type: DataTypes.STRING,
      defaultValue: "adaptive",
      // values: 'adaptive', 'fixed', 'practice'
    },
    fixedQuestionIds: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("fixedQuestionIds") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue(
          "fixedQuestionIds",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
      },
    },
    adaptiveSettings: {
      type: DataTypes.TEXT,
      defaultValue: JSON.stringify({
        totalQuestions: 10,
        startingDifficulty: 3,
        minDifficulty: 1,
        maxDifficulty: 5,
      }),
      get() {
        try {
          return JSON.parse(this.getDataValue("adaptiveSettings"));
        } catch {
          return {
            totalQuestions: 10,
            startingDifficulty: 3,
            minDifficulty: 1,
            maxDifficulty: 5,
          };
        }
      },
      set(val) {
        this.setDataValue(
          "adaptiveSettings",
          typeof val === "string" ? val : JSON.stringify(val)
        );
      },
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    assignedTo: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("assignedTo") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue(
          "assignedTo",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
      },
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "draft",
      // values: 'draft', 'published', 'archived'
    },
    passingScore: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
    showResultsImmediately: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allowReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    totalAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    averageScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    tableName: "quizzes",
    timestamps: true,
  }
);

// Export the model directly — NOT as { Quiz }
module.exports = Quiz;