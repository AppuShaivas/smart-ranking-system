const multer = require("multer");

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Turns any thrown error into a clean JSON response.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is larger than 5 MB" : err.field || err.message;
    return res.status(400).json({ message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(", ") });
  }
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid ID" });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return res.status(400).json({ message: `This ${field.toUpperCase() === "USN" ? "USN" : field} is already registered` });
  }
  if (err.expose) return res.status(err.status).json({ message: err.message }); // expected (e.g. wrong password)
  console.error(err); // unexpected - print it so you can debug
  res.status(err.status || 500).json({ message: "Something went wrong on the server" });
}

// Wraps async route handlers so errors reach errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

module.exports = { notFound, errorHandler, asyncHandler, HttpError };
