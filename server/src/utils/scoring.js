const { CATEGORY_WEIGHTS, LEVEL_MULTIPLIERS, POSITION_BONUS } = require("../config/constants");

const round2 = (n) => Math.round(n * 100) / 100;

// SmartScore = category weight × level multiplier + position bonus
function calculateSmartScore({ category, level, position }) {
  const base = CATEGORY_WEIGHTS[category] || 10;
  const multiplier = LEVEL_MULTIPLIERS[level] || 1;
  const bonus = POSITION_BONUS[position] || 5;
  return Math.round(base * multiplier + bonus);
}

// Fair 0-100 achievement index:
//  1) diminishing returns - best achievement counts fully, 2nd counts half, 3rd a quarter...
//  2) saturating curve    - squeezes the result into 0-100 so it matches CGPA and attendance
function achievementIndex(scores) {
  const d = [...scores].sort((a, b) => b - a).reduce((sum, s, i) => sum + s * Math.pow(0.5, i), 0);
  return 100 * (1 - Math.exp(-d / 100));
}

const isProfileComplete = (s) => (s.cgpa || 0) > 0 && (s.attendance || 0) > 0;

// Overall ranking score for one student.
function computeStudentScore(student, scores, config) {
  const cgpa = student.cgpa || 0;
  const attendance = student.attendance || 0;
  const mode = config.scoringMode || "normalised";
  const achievementScore = scores.reduce((a, b) => a + b, 0);
  const achievementComponent = mode === "classic" ? achievementScore : achievementIndex(scores);

  const academicPart = (cgpa * 10 * config.academicWeight) / 100;
  const attendancePart = (attendance * config.attendanceWeight) / 100;
  const achievementPart = (achievementComponent * config.achievementWeight) / 100;
  const profileComplete = isProfileComplete(student);

  return {
    cgpa,
    attendance,
    achievementScore,
    achievementComponent: round2(achievementComponent),
    academicPart: round2(academicPart),
    attendancePart: round2(attendancePart),
    achievementPart: round2(achievementPart),
    totalScore: round2(academicPart + attendancePart + achievementPart),
    profileComplete,
    // In normalised mode, students without CGPA/attendance are listed as "incomplete", not ranked at 0
    ranked: mode === "classic" ? true : profileComplete,
  };
}

module.exports = { calculateSmartScore, achievementIndex, computeStudentScore, isProfileComplete, round2 };
