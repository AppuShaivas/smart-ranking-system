const mongoose = require("mongoose");
const { CATEGORIES, LEVELS, POSITIONS } = require("../config/constants");

const achievementSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    department: { type: String, required: true, index: true }, // copied from the student at submission
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    category: { type: String, enum: { values: CATEGORIES, message: "Invalid category" }, required: true },
    level: { type: String, enum: { values: LEVELS, message: "Invalid level" }, required: true },
    position: { type: String, enum: { values: POSITIONS, message: "Invalid position" }, required: true },
    eventDate: { type: Date, required: [true, "Event date is required"] },
    evidenceType: { type: String, default: "Certificate" },

    certificate: { type: String, default: "" }, // e.g. /api/files/<id>
    certificateHash: { type: String, default: "", index: true }, // SHA-256, blocks duplicate uploads

    projectUrl: { type: String, trim: true, default: "" }, // freelance
    clientContact: { type: String, trim: true, default: "" }, // freelance
    skillsUsed: { type: [String], default: [] }, // freelance
    skillTags: { type: [String], default: [] }, // skills this achievement demonstrates

    smartScore: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    remarks: { type: String, trim: true, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    achievementCode: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Achievement", achievementSchema);
