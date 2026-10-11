const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Checks the "Authorization: Bearer <token>" header and loads the user.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in to continue" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (!user.isActive) return res.status(403).json({ message: "Account is disabled" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
}

// Only lets the listed roles through, e.g. allowRoles("admin", "faculty")
const allowRoles = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

module.exports = { protect, allowRoles };
