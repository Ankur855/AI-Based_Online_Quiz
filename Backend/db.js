const { Sequelize } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database.sqlite"),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite connected — database.sqlite");

    // sync without alter — just creates tables if they don't exist
    // never drops or modifies existing data
    await sequelize.sync({ force: false });
    console.log("✅ All tables ready");
  } catch (error) {
    console.error("❌ SQLite connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
