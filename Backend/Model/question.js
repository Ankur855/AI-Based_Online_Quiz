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
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: "mcq",
      // values: 'mcq', 'true_false', 'short_answer'
    },
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
        this.setDataValue(
          "options",
          typeof val === "string" ? val : JSON.stringify(val || [])
        );
      },
    },
    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    explanation: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    topic: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    discrimination: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
    },
    timesAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    timesCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "questions",
    timestamps: true,
  }
);

// Export the model directly — NOT as { Question }
module.exports = Question;