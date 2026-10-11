const User = require("../models/User");
const Achievement = require("../models/Achievement");
const ProfileView = require("../models/ProfileView");
const notify = require("../utils/notify");
const { asyncHandler, HttpError } = require("../middleware/error");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PUBLIC_FIELDS = "name usn department semester section cgpa activeBacklogs interestedDomain careerGoal skills badges";

// GET /api/recruiter/students?skill=&verifiedOnly=true&domain=&department=&minCgpa=&maxBacklogs=&q=
// Only students who opted in (recruiterVisible) are ever returned.
const searchStudents = asyncHandler(async (req, res) => {
  const { skill, verifiedOnly, domain, department, minCgpa, maxBacklogs, q } = req.query;
  const filter = { role: "student", isActive: true, recruiterVisible: true };
  if (department) filter.department = department.toUpperCase();
  if (domain) filter.interestedDomain = domain;
  if (minCgpa) filter.cgpa = { $gte: Number(minCgpa) };
  if (maxBacklogs !== undefined && maxBacklogs !== "") filter.activeBacklogs = { $lte: Number(maxBacklogs) };
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };
  if (skill) {
    const names = String(skill).split(",").map((s) => s.trim()).filter(Boolean);
    filter.$and = names.map((n) => ({
      skills: { $elemMatch: { name: { $regex: `^${escapeRegex(n)}$`, $options: "i" }, ...(verifiedOnly === "true" ? { source: "verified" } : {}) } },
    }));
  }
  const students = await User.find(filter).select(PUBLIC_FIELDS).limit(200).lean();

  const counts = await Achievement.aggregate([
    { $match: { student: { $in: students.map((s) => s._id) }, status: "approved" } },
    { $group: { _id: "$student", approved: { $sum: 1 }, top: { $max: "$smartScore" } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c]));
  const shortlisted = new Set(req.user.shortlist.map(String));

  const result = students
    .map((s) => ({
      ...s,
      approvedCount: map.get(String(s._id))?.approved || 0,
      verifiedSkills: (s.skills || []).filter((k) => k.source === "verified").length,
      shortlisted: shortlisted.has(String(s._id)),
    }))
    .sort((a, b) => b.verifiedSkills - a.verifiedSkills || b.approvedCount - a.approvedCount);
  res.json(result);
});

// GET /api/recruiter/students/:id - full verified profile (logs the view)
const getStudent = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: "student", isActive: true, recruiterVisible: true })
    .select(PUBLIC_FIELDS + " email phone");
  if (!student) throw new HttpError(404, "Profile not available");

  const achievements = await Achievement.find({ student: student._id, status: "approved" })
    .sort({ smartScore: -1 }).populate("verifiedBy", "name designation")
    .select("title category level position eventDate smartScore certificate projectUrl skillTags verifiedBy verifiedAt");

  // Log the view (at most once per recruiter per day) and tell the student
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (!(await ProfileView.exists({ recruiter: req.user._id, student: student._id, createdAt: { $gte: since } }))) {
    await ProfileView.create({ recruiter: req.user._id, student: student._id, company: req.user.company });
    await notify(student._id, { type: "info", title: "A recruiter viewed your profile",
      message: `${req.user.company} viewed your verified profile.`, link: "/student/profile" });
  }
  res.json({ student, achievements, shortlisted: req.user.shortlist.map(String).includes(String(student._id)) });
});

// POST /api/recruiter/shortlist/:id - add/remove from shortlist
const toggleShortlist = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const exists = await User.exists({ _id: id, role: "student", recruiterVisible: true });
  if (!exists) throw new HttpError(404, "Student not found");
  const has = req.user.shortlist.map(String).includes(id);
  req.user.shortlist = has ? req.user.shortlist.filter((s) => String(s) !== id) : [...req.user.shortlist, id];
  await req.user.save();
  res.json({ shortlisted: !has });
});

// GET /api/recruiter/shortlist
const getShortlist = asyncHandler(async (req, res) => {
  const students = await User.find({ _id: { $in: req.user.shortlist }, recruiterVisible: true, isActive: true })
    .select(PUBLIC_FIELDS + " email phone").lean();
  res.json(students);
});

module.exports = { searchStudents, getStudent, toggleShortlist, getShortlist };
