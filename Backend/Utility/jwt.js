const jwt = require("jsonwebtoken");

// Generate access token (short-lived)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Generate refresh token (long-lived)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// Verify token and return payload
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
