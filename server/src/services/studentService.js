const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Config = require("../models/Config");
const { computeStudentScore } = require("../utils/scoring");
const { SKILL_EVIDENCE_CATEGORIES } = require("../config/constants");
const notify = require("../utils/notify");
const { emit } = require("../utils/socket");

const BADGE_RULES = [
  { title: "Gold Performer", icon: "GOLD", description: "Overall ranking score of 85 or above",
    test: (c) => c.score.ranked && c.score.totalScore >= 85 },
  { title: "Silver Performer", icon: "SILVER", description: "Overall ranking score between 70 and 85",
    test: (c) => c.score.ranked && c.score.totalScore >= 70 && c.score.totalScore < 85 },
  { title: "Perfect Attendance", icon: "100%", description: "Attendance recorded as 100%",
    test: (c) => c.student.attendance === 100 },
  { title: "Technical Guru", icon: "TECH", description: "3+ approved technical, certification or freelance achievements",
    test: (c) => c.count(["technical", "certification", "freelance"]) >= 3 },
  { title: "Eco Champion", icon: "ECO", description: "2+ approved sustainability or social achievements",
    test: (c) => c.count(["sustainability", "social"]) >= 2 },
];

/**
 * Recalculates everything derived from a student's approved achievements:
 *  - verified skills (skills backed by approved evidence)
 *  - newly earned badges (never awarded twice)
 */
async function refreshStudent(studentId, { notifyUser = true, config = null } = {}) {
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") return null;

  const approved = await Achievement.find({ student: studentId, status: "approved" })
    .select("category smartScore skillTags").lean();

  // ---- verified skills
  const evidence = new Map();
  approved
    .filter((a) => SKILL_EVIDENCE_CATEGORIES.includes(a.category))
    .flatMap((a) => a.skillTags || [])
    .forEach((t) => t && evidence.set(t.trim().toLowerCase(), t.trim()));
  const skills = student.skills.map((s) => ({
    name: s.name,
    level: s.level,
    source: evidence.has(s.name.toLowerCase()) ? "verified" : "self-declared",
  }));
  const have = new Set(skills.map((s) => s.name.toLowerCase()));
  for (const [key, name] of evidence) {
    if (!have.has(key) && skills.length < 20) skills.push({ name, level: "Average", source: "verified" });
  }
  student.skills = skills;

  // ---- badges
  const cfg = config || (await Config.get());
  const score = computeStudentScore(student, approved.map((a) => a.smartScore), cfg);
  const ctx = { student, score, count: (cats) => approved.filter((a) => cats.includes(a.category)).length };
  // Gold/Silver reflect CURRENT standing (removed if the score drops); other badges are permanent
  const TIERS = ["Gold Performer", "Silver Performer"];
  student.badges = student.badges.filter((b) => !TIERS.includes(b.title) ||
    BADGE_RULES.find((r) => r.title === b.title).test(ctx));
  const owned = new Set(student.badges.map((b) => b.title));
  const newBadges = BADGE_RULES.filter((r) => !owned.has(r.title) && r.test(ctx)).map(
    ({ title, icon, description }) => ({ title, icon, description, earnedAt: new Date() })
  );
  student.badges.push(...newBadges);
  await student.save();

  if (notifyUser) {
    for (const b of newBadges) {
      emit.toUser(student._id, "badge:unlocked", b);
      await notify(student._id, { type: "badge", title: `Badge unlocked: ${b.title}`, message: b.description, link: "/student" });
    }
  }
  return { student, score, newBadges };
}

async function refreshAllStudents(opts = {}) {
  const config = await Config.get();
  const ids = await User.find({ role: "student" }).distinct("_id");
  for (const id of ids) await refreshStudent(id, { ...opts, config });
}

module.exports = { refreshStudent, refreshAllStudents, BADGE_RULES };
