const multer = require("multer");
const path = require("path");

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png"];

// Files are kept in memory, then saved into MongoDB (GridFS) by the controller.
// This means certificates survive server restarts and cloud redeploys.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) return cb(null, true);
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF, JPG, JPEG or PNG files are allowed"));
  },
});

module.exports = upload;
