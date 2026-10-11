const mongoose = require("mongoose");
const { ROLES, SKILL_LEVELS } = require("../config/constants");

const badgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    icon: { type: String, default: "" },
    description: { type: String, default: "" },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    level: { type: String, enum: SKILL_LEVELS, default: "Average" },
    source: { type: String, enum: ["self-declared", "verified"], default: "self-declared" },
  },
  { _id: false }
);

// Field names and conventions match the existing records in your database
// (lowercase usn, semester stored as text, unused fields stored as "").
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 80 },
    usn: { type: String, trim: true, lowercase: true, default: "" },
    employeeId: { type: String, trim: true, default: "" },
    email: {
      type: String, required: [true, "Email is required"], unique: true, trim: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "student" },
    department: { type: String, trim: true, uppercase: true, default: "" },
    semester: { type: String, default: "" },
    section: { type: String, trim: true, uppercase: true, default: "" },
    phone: {
      type: String, trim: true, default: "",
      validate: { validator: (v) => v === "" || /^[6-9]\d{9}$/.test(v), message: "Phone must be a 10-digit mobile number" },
    },
    designation: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    adminCode: { type: String, default: "", select: false }, // kept for compatibility; never filled
    company: { type: String, trim: true, default: "" }, // recruiters
    cgpa: { type: Number, min: 0, max: 10, default: 0 }, // 0 = not yet entered
    attendance: { type: Number, min: 0, max: 100, default: 0 }, // 0 = not yet entered
    activeBacklogs: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    badges: { type: [badgeSchema], default: [] },

    // Career profile (students)
    interestedDomain: { type: String, trim: true, default: "" },
    careerGoal: { type: String, trim: true, default: "" },
    skills: { type: [skillSchema], default: [] },

    // Privacy / consent (students)
    recruiterVisible: { type: Boolean, default: false },
    portfolioPublic: { type: Boolean, default: false },
    showCgpaOnPortfolio: { type: Boolean, default: false },

    // Recruiters
    shortlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.index(
  { usn: 1 },
  { unique: true, partialFilterExpression: { usn: { $type: "string", $gt: "" } } }
);
userSchema.index({ role: 1, department: 1 });

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.adminCode;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
