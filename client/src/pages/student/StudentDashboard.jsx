import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CheckCircle2, FileText, Trophy, Upload, Eye } from "lucide-react";
import api from "../../api";
import { useAuth, useSocketEvent } from "../../context/AuthContext";
import { BadgeList, Loader, ScoreBreakdown, StatCard, StatusChip } from "../../components/ui";
import { fmtDate } from "../../constants";

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const load = useCallback(() => { api.get("/analytics/me").then((r) => setData(r.data)); }, []);
  useEffect(() => { load(); }, [load]);
  useSocketEvent("rankings:updated", load);
  useSocketEvent("achievement:updated", load);
  useSocketEvent("badge:unlocked", () => { load(); refreshUser(); });

  if (!data) return <Loader />;
  const s = data.standing;
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Welcome, {user.name.split(" ")[0]} 👋</h1>
          <p className="muted">Here's how your achievements are counting towards your standing.</p>
        </div>
        <Link className="btn" to="/student/upload"><Upload size={16} /> Upload achievement</Link>
      </div>

      {!s.profileComplete && (
        <div className="alert alert-warning">
          Your CGPA/attendance hasn't been entered yet, so you're listed as <strong>not ranked</strong> instead of being ranked at zero.
          An administrator will add them once results are published.
        </div>
      )}

      <div className="grid grid-4">
        <StatCard icon={FileText} label="Total submitted" value={data.totals.total} />
        <StatCard icon={CheckCircle2} label="Approved" value={data.totals.approved} color="#059669" />
        <StatCard icon={Trophy} label={`Department rank (of ${s.outOf})`} value={s.rank ? `#${s.rank}` : "—"} color="#d97706" />
        <StatCard icon={Award} label="Overall score" value={s.totalScore ?? 0} color="#7c3aed" />
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <h2>Score breakdown</h2>
          <p className="muted small">How your overall score is built. Hover the bar for details.</p>
          <ScoreBreakdown s={s} />
          <div className="kv mt small">
            <span>CGPA</span><span>{s.cgpa || "not entered"}</span>
            <span>Attendance</span><span>{s.attendance ? `${s.attendance}%` : "not entered"}</span>
            <span>SmartScore total</span><span>{s.achievementScore} pts from {s.approvedCount} approved</span>
          </div>
          {data.recruiterViews > 0 && (
            <div className="alert alert-info small mt" style={{ marginBottom: 0 }}>
              <Eye size={14} /> Recruiters viewed your verified profile {data.recruiterViews} time(s). <Link to="/student/profile">See who</Link>
            </div>
          )}
        </div>
        <div className="card">
          <h2>My earned badges</h2>
          <BadgeList badges={user.badges} />
        </div>
      </div>

      <div className="card mt">
        <div className="row between"><h2>Recent submissions</h2><Link to="/student/achievements" className="small">View all</Link></div>
        {data.recent.length === 0 ? <p className="muted small">No submissions yet. Upload your first certificate!</p> :
          data.recent.map((a) => (
            <div className="list-item row between" key={a._id}>
              <div><strong>{a.title}</strong><div className="muted small">{fmtDate(a.createdAt)} · {a.smartScore} pts</div></div>
              <StatusChip status={a.status} />
            </div>
          ))}
      </div>
    </div>
  );
}
