const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Config = require("../models/Config");
const ProfileView = require("../models/ProfileView");
const { getStanding, computeRankings } = require("../services/rankingService");
const { asyncHandler } = require("../middleware/error");
const { CATEGORIES } = require("../config/constants");

const statusCounts = (rows) => {
  const out = { pending: 0, approved: 0, rejected: 0 };
  rows.forEach((r) => (out[r._id] = r.count));
  return out;
};

// GET /api/analytics/me  (student)
const studentAnalytics = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const [byStatus, byCategory, standing, recent, views] = await Promise.all([
    Achievement.aggregate([{ $match: { student: id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Achievement.aggregate([
      { $match: { student: id, status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 }, score: { $sum: "$smartScore" } } },
    ]),
    getStanding(req.user),
    Achievement.find({ student: id }).sort({ createdAt: -1 }).limit(5).select("title status smartScore category createdAt"),
    ProfileView.countDocuments({ student: id }),
  ]);
  const counts = statusCounts(byStatus);
  const catMap = new Map(byCategory.map((c) => [c._id, c]));
  res.json({
    totals: { ...counts, total: counts.pending + counts.approved + counts.rejected },
    categories: CATEGORIES.map((c) => ({ category: c, count: catMap.get(c)?.count || 0, score: catMap.get(c)?.score || 0 })),
    standing,
    badges: req.user.badges,
    recent,
    recruiterViews: views,
  });
});

// GET /api/analytics/department  (faculty: own department; admin may pass ?department=)
const departmentAnalytics = asyncHandler(async (req, res) => {
  const department = req.user.role === "faculty" ? req.user.department : (req.query.department || "MCA").toUpperCase();
  const [students, byStatus, topCategories, rankings] = await Promise.all([
    User.countDocuments({ role: "student", department, isActive: true }),
    Achievement.aggregate([{ $match: { department } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Achievement.aggregate([
      { $match: { department, status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 }, score: { $sum: "$smartScore" } } },
      { $sort: { score: -1 } },
    ]),
    computeRankings({ department }),
  ]);
  const counts = statusCounts(byStatus);
  const total = counts.pending + counts.approved + counts.rejected;
  res.json({
    department,
    students,
    totals: { ...counts, total },
    completion: total ? Math.round(((counts.approved + counts.rejected) / total) * 100) : 100,
    topCategories: topCategories.map((c) => ({ category: c._id, count: c.count, score: c.score })),
    topStudents: rankings.ranked.slice(0, 5),
  });
});

// GET /api/analytics/admin
const adminAnalytics = asyncHandler(async (req, res) => {
  const [roles, disabled, pendingRecruiters, byStatus, categoryStats, deptStats, config] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ isActive: false, role: { $ne: "recruiter" } }),
    User.countDocuments({ isActive: false, role: "recruiter" }),
    Achievement.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Achievement.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 }, avgScore: { $avg: "$smartScore" }, score: { $sum: "$smartScore" } } },
      { $sort: { score: -1 } },
    ]),
    User.aggregate([
      { $match: { role: "student" } },
      { $group: { _id: "$department", students: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Config.get(),
  ]);
  const roleCounts = { student: 0, faculty: 0, admin: 0, recruiter: 0 };
  roles.forEach((r) => (roleCounts[r._id] = r.count));
  const counts = statusCounts(byStatus);
  res.json({
    roles: roleCounts,
    disabled,
    pendingRecruiters,
    totals: { ...counts, total: counts.pending + counts.approved + counts.rejected },
    categories: categoryStats.map((c) => ({ category: c._id, count: c.count, avgScore: Math.round(c.avgScore), score: c.score })),
    departments: deptStats.map((d) => ({ department: d._id || "—", students: d.students })),
    config,
  });
});

module.exports = { studentAnalytics, departmentAnalytics, adminAnalytics };
