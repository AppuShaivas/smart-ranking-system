const User = require("../models/User");
const ProfileView = require("../models/ProfileView");
const { refreshStudent } = require("../services/studentService");
const { asyncHandler, HttpError } = require("../middleware/error");
const { SKILL_LEVELS } = require("../config/constants");

// PUT /api/profile/me
// Students edit their career profile & privacy settings (NOT cgpa/attendance - only admins can).
const updateMyProfile = asyncHandler(async (req, res) => {
  const u = req.user;
  const b = req.body;
  if (b.name !== undefined) u.name = b.name;
  if (b.phone !== undefined) u.phone = String(b.phone).trim();

  if (u.role === "student") {
    for (const f of ["interestedDomain", "careerGoal"]) if (b[f] !== undefined) u[f] = String(b[f]).trim();
    for (const f of ["recruiterVisible", "portfolioPublic", "showCgpaOnPortfolio"]) if (b[f] !== undefined) u[f] = Boolean(b[f]);
    if (Array.isArray(b.skills)) {
      const seen = new Set();
      u.skills = b.skills
        .map((s) => ({ name: String(s.name || "").trim(), level: SKILL_LEVELS.includes(s.level) ? s.level : "Average" }))
        .filter((s) => s.name && !seen.has(s.name.toLowerCase()) && seen.add(s.name.toLowerCase()))
        .slice(0, 20);
      if (b.skills.length > 20) throw new HttpError(400, "Maximum 20 skills");
    }
  } else {
    for (const f of ["designation", "specialization", "company"]) if (b[f] !== undefined) u[f] = String(b[f]).trim();
  }
  await u.save();
  if (u.role === "student") await refreshStudent(u._id, { notifyUser: false }); // re-mark verified skills
  res.json(await User.findById(u._id));
});

// GET /api/profile/views  (student) - which recruiters viewed my profile
const myProfileViews = asyncHandler(async (req, res) => {
  const views = await ProfileView.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(50)
    .populate("recruiter", "name company");
  res.json(views.map((v) => ({ _id: v._id, company: v.company || v.recruiter?.company, recruiter: v.recruiter?.name, at: v.createdAt })));
});

module.exports = { updateMyProfile, myProfileViews };
