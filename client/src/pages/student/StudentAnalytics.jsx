import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import api from "../../api";
import { useSocketEvent } from "../../context/AuthContext";
import { Loader, ScoreBreakdown, StatCard } from "../../components/ui";
import { label } from "../../constants";

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const load = () => api.get("/analytics/me").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);
  useSocketEvent("rankings:updated", load);

  if (!data) return <Loader />;
  const { totals, categories, standing } = data;
  const pie = [
    { name: "Approved", value: totals.approved, color: "#10b981" },
    { name: "Pending", value: totals.pending, color: "#f59e0b" },
    { name: "Rejected", value: totals.rejected, color: "#ef4444" },
  ].filter((p) => p.value > 0);
  const bars = categories.map((c) => ({ name: label(c.category), Count: c.count, SmartScore: c.score }));

  return (
    <div>
      <div className="page-head"><div><h1>My analytics</h1><p className="muted">See which categories are driving your standing.</p></div></div>
      <div className="grid grid-4">
        <StatCard icon={Award} label="Overall score" value={standing.totalScore ?? 0} color="#7c3aed" />
        <StatCard icon={Trophy} label="Department rank" value={standing.rank ? `#${standing.rank}` : "—"} color="#d97706" />
        <StatCard icon={CheckCircle2} label="Approved" value={totals.approved} color="#059669" />
        <StatCard icon={Clock} label="Pending / rejected" value={`${totals.pending} / ${totals.rejected}`} color="#64748b" />
      </div>
      <div className="card mt"><h2>Score breakdown</h2><ScoreBreakdown s={standing} /></div>
      <div className="grid grid-2 mt">
        <div className="card">
          <h2>Submission status</h2>
          {pie.length === 0 ? <p className="muted small">No submissions yet.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} label>
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h2>Approved achievements by category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis fontSize={11} />
              <Tooltip /><Legend />
              <Bar dataKey="Count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SmartScore" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="muted small mt"><XCircle size={12} /> Rejected and pending achievements don't count towards your score.</p>
    </div>
  );
}
