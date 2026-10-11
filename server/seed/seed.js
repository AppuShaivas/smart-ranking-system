/**
 * Loads the demo dataset into your MongoDB database.
 *   npm run seed           -> removes old demo data and inserts fresh demo data
 *   npm run seed:remove    -> removes demo data only
 * Only accounts ending in @example.com are touched. Your real accounts are safe.
 * Password for every demo account: Demo@123
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Achievement = require("../src/models/Achievement");
const Notification = require("../src/models/Notification");
const ProfileView = require("../src/models/ProfileView");
const Config = require("../src/models/Config");
const { saveFile, sha256, deleteFileByUrl } = require("../src/utils/files");
const { calculateSmartScore } = require("../src/utils/scoring");
const { refreshAllStudents } = require("../src/services/studentService");

const DEMO = /@example\.com$/;
const DATA = path.join(__dirname, "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

async function removeDemo() {
  const users = await User.find({ email: DEMO }).select("_id");
  const ids = users.map((u) => u._id);
  const achievements = await Achievement.find({ student: { $in: ids } }).select("certificate");
  for (const a of achievements) await deleteFileByUrl(a.certificate);
  await Promise.all([
    Achievement.deleteMany({ student: { $in: ids } }),
    Notification.deleteMany({ user: { $in: ids } }),
    ProfileView.deleteMany({ $or: [{ student: { $in: ids } }, { recruiter: { $in: ids } }] }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
  console.log(`🧹 Removed ${ids.length} demo users and ${achievements.length} demo achievements`);
}

async function insertDemo() {
  const hash = await bcrypt.hash("Demo@123", 10);
  const rows = load("users.json");

  const userDocs = rows.map((u, i) => {
    const student = u.role === "student";
    return {
      name: u.name,
      email: u.email,
      password: hash,
      role: u.role,
      usn: student ? u.usn : "",
      employeeId: student ? "" : u.employeeId || "",
      department: u.department,
      semester: student ? String(u.semester) : "",
      section: student ? u.section : "",
      phone: u.phone || "",
      designation: student ? "" : u.designation || "",
      specialization: student ? "" : u.specialization || "",
      cgpa: student ? u.cgpa ?? 0 : 0,
      attendance: student ? u.attendance ?? 0 : 0,
      activeBacklogs: u.activeBacklogs || 0,
      isActive: u.isActive !== false,
      interestedDomain: u.interestedDomain || "",
      careerGoal: u.careerGoal || "",
      skills: (u.skills || []).map((s) => ({ name: s.name, level: s.level, source: "self-declared" })),
      // Consent settings for the demo: most students visible to recruiters, some public portfolios
      recruiterVisible: student && i % 10 < 7,
      portfolioPublic: student && i % 3 === 0,
      showCgpaOnPortfolio: student && i % 2 === 0,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    };
  });
  userDocs.push(
    { name: "Neha Kapoor", email: "recruiter@example.com", password: hash, role: "recruiter",
      company: "TechNova Solutions", designation: "Talent Acquisition Lead", isActive: true },
    { name: "Arjun Mehta", email: "recruiter2@example.com", password: hash, role: "recruiter",
      company: "CloudPeak Labs", designation: "HR Manager", isActive: false } // waiting for admin approval
  );

  const inserted = await User.insertMany(userDocs);
  const byUsn = new Map(inserted.filter((u) => u.usn).map((u) => [u.usn.toUpperCase(), u]));
  const byEmp = new Map(inserted.filter((u) => u.employeeId).map((u) => [u.employeeId, u]));
  console.log(`👤 Inserted ${inserted.length} users`);

  const achDocs = [];
  for (const a of load("achievements.json")) {
    const student = byUsn.get(a.studentUsn);
    let certificate = "";
    let certificateHash = "";
    if (a.certificate) {
      const file = path.join(DATA, "certificates", path.basename(a.certificate));
      if (fs.existsSync(file)) {
        const buf = fs.readFileSync(file);
        certificateHash = sha256(buf);
        certificate = `/api/files/${await saveFile(buf, path.basename(file), "application/pdf", { demo: true })}`;
      }
    }
    achDocs.push({
      student: student._id,
      department: student.department,
      title: a.title,
      description: a.description,
      category: a.category,
      level: a.level,
      position: a.position,
      eventDate: new Date(a.eventDate),
      evidenceType: a.evidenceType,
      certificate,
      certificateHash,
      projectUrl: a.projectUrl || "",
      clientContact: a.clientContact || "",
      skillsUsed: a.skillsUsed || [],
      skillTags: a.skillTags || [],
      smartScore: calculateSmartScore(a),
      status: a.status,
      remarks: a.remarks || "",
      verifiedBy: a.verifierEmployeeId ? byEmp.get(a.verifierEmployeeId)._id : null,
      verifiedAt: a.verifiedAt ? new Date(a.verifiedAt) : null,
      achievementCode: a.achievementCode,
      createdAt: new Date(a.createdAt),
    });
  }
  await Achievement.insertMany(achDocs);
  console.log(`🏆 Inserted ${achDocs.length} achievements (certificates stored in MongoDB)`);

  await Config.get(); // make sure ranking weights exist (40/20/40, normalised)
  await refreshAllStudents({ notifyUser: false }); // verified skills + badges
  console.log("🎖️  Calculated verified skills and badges");
}

(async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in server/.env");
    process.exit(1);
  }
  await connectDB(process.env.MONGO_URI);
  try {
    await User.init(); // make sure indexes exist before inserting
    await removeDemo();
    if (!process.argv.includes("--remove")) {
      await insertDemo();
      console.log("\n✅ Demo data ready! Log in with admin@example.com / Demo@123");
    }
  } catch (e) {
    console.error("❌ Seeding failed:", e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
