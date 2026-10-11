const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Config = require("../models/Config");
const Notification = require("../models/Notification");
const ProfileView = require("../models/ProfileView");
const { refreshStudent, refreshAllStudents } = require("../services/studentService");
const { deleteFileByUrl } = require("../utils/files");
const notify = require("../utils/notify");
const { emit } = require("../utils/socket");
const { asyncHandler, HttpError } = require("../middleware/error");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/users?role=&q=&department=
const listUsers = asyncHandler(async (req, res) => {
  const { role, q, department } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department.toUpperCase();
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { usn: rx }, { employeeId: rx }, { company: rx }];
  }
  res.json(await User.find(filter).sort({ role: 1, name: 1 }).limit(1000));
});

const EDITABLE = ["name", "department", "semester", "section", "phone", "designation", "specialization",
  "company", "employeeId", "cgpa", "attendance", "activeBacklogs", "isActive"];

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  const wasActive = user.isActive;
  for (const f of EDITABLE) {
    if (req.body[f] === undefined) continue;
    user[f] = ["cgpa", "attendance", "activeBacklogs"].includes(f) ? Number(req.body[f]) || 0
      : f === "semester" ? String(req.body[f]) : req.body[f];
  }
  if (String(user._id) === String(req.user._id) && user.isActive === false) throw new HttpError(400, "You cannot disable your own account");
  await user.save();

  if (user.role === "recruiter" && !wasActive && user.isActive)
    await notify(user._id, { type: "info", title: "Account approved", message: "You can now search verified student profiles.", link: "/recruiter" });
  if (user.role === "student") {
    await refreshStudent(user._id);
    emit.toAll("rankings:updated", { department: user.department });
  }
  emit.toRole("admin", "users:updated", {});
  res.json(user);
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new HttpError(400, "You cannot delete your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  const achievements = await Achievement.find({ student: user._id }).select("certificate");
  for (const a of achievements) await deleteFileByUrl(a.certificate);
  await Promise.all([
    Achievement.deleteMany({ student: user._id }),
    Notification.deleteMany({ user: user._id }),
    ProfileView.deleteMany({ $or: [{ student: user._id }, { recruiter: user._id }] }),
    User.updateMany({}, { $pull: { shortlist: user._id } }),
    user.deleteOne(),
  ]);
  emit.toAll("rankings:updated", {});
  emit.toRole("admin", "users:updated", {});
  res.json({ message: "User deleted" });
});

// GET /api/admin/config
const getConfig = asyncHandler(async (_req, res) => res.json(await Config.get()));

// PUT /api/admin/config  body: { academicWeight, attendanceWeight, achievementWeight, scoringMode }
const updateConfig = asyncHandler(async (req, res) => {
  const a = Number(req.body.academicWeight);
  const t = Number(req.body.attendanceWeight);
  const c = Number(req.body.achievementWeight);
  if ([a, t, c].some((n) => !Number.isFinite(n) || n < 0 || n > 100)) throw new HttpError(400, "Weights must be numbers between 0 and 100");
  if (a + t + c !== 100) throw new HttpError(400, `Weights must add up to 100 (currently ${a + t + c})`);
  const cfg = await Config.get();
  cfg.academicWeight = a;
  cfg.attendanceWeight = t;
  cfg.achievementWeight = c;
  if (req.body.scoringMode) cfg.scoringMode = req.body.scoringMode;
  await cfg.save();
  await refreshAllStudents({ notifyUser: true });
  emit.toAll("rankings:updated", {});
  res.json(cfg);
});

module.exports = { listUsers, updateUser, deleteUser, getConfig, updateConfig };
