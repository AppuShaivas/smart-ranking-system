export const CATEGORY_WEIGHTS = { academic: 30, technical: 28, freelance: 26, certification: 24, sports: 22, sustainability: 20, cultural: 18, social: 16 };
export const LEVEL_MULTIPLIERS = { college: 1, intercollege: 1.25, state: 1.5, national: 2, international: 3 };
export const POSITION_BONUS = { participation: 5, runner: 12, top3: 15, winner: 20 };

export const CATEGORIES = Object.keys(CATEGORY_WEIGHTS);
export const LEVELS = Object.keys(LEVEL_MULTIPLIERS);
export const POSITIONS = Object.keys(POSITION_BONUS);
export const DEPARTMENTS = ["MCA", "CSE", "ISE", "ECE", "MBA"];
export const SKILL_LEVELS = ["Strong", "Average", "Weak"];
export const DOMAINS = ["Artificial Intelligence", "Data Science", "Full Stack Development", "Cloud & DevOps",
  "Cyber Security", "Mobile Development", "UI/UX Design"];

export const LABELS = {
  academic: "Academic", technical: "Technical", freelance: "Freelance", certification: "Certification",
  sports: "Sports", sustainability: "Sustainability", cultural: "Cultural", social: "Social",
  college: "College", intercollege: "Inter-college", state: "State", national: "National", international: "International",
  participation: "Participation", runner: "Runner-up", top3: "Top 3", winner: "Winner",
};
export const label = (k) => LABELS[k] || k;

export const smartScore = (category, level, position) =>
  Math.round((CATEGORY_WEIGHTS[category] || 10) * (LEVEL_MULTIPLIERS[level] || 1) + (POSITION_BONUS[position] || 5));

export const homeFor = (role) => ({ student: "/student", faculty: "/faculty", admin: "/admin", recruiter: "/recruiter" }[role] || "/");

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export const CHART_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];
