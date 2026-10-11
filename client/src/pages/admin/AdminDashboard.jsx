import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, GraduationCap, Settings, ShieldCheck, Trophy, UserCheck, Users, Power } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useSocketEvent } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Loader, StatCard } from "../../components/ui";
import { label } from "../../constants";

function WeightsPanel({ config, onSaved }) {
  const toast = useToast();
  const [w, setW] = useState({ academicWeight: config.academicWeight, attendanceWeight: config.attendanceWeight,
    achievementWeight: config.achievementWeight, scoringMode: config.scoringMode });
  const [busy, setBusy] = useState(false);
  const sum = Number(w.academicWeight) + Number(w.attendanceWeight) + Number(w.achievementWeight);
  const save = async () => {
    setBusy(true);
    try {
      await api.put("/admin/config", w);
      toast("Ranking weights updated, and every dashboard refreshed live", "success");
      onSaved();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const num = (k, lbl) => (
    <div className="field"><label>{lbl} (%)</label><input type="number" min={0} max={100} value={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.value })} /></div>
  );
  return (
    <div className="card">
      <h2><Settings size={18} /> Algorithm config</h2>
      <p className="muted small">Overall score = weighted blend of CGPA (×10), attendance and achievements.</p>
      <div className="grid grid-3">{num("academicWeight", "Academics / CGPA")}{num("attendanceWeight", "Attendance")}{num("achievementWeight", "Achievements")}</div>
      <div className="field">
        <label>Scoring mode</label>
        <select value={w.scoringMode} onChange={(e) => setW({ ...w, scoringMode: e.target.value })}>
          <option value="normalised">Normalised (recommended): fair 0–100 scale, diminishing returns</option>
          <option value="classic">Classic: original report formula (raw sum of SmartScores)</option>
        </select>
      </div>
      <div className="row between">
        <span className={`chip ${sum === 100 ? "chip-approved" : "chip-rejected"}`}>Total: {sum}% {sum !== 100 && "(must be 100)"}</span>
        <button className="btn" onClick={save} disabled={busy || sum !== 100}>Save weights</button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const load = () => api.get("/analytics/admin").then((r) => setD(r.data));
  useEffect(() => { load(); }, []);
  useSocketEvent("achievement:new", load);
  useSocketEvent("users:updated", load);

  if (!d) return <Loader />;
  return (
    <div>
      <div className="page-head">
        <div><h1>Admin control centre</h1><p className="muted">Platform-wide overview and ranking configuration.</p></div>
        <Link className="btn" to="/admin/users"><Users size={16} /> Manage users</Link>
      </div>
      {d.pendingRecruiters > 0 && (
        <div className="alert alert-warning"><UserCheck size={15} /> {d.pendingRecruiters} recruiter account(s) waiting for approval. <Link to="/admin/users?role=recruiter">Review now</Link></div>
      )}
      <div className="grid grid-4">
        <StatCard icon={GraduationCap} label="Registered students" value={d.roles.student} />
        <StatCard icon={ShieldCheck} label="Faculty / admins" value={`${d.roles.faculty} / ${d.roles.admin}`} color="#0891b2" />
        <StatCard icon={Trophy} label={`Achievements (${d.totals.pending} pending)`} value={d.totals.total} color="#d97706" />
        <StatCard icon={Briefcase} label="Recruiters" value={d.roles.recruiter} color="#059669" />
      </div>
      <div className="grid grid-2 mt">
        <WeightsPanel key={JSON.stringify(d.config)} config={d.config} onSaved={load} />
        <div className="card">
          <h2>Top score categories</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.categories.map((c) => ({ name: label(c.category), Score: c.score, Avg: c.avgScore }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-2 mt">
        <div className="card">
          <h2>Students by department</h2>
          {d.departments.map((x) => <div className="list-item row between small" key={x.department}><span>{x.department}</span><strong>{x.students}</strong></div>)}
        </div>
        <div className="card">
          <h2>Account status</h2>
          <div className="list-item row between small"><span><Power size={13} /> Disabled accounts</span><strong>{d.disabled}</strong></div>
          <div className="list-item row between small"><span><UserCheck size={13} /> Recruiters awaiting approval</span><strong>{d.pendingRecruiters}</strong></div>
          <div className="list-item row between small"><span>Approved / rejected achievements</span><strong>{d.totals.approved} / {d.totals.rejected}</strong></div>
        </div>
      </div>
    </div>
  );
}
