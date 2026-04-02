const { Sequelize } = require("sequelize");
const path = require("path");

// SQLite database file lives at backend/database.sqlite
// No installation needed — it's just a single file!
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database.sqlite"),
  logging:
    process.env.NODE_ENV === "development"
      ? (msg) => console.log("🗄 ", msg)
      : false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite connected — database.sqlite");

    // sync({ alter: true }) updates tables to match models without dropping data
    // In production you'd use migrations instead
    await sequelize.sync({ alter: true });
    console.log("✅ All tables synced");
  } catch (error) {
    console.error("❌ SQLite connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
