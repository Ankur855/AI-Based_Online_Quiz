const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

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
      validate: { notEmpty: true, len: [2, 200] },
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // JSON array of topic strings: ["algebra", "calculus"]
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
        this.setDataValue("topics", JSON.stringify(val || []));
      },
    },
    mode: {
      type: DataTypes.ENUM("adaptive", "fixed", "practice"),
      defaultValue: "adaptive",
    },
    // For fixed mode — JSON array of question IDs
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
        this.setDataValue("fixedQuestionIds", JSON.stringify(val || []));
      },
    },
    // Adaptive mode settings stored as JSON
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
        this.setDataValue("adaptiveSettings", JSON.stringify(val));
      },
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    // JSON array of user IDs assigned: [1, 2, 3]
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
        this.setDataValue("assignedTo", JSON.stringify(val || []));
      },
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      defaultValue: "draft",
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endsAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    indexes: [
      { fields: ["createdById", "status"] },
      { fields: ["subject", "status"] },
    ],
  }
);

module.exports = Quiz;
