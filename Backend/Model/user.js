const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "student",
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    abilityScores: {
      type: DataTypes.TEXT,
      defaultValue: "{}",
      get() {
        try {
          return JSON.parse(this.getDataValue("abilityScores") || "{}");
        } catch {
          return {};
        }
      },
      set(val) {
        this.setDataValue("abilityScores", JSON.stringify(val || {}));
      },
    },
    overallRating: {
      type: DataTypes.FLOAT,
      defaultValue: 1000,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

User.prototype.toPublicJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    overallRating: this.overallRating,
    abilityScores: this.abilityScores,
    createdAt: this.createdAt,
  };
};

// Export the model directly — NOT as { User }
module.exports = User;