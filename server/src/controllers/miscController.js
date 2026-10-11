const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Notification = require("../models/Notification");
const { streamFile } = require("../utils/files");
const { asyncHandler, HttpError } = require("../middleware/error");

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

// GET /api/files/:id - serves a certificate stored in MongoDB
const getFile = asyncHandler(async (req, res) => streamFile(req.params.id, res));

// GET /api/faculty/students - class records for the faculty member's department
const facultyStudents = asyncHandler(async (req, res) => {
  const department = req.user.role === "faculty" ? req.user.department : (req.query.department || "").toUpperCase();
  const filter = { role: "student" };
  if (department) filter.department = department;
  res.json(await User.find(filter).select("name usn semester section cgpa attendance phone email isActive department").sort({ usn: 1 }));
});

// GET /api/public/portfolio/:usn - shareable verified portfolio (no login needed)
const publicPortfolio = asyncHandler(async (req, res) => {
  const student = await User.findOne({ usn: String(req.params.usn).toLowerCase(), role: "student", isActive: true, portfolioPublic: true })
    .select("name usn department semester interestedDomain careerGoal skills badges cgpa showCgpaOnPortfolio").lean();
  if (!student) throw new HttpError(404, "This portfolio is private or does not exist");
  if (!student.showCgpaOnPortfolio) delete student.cgpa;
  const achievements = await Achievement.find({ student: student._id, status: "approved" })
    .sort({ eventDate: -1 }).populate("verifiedBy", "name designation")
    .select("title category level position eventDate certificate projectUrl skillTags verifiedBy verifiedAt").lean();
  res.json({ student, achievements });
});

module.exports = { listNotifications, markAllRead, getFile, facultyStudents, publicPortfolio };
