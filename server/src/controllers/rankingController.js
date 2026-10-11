const { computeRankings } = require("../services/rankingService");
const { asyncHandler } = require("../middleware/error");

// GET /api/rankings?department=MCA&semester=3   (department=all for everyone)
const getRankings = asyncHandler(async (req, res) => {
  let { department, semester } = req.query;
  if (department === undefined) department = req.user.role === "admin" ? "" : req.user.department;
  if (department === "all") department = "";
  res.json(await computeRankings({ department, semester }));
});

module.exports = { getRankings };
