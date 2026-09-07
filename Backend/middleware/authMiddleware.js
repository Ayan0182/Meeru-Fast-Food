const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user from database
    const user = await User.findById(decoded.id)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // IMPORTANT:
    // Role is taken from the database,
    // not trusted from localStorage or frontend.
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();

  } catch (error) {
    console.error(
      "Auth middleware error:",
      error
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


// =====================================
// CUSTOMER ONLY
// =====================================

const requireUser = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({
      message: "Access denied. Customer only",
    });
  }

  next();
};


// =====================================
// ADMIN ONLY
// =====================================

const requireAdmin = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only",
    });
  }

  next();
};


// =====================================
// EXPORT
// =====================================

module.exports = authMiddleware;
module.exports.requireUser = requireUser;
module.exports.requireAdmin = requireAdmin;