const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Config = require("../models/Config");
const { computeStudentScore } = require("../utils/scoring");

/**
 * Ranks active students (optionally within one department / semester).
 * Returns { config, ranked: [...], incomplete: [...] }.
 */
async function computeRankings({ department = "", semester = "" } = {}) {
  const config = await Config.get();
  const filter = { role: "student", isActive: true };
  if (department) filter.department = department.toUpperCase();
  if (semester) filter.semester = String(semester);

  const students = await User.find(filter)
    .select("name usn department semester section cgpa attendance badges").lean();
  const ids = students.map((s) => s._id);

  const grouped = await Achievement.aggregate([
    { $match: { status: "approved", student: { $in: ids } } },
    { $group: { _id: "$student", scores: { $push: "$smartScore" }, count: { $sum: 1 } } },
  ]);
  const byStudent = new Map(grouped.map((g) => [String(g._id), g]));

  const rows = students.map((s) => {
    const g = byStudent.get(String(s._id)) || { scores: [], count: 0 };
    return {
      student: { _id: s._id, name: s.name, usn: s.usn, department: s.department, semester: s.semester, section: s.section },
      badges: (s.badges || []).map((b) => b.title),
      approvedCount: g.count,
      ...computeStudentScore(s, g.scores, config),
    };
  });

  const ranked = rows
    .filter((r) => r.ranked)
    .sort((a, b) => b.totalScore - a.totalScore || b.achievementScore - a.achievementScore ||
      b.cgpa - a.cgpa || a.student.name.localeCompare(b.student.name));
  // Equal scores share the same rank (1, 2, 2, 4 ...)
  ranked.forEach((r, i) => {
    r.rank = i > 0 && r.totalScore === ranked[i - 1].totalScore ? ranked[i - 1].rank : i + 1;
  });
  const incomplete = rows.filter((r) => !r.ranked).sort((a, b) => a.student.name.localeCompare(b.student.name));

  return {
    config: {
      scoringMode: config.scoringMode,
      academicWeight: config.academicWeight,
      attendanceWeight: config.attendanceWeight,
      achievementWeight: config.achievementWeight,
    },
    ranked,
    incomplete,
  };
}

// Rank + score breakdown of one student within their department.
async function getStanding(student) {
  const { ranked, incomplete } = await computeRankings({ department: student.department });
  const id = String(student._id);
  const entry = ranked.find((r) => String(r.student._id) === id) || incomplete.find((r) => String(r.student._id) === id);
  return { ...(entry || {}), outOf: ranked.length };
}

module.exports = { computeRankings, getStanding };
