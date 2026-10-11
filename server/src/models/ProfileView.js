const mongoose = require("mongoose");

// Audit log: which recruiter viewed which student profile, and when.
const profileViewSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfileView", profileViewSchema);
