const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    type: {
      type: DataTypes.ENUM(
        "quiz_assigned",
        "quiz_starting_soon",
        "quiz_result",
        "achievement",
        "system"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    relatedQuizId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "quizzes", key: "id" },
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    indexes: [{ fields: ["recipientId", "isRead"] }],
  }
);

module.exports = Notification;
