// Single source of truth for the achievement taxonomy and scoring tables.
const CATEGORY_WEIGHTS = {
  academic: 30,
  technical: 28,
  freelance: 26,
  certification: 24,
  sports: 22,
  sustainability: 20,
  cultural: 18,
  social: 16,
};
const LEVEL_MULTIPLIERS = { college: 1, intercollege: 1.25, state: 1.5, national: 2, international: 3 };
const POSITION_BONUS = { participation: 5, runner: 12, top3: 15, winner: 20 };

const CATEGORIES = Object.keys(CATEGORY_WEIGHTS);
const LEVELS = Object.keys(LEVEL_MULTIPLIERS);
const POSITIONS = Object.keys(POSITION_BONUS);
const ROLES = ["student", "faculty", "admin", "recruiter"];
const SKILL_LEVELS = ["Strong", "Average", "Weak"];

// Categories whose skill tags count as "verified skills" once approved
const SKILL_EVIDENCE_CATEGORIES = ["technical", "certification", "freelance", "academic"];

module.exports = {
  CATEGORY_WEIGHTS, LEVEL_MULTIPLIERS, POSITION_BONUS,
  CATEGORIES, LEVELS, POSITIONS, ROLES, SKILL_LEVELS, SKILL_EVIDENCE_CATEGORIES,
};
