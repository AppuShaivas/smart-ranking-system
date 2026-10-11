import { useCallback, useEffect, useState } from "react";
import { Download, Trophy } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api, { errorMessage } from "../api";
import { useAuth, useSocketEvent } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS } from "../constants";
import { Empty, Loader } from "../components/ui";

export default function Rankings() {
  const { user } = useAuth();
  const toast = useToast();
  const [department, setDepartment] = useState(user.role === "admin" ? "all" : user.department);
  const [semester, setSemester] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/rankings", { params: { department, semester: semester || undefined } })
      .then((r) => setData(r.data))
      .catch((e) => toast(errorMessage(e), "error"));
  }, [department, semester, toast]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent("rankings:updated", load); // refresh live when anything changes

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Smart Student Achievement Ranking System - Leaderboard", 14, 16);
    doc.setFontSize(9);
    doc.text(`Department: ${department === "all" ? "All" : department}${semester ? `  Semester: ${semester}` : ""}  |  ` +
      `Weights ${data.config.academicWeight}/${data.config.attendanceWeight}/${data.config.achievementWeight}  |  ` +
      `Mode: ${data.config.scoringMode}  |  Generated ${new Date().toLocaleString("en-IN")}`, 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [["Rank", "Name", "USN", "Dept", "Sem", "CGPA", "Attend.", "Approved", "Ach. pts", "Overall"]],
      body: data.ranked.map((r) => [r.rank, r.student.name, r.student.usn.toUpperCase(), r.student.department, r.student.semester,
        r.cgpa, `${r.attendance}%`, r.approvedCount, r.achievementScore, r.totalScore]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`rankings-${department}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!data) return <Loader />;
  const { config, ranked, incomplete } = data;
  return (
    <div>
      <div className="page-head">
        <div>
          <h1><Trophy size={22} /> Achievement Rankings</h1>
          <p className="muted small">
            Overall = {config.academicWeight}% academic + {config.attendanceWeight}% attendance + {config.achievementWeight}% achievements ·
            mode: <strong>{config.scoringMode}</strong> · updates live
          </p>
        </div>
        <div className="row">
          <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: 130 }}>
            <option value="all">All depts</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} style={{ width: 130 }}>
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <button className="btn" onClick={exportPdf} disabled={!ranked.length}><Download size={16} /> Download PDF Report</button>
        </div>
      </div>
      <div className="card table-wrap">
        {ranked.length === 0 ? <Empty>No ranked students for this filter.</Empty> : (
          <table>
            <thead>
              <tr><th>Rank</th><th>Student</th><th>Dept / Sem</th><th>CGPA</th><th>Attendance</th><th>Approved</th><th>Achievement pts</th><th>Overall score</th></tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.student._id} className={String(r.student._id) === String(user._id) ? "highlight" : ""}>
                  <td><span className={`rank-pill rank-${r.rank}`}>{r.rank}</span></td>
                  <td><strong>{r.student.name}</strong><div className="muted small">{r.student.usn.toUpperCase()}</div></td>
                  <td>{r.student.department} · {r.student.semester}</td>
                  <td>{r.cgpa}</td>
                  <td>{r.attendance}%</td>
                  <td>{r.approvedCount}</td>
                  <td>{r.achievementScore}</td>
                  <td><strong>{r.totalScore}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {incomplete.length > 0 && (
        <div className="card">
          <h2>Not ranked yet ({incomplete.length})</h2>
          <p className="muted small">These students don't have CGPA/attendance entered yet, so they aren't ranked unfairly at zero.</p>
          <div className="row">{incomplete.map((r) => <span className="chip" key={r.student._id}>{r.student.name} · {r.student.usn.toUpperCase()}</span>)}</div>
        </div>
      )}
    </div>
  );
}
