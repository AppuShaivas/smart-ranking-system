import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Star } from "lucide-react";
import api from "../../api";
import { Empty, Loader, SkillChip } from "../../components/ui";

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function Shortlist() {
  const [list, setList] = useState(null);
  const load = () => api.get("/recruiter/shortlist").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (id) => { await api.post(`/recruiter/shortlist/${id}`); load(); };
  const exportCsv = () => {
    const head = ["Name", "USN", "Department", "Semester", "CGPA", "Backlogs", "Domain", "Career goal", "Verified skills", "Other skills", "Email", "Phone"];
    const rows = list.map((s) => [s.name, s.usn.toUpperCase(), s.department, s.semester, s.cgpa, s.activeBacklogs, s.interestedDomain, s.careerGoal,
      s.skills.filter((k) => k.source === "verified").map((k) => k.name).join("; "),
      s.skills.filter((k) => k.source !== "verified").map((k) => k.name).join("; "), s.email, s.phone]);
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `shortlist-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!list) return <Loader />;
  return (
    <div>
      <div className="page-head">
        <div><h1><Star size={20} /> My shortlist</h1><p className="muted">Candidates you starred. Export to share with your hiring team.</p></div>
        <button className="btn" onClick={exportCsv} disabled={!list.length}><Download size={16} /> Export CSV</button>
      </div>
      <div className="card table-wrap">
        {list.length === 0 ? <Empty>No candidates shortlisted yet. <Link to="/recruiter">Find talent</Link></Empty> : (
          <table>
            <thead><tr><th>Name</th><th>Dept</th><th>CGPA</th><th>Skills</th><th>Contact</th><th></th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s._id}>
                  <td><Link to={`/recruiter/students/${s._id}`}><strong>{s.name}</strong></Link><div className="muted small">{s.careerGoal}</div></td>
                  <td>{s.department} · {s.semester}</td>
                  <td>{s.cgpa || "—"}</td>
                  <td><div className="row" style={{ gap: 4 }}>{s.skills.slice(0, 5).map((k) => <SkillChip key={k.name} skill={{ ...k, level: "" }} />)}</div></td>
                  <td className="small">{s.email}<div className="muted">{s.phone}</div></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => remove(s._id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
