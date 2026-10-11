const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "ranking_weights" },
    academicWeight: { type: Number, default: 40, min: 0, max: 100 },
    attendanceWeight: { type: Number, default: 20, min: 0, max: 100 },
    achievementWeight: { type: Number, default: 40, min: 0, max: 100 },
    // "normalised" = fair 0-100 scale with diminishing returns (recommended)
    // "classic"    = original report formula (raw sum of SmartScores)
    scoringMode: { type: String, enum: ["normalised", "classic"], default: "normalised" },
  },
  { timestamps: true }
);

configSchema.statics.get = async function () {
  let cfg = await this.findOne({ key: "ranking_weights" });
  if (!cfg) cfg = await this.create({ key: "ranking_weights" });
  return cfg;
};

module.exports = mongoose.model("Config", configSchema);
