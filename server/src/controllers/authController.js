const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const notify = require("../utils/notify");
const { emit } = require("../utils/socket");
const { asyncHandler, HttpError } = require("../middleware/error");

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
const clean = (v) => (typeof v === "string" ? v.trim() : "");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const b = req.body;
  const role = b.role || "student";
  const email = clean(b.email).toLowerCase();

  if (!clean(b.name) || !email || !b.password) throw new HttpError(400, "Name, email and password are required");
  if (String(b.password).length < 6) throw new HttpError(400, "Password must be at least 6 characters");
  if (!["student", "faculty", "admin", "recruiter"].includes(role)) throw new HttpError(400, "Invalid role");
  if (await User.exists({ email })) throw new HttpError(400, "Email already registered");

  const data = {
    name: clean(b.name), email, role, phone: clean(b.phone),
    password: await bcrypt.hash(String(b.password), 10),
  };

  if (role === "student") {
    if (!clean(b.usn) || !clean(b.department) || !clean(String(b.semester || "")))
      throw new HttpError(400, "USN, department and semester are required");
    if (await User.exists({ usn: clean(b.usn).toLowerCase() })) throw new HttpError(400, "This USN is already registered");
    Object.assign(data, { usn: clean(b.usn), department: clean(b.department), semester: String(b.semester), section: clean(b.section) });
  }
  if (role === "faculty") {
    if (!clean(b.employeeId) || !clean(b.department)) throw new HttpError(400, "Employee ID and department are required");
    Object.assign(data, { employeeId: clean(b.employeeId), department: clean(b.department),
      designation: clean(b.designation), specialization: clean(b.specialization) });
  }
  if (role === "admin") {
    if (!process.env.ADMIN_CODE || b.adminCode !== process.env.ADMIN_CODE) throw new HttpError(403, "Invalid admin security code");
    Object.assign(data, { employeeId: clean(b.employeeId), department: clean(b.department) });
  }
  if (role === "recruiter") {
    if (!clean(b.company)) throw new HttpError(400, "Company name is required");
    Object.assign(data, { company: clean(b.company), designation: clean(b.designation), isActive: false });
  }

  const user = await User.create(data);

  if (role === "recruiter") {
    const admins = await User.find({ role: "admin", isActive: true }).select("_id");
    for (const a of admins)
      await notify(a._id, { type: "info", title: "New recruiter awaiting approval", message: `${user.name} (${user.company})`, link: "/admin/users" });
    emit.toRole("admin", "users:updated", {});
    return res.status(201).json({ pendingApproval: true, message: "Registration received. An administrator must approve your account before you can log in." });
  }
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password)))
    throw new HttpError(401, "Invalid email or password");
  if (!user.isActive)
    throw new HttpError(403, user.role === "recruiter" ? "Your recruiter account is awaiting admin approval" : "Account is disabled");
  res.json({ token: signToken(user), user });
});

// GET /api/auth/me
const me = (req, res) => res.json({ user: req.user });

module.exports = { register, login, me };
