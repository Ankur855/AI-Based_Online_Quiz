const { verifyToken } = require("../Utility/jwt");
const  User  = require("../Model/user");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorised — no token",
      });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token invalid or expired",
      });
    }

    // Use findOne with where clause — more reliable than findByPk
    // when Sequelize model is loaded independently
    const userId = parseInt(decoded.id, 10);
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found — please login again",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication: " + error.message,
    });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed`,
      });
    }
    next();
  };

module.exports = { protect, authorize };