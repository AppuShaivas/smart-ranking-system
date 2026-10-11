const Achievement = require("../models/Achievement");
const { calculateSmartScore } = require("../utils/scoring");
const { saveFile, sha256, deleteFileByUrl } = require("../utils/files");
const { refreshStudent } = require("../services/studentService");
const notify = require("../utils/notify");
const { emit } = require("../utils/socket");
const { asyncHandler, HttpError } = require("../middleware/error");
const { CATEGORIES, LEVELS, POSITIONS } = require("../config/constants");

const parseTags = (v) =>
  [...new Set(String(v || "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 8);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/achievements  (student, multipart/form-data)
const createAchievement = asyncHandler(async (req, res) => {
  const { title, description = "", category, level, position, eventDate, evidenceType, projectUrl = "", clientContact = "" } = req.body;

  if (!title || !category || !level || !position || !eventDate) throw new HttpError(400, "Please fill in all required fields");
  if (!CATEGORIES.includes(category) || !LEVELS.includes(level) || !POSITIONS.includes(position))
    throw new HttpError(400, "Invalid category, level or position");
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime()) || date > new Date()) throw new HttpError(400, "Event date must be a valid date in the past");
  if (category === "freelance" && !/^https?:\/\/\S+$/i.test(projectUrl.trim()))
    throw new HttpError(400, "Freelance work needs a valid project link (starting with http:// or https://)");
  if (category !== "freelance" && !req.file) throw new HttpError(400, "Please attach a certificate (PDF, JPG or PNG)");

  let certificate = "";
  let certificateHash = "";
  if (req.file) {
    certificateHash = sha256(req.file.buffer);
    const duplicate = await Achievement.exists({ certificateHash, status: { $ne: "rejected" } });
    if (duplicate) throw new HttpError(409, "This certificate has already been submitted");
    const id = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype, { uploadedBy: String(req.user._id) });
    certificate = `/api/files/${id}`;
  }

  const skillTags = parseTags(req.body.skillTags);
  const achievement = await Achievement.create({
    student: req.user._id,
    department: req.user.department,
    title, description, category, level, position, eventDate: date,
    evidenceType: evidenceType || (category === "freelance" ? "Project Link" : "Certificate"),
    certificate, certificateHash,
    projectUrl: projectUrl.trim(), clientContact: clientContact.trim(),
    skillsUsed: category === "freelance" ? skillTags : [],
    skillTags,
    smartScore: calculateSmartScore({ category, level, position }),
  });

  await notify(req.user._id, { type: "submitted", title: "Achievement submitted",
    message: `"${title}" is waiting for faculty verification.`, link: "/student/achievements" });
  const payload = { _id: achievement._id, title, student: req.user.name, department: req.user.department };
  emit.toFacultyDept(req.user.department, "achievement:new", payload);
  emit.toRole("admin", "achievement:new", payload);

  res.status(201).json(achievement);
});

// GET /api/achievements/mine  (student)
const myAchievements = asyncHandler(async (req, res) => {
  const list = await Achievement.find({ student: req.user._id })
    .sort({ createdAt: -1 }).populate("verifiedBy", "name designation").select("-certificateHash");
  res.json(list);
});

// GET /api/achievements  (faculty: own department, admin: all)
const listAchievements = asyncHandler(async (req, res) => {
  const { status, category, q, department } = req.query;
  const filter = {};
  if (req.user.role === "faculty") filter.department = req.user.department;
  else if (department) filter.department = department.toUpperCase();
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

  const list = await Achievement.find(filter)
    .sort({ createdAt: -1 }).limit(500)
    .populate("student", "name usn department semester section cgpa attendance phone")
    .populate("verifiedBy", "name designation")
    .select("-certificateHash");
  res.json(list);
});

// PUT /api/achievements/:id/verify  (faculty/admin)  body: { status, remarks }
const verifyAchievement = asyncHandler(async (req, res) => {
  const { status, remarks = "" } = req.body;
  if (!["approved", "rejected"].includes(status)) throw new HttpError(400, "Status must be approved or rejected");
  if (status === "rejected" && !remarks.trim()) throw new HttpError(400, "Please add a remark explaining the rejection");

  const achievement = await Achievement.findById(req.params.id).populate("student", "name department");
  if (!achievement) throw new HttpError(404, "Achievement not found");

  // Department check is enforced on the server, not just hidden in the UI
  if (req.user.role === "faculty" &&
      (achievement.department !== req.user.department || achievement.student?.department !== req.user.department))
    throw new HttpError(403, "You can only verify achievements from your department");

  achievement.status = status;
  achievement.remarks = remarks.trim();
  achievement.verifiedBy = req.user._id;
  achievement.verifiedAt = new Date();
  await achievement.save();

  const studentId = achievement.student._id;
  await refreshStudent(studentId); // verified skills + badges

  await notify(studentId, {
    type: status,
    title: status === "approved" ? "Achievement approved 🎉" : "Achievement rejected",
    message: status === "approved"
      ? `"${achievement.title}" was approved (+${achievement.smartScore} SmartScore).`
      : `"${achievement.title}" was rejected: ${achievement.remarks}`,
    link: "/student/achievements",
  });
  const payload = { _id: achievement._id, status, studentId };
  emit.toUser(studentId, "achievement:updated", payload);
  emit.toFacultyDept(achievement.department, "achievement:updated", payload);
  emit.toRole("admin", "achievement:updated", payload);
  emit.toAll("rankings:updated", { department: achievement.department });

  res.json(achievement);
});

// DELETE /api/achievements/:id  (student, own pending submission only)
const deleteAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findOne({ _id: req.params.id, student: req.user._id });
  if (!achievement) throw new HttpError(404, "Achievement not found");
  if (achievement.status !== "pending") throw new HttpError(400, "Only pending submissions can be deleted");
  await deleteFileByUrl(achievement.certificate);
  await achievement.deleteOne();
  emit.toFacultyDept(achievement.department, "achievement:updated", { _id: achievement._id, status: "deleted" });
  res.json({ message: "Deleted" });
});

module.exports = { createAchievement, myAchievements, listAchievements, verifyAchievement, deleteAchievement };
