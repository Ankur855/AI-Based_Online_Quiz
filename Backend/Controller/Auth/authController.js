const { User } = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  res
    .status(statusCode)
    .json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toPublicJSON(),
    });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const assignedRole = role === "admin" ? "student" : role || "student";

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Registration failed" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const ok = await user.matchPassword(password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded)
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });

    const user = await User.findByPk(decoded.id);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found" });

    const accessToken = generateAccessToken(user.id, user.role);
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/updatepassword
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const ok = await user.matchPassword(currentPassword);
    if (!ok)
      return res
        .status(400)
        .json({ success: false, message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, refreshToken, getMe, updatePassword };
