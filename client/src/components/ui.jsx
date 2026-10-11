import { CheckCircle2, Clock, XCircle, BadgeCheck } from "lucide-react";

export const Loader = () => <div className="loader" />;

export const Empty = ({ children = "Nothing here yet." }) => <div className="empty">{children}</div>;

export function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card stat">
      <div className="stat-icon" style={color ? { background: `${color}1a`, color } : undefined}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function StatusChip({ status }) {
  const Icon = { approved: CheckCircle2, rejected: XCircle, pending: Clock }[status] || Clock;
  return (
    <span className={`chip chip-${status}`}>
      <Icon size={12} /> {status}
    </span>
  );
}

export function SkillChip({ skill }) {
  return (
    <span className={`chip ${skill.source === "verified" ? "chip-verified" : ""}`} title={skill.source}>
      {skill.source === "verified" && <BadgeCheck size={12} />}
      {skill.name}
      {skill.level && <span style={{ opacity: 0.65, fontWeight: 500 }}>· {skill.level}</span>}
    </span>
  );
}

const BADGE_COLORS = {
  "Gold Performer": "linear-gradient(135deg,#f59e0b,#d97706)",
  "Silver Performer": "linear-gradient(135deg,#94a3b8,#64748b)",
  "Perfect Attendance": "linear-gradient(135deg,#10b981,#059669)",
  "Technical Guru": "linear-gradient(135deg,#6366f1,#4338ca)",
  "Eco Champion": "linear-gradient(135deg,#22c55e,#15803d)",
};

export function BadgeList({ badges = [], emptyText = "No badges yet - keep submitting verified achievements!" }) {
  if (!badges.length) return <p className="muted small">{emptyText}</p>;
  return (
    <div className="grid grid-2">
      {badges.map((b) => (
        <div className="badge-tile" key={b.title}>
          <div className="badge-icon" style={{ background: BADGE_COLORS[b.title] || "#4f46e5" }}>{b.icon}</div>
          <div>
            <strong className="small">{b.title}</strong>
            <div className="muted" style={{ fontSize: "0.75rem" }}>{b.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Visual breakdown of the overall score: academic + attendance + achievements
export function ScoreBreakdown({ s }) {
  if (!s || s.totalScore === undefined) return null;
  const parts = [
    { label: "Academic (CGPA)", value: s.academicPart, color: "#4f46e5" },
    { label: "Attendance", value: s.attendancePart, color: "#0ea5e9" },
    { label: "Achievements", value: s.achievementPart, color: "#10b981" },
  ];
  const total = Math.max(s.totalScore, 100);
  return (
    <div>
      <div className="scorebar">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${p.value}`} />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.label}><span className="dot" style={{ background: p.color }} />{p.label}: <strong>{p.value}</strong></span>
        ))}
        <span>= <strong>{s.totalScore}</strong></span>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal">
        <div className="row between" style={{ marginBottom: "0.8rem" }}>
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
