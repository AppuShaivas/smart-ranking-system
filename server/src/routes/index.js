const express = require("express");
const { protect, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");
const auth = require("../controllers/authController");
const ach = require("../controllers/achievementController");
const { getRankings } = require("../controllers/rankingController");
const analytics = require("../controllers/analyticsController");
const admin = require("../controllers/adminController");
const profile = require("../controllers/profileController");
const recruiter = require("../controllers/recruiterController");
const misc = require("../controllers/miscController");

const router = express.Router();
const staff = allowRoles("faculty", "admin");

// ---------- Public
router.get("/health", (_req, res) => res.json({ ok: true, time: new Date() }));
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/public/portfolio/:usn", misc.publicPortfolio);
router.get("/files/:id", misc.getFile);

// ---------- Everything below needs a valid login token
router.use(protect);
router.get("/auth/me", auth.me);
router.get("/notifications", misc.listNotifications);
router.put("/notifications/read-all", misc.markAllRead);
router.put("/profile/me", profile.updateMyProfile);
router.get("/profile/views", allowRoles("student"), profile.myProfileViews);

// Achievements
router.post("/achievements", allowRoles("student"), upload.single("certificate"), ach.createAchievement);
router.get("/achievements/mine", allowRoles("student"), ach.myAchievements);
router.delete("/achievements/:id", allowRoles("student"), ach.deleteAchievement);
router.get("/achievements", staff, ach.listAchievements);
router.put("/achievements/:id/verify", staff, ach.verifyAchievement);

// Rankings & analytics
router.get("/rankings", allowRoles("student", "faculty", "admin"), getRankings);
router.get("/analytics/me", allowRoles("student"), analytics.studentAnalytics);
router.get("/analytics/department", staff, analytics.departmentAnalytics);
router.get("/analytics/admin", allowRoles("admin"), analytics.adminAnalytics);
router.get("/faculty/students", staff, misc.facultyStudents);

// Admin
router.get("/admin/users", allowRoles("admin"), admin.listUsers);
router.put("/admin/users/:id", allowRoles("admin"), admin.updateUser);
router.delete("/admin/users/:id", allowRoles("admin"), admin.deleteUser);
router.get("/admin/config", allowRoles("admin"), admin.getConfig);
router.put("/admin/config", allowRoles("admin"), admin.updateConfig);

// Recruiters
router.get("/recruiter/students", allowRoles("recruiter"), recruiter.searchStudents);
router.get("/recruiter/students/:id", allowRoles("recruiter"), recruiter.getStudent);
router.post("/recruiter/shortlist/:id", allowRoles("recruiter"), recruiter.toggleShortlist);
router.get("/recruiter/shortlist", allowRoles("recruiter"), recruiter.getShortlist);

module.exports = router;
