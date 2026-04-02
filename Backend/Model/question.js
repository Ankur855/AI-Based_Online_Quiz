const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    type: {
      type: DataTypes.ENUM("mcq", "true_false", "short_answer"),
      defaultValue: "mcq",
    },
    // Stored as JSON string: [{ text, isCorrect }, ...]
    options: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("options") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue("options", JSON.stringify(val || []));
      },
    },
    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: true, // only for short_answer type
    },
    explanation: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    topic: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
    },
    discrimination: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0, // IRT a-parameter
    },
    timesAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    timesCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    averageTimeSeconds: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tags: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        try {
          return JSON.parse(this.getDataValue("tags") || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue("tags", JSON.stringify(val || []));
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "questions",
    timestamps: true,
    indexes: [
      { fields: ["topic", "difficulty", "isActive"] },
      { fields: ["subject", "isActive"] },
    ],
  }
);

// Virtual: success rate
Question.prototype.getSuccessRate = function () {
  if (this.timesAnswered === 0) return null;
  return Math.round((this.timesCorrect / this.timesAnswered) * 100);
};

module.exports = Question;
