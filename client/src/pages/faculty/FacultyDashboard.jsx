import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ClipboardCheck, Clock, FileText, Users, Percent } from "lucide-react";
import api from "../../api";
import { useAuth, useSocketEvent } from "../../context/AuthContext";
import { Loader, StatCard } from "../../components/ui";
import { label } from "../../constants";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const load = useCallback(() => { api.get("/analytics/department").then((r) => setD(r.data)); }, []);
  useEffect(() => { load(); }, [load]);
  useSocketEvent("achievement:new", load);
  useSocketEvent("achievement:updated", load);

  if (!d) return <Loader />;
  const pie = [
    { name: "Approved", value: d.totals.approved, color: "#10b981" },
    { name: "Pending", value: d.totals.pending, color: "#f59e0b" },
    { name: "Rejected", value: d.totals.rejected, color: "#ef4444" },
  ].filter((p) => p.value);
  return (
    <div>
      <div className="page-head">
        <div><h1>{d.department} Dashboard</h1><p className="muted">Welcome, {user.name}. You verify achievements for the {d.department} department only.</p></div>
        <Link className="btn" to="/faculty/verify"><ClipboardCheck size={16} /> Review queue ({d.totals.pending})</Link>
      </div>
      <div className="grid grid-4">
        <StatCard icon={Users} label="Department students" value={d.students} />
        <StatCard icon={FileText} label="Total submissions" value={d.totals.total} color="#0891b2" />
        <StatCard icon={Clock} label="Pending review" value={d.totals.pending} color="#d97706" />
        <StatCard icon={Percent} label="Review completion" value={`${d.completion}%`} color="#059669" />
      </div>
      <div className="grid grid-2 mt">
        <div className="card">
          <h2>Verification status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>{pie.map((p) => <Cell key={p.name} fill={p.color} />)}</Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2>Top categories (approved SmartScore)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={d.topCategories.map((c) => ({ name: label(c.category), Score: c.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card mt">
        <div className="row between"><h2>Top 5 students</h2><Link className="small" to="/rankings">Full leaderboard</Link></div>
        {d.topStudents.map((r) => (
          <div className="list-item row between" key={r.student._id}>
            <div className="row"><span className={`rank-pill rank-${r.rank}`}>{r.rank}</span><div><strong>{r.student.name}</strong><div className="muted small">{r.student.usn.toUpperCase()} · Sem {r.student.semester}</div></div></div>
            <strong>{r.totalScore}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
