import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Search, XCircle } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useAuth, useSocketEvent } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Empty, Loader, StatusChip } from "../../components/ui";
import { CATEGORIES, DEPARTMENTS, fmtDate, label } from "../../constants";

function ReviewCard({ a, onDone }) {
  const toast = useToast();
  const [remarks, setRemarks] = useState(a.remarks || "");
  const [busy, setBusy] = useState(false);
  const decide = async (status) => {
    if (status === "rejected" && !remarks.trim()) return toast("Please write a remark explaining the rejection.", "error");
    setBusy(true);
    try {
      await api.put(`/achievements/${a._id}/verify`, { status, remarks });
      toast(`"${a.title}" ${status}`, status === "approved" ? "success" : "info");
      onDone();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const s = a.student || {};
  return (
    <div className="card">
      <div className="row between">
        <div>
          <strong>{a.title}</strong>
          <div className="muted small">{s.name} · {s.usn?.toUpperCase()} · {s.department} Sem {s.semester}{s.section ? ` · Sec ${s.section}` : ""}</div>
        </div>
        <div className="row"><span className="chip chip-primary">{a.smartScore} pts</span><StatusChip status={a.status} /></div>
      </div>
      <div className="row small mt" style={{ marginTop: "0.6rem" }}>
        <span className="chip">{label(a.category)}</span><span className="chip">{label(a.level)}</span><span className="chip">{label(a.position)}</span>
        <span className="muted">Event: {fmtDate(a.eventDate)} · Submitted: {fmtDate(a.createdAt)}</span>
      </div>
      {a.description && <p className="small" style={{ marginTop: "0.6rem" }}>{a.description}</p>}
      {a.skillTags?.length > 0 && <p className="small muted">Skills claimed: {a.skillTags.join(", ")}</p>}
      <div className="row small">
        {a.certificate && <a href={a.certificate} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><ExternalLink size={13} /> Open certificate</a>}
        {a.projectUrl && <a href={a.projectUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><ExternalLink size={13} /> Open project</a>}
        {a.clientContact && <span className="muted">Client: {a.clientContact}</span>}
      </div>
      {a.status === "pending" ? (
        <div className="row mt" style={{ alignItems: "stretch" }}>
          <input style={{ flex: 1, minWidth: 200 }} placeholder="Remarks (required to reject)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <button className="btn btn-success" disabled={busy} onClick={() => decide("approved")}><CheckCircle2 size={15} /> Approve</button>
          <button className="btn btn-danger" disabled={busy} onClick={() => decide("rejected")}><XCircle size={15} /> Reject</button>
        </div>
      ) : (
        <p className="small muted mt" style={{ marginBottom: 0 }}>
          {a.status === "approved" ? "Approved" : "Rejected"} by {a.verifiedBy?.name || "—"} on {fmtDate(a.verifiedAt)}{a.remarks ? ` · "${a.remarks}"` : ""}
        </p>
      )}
    </div>
  );
}

export default function Verification() {
  const { user } = useAuth();
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [q, setQ] = useState("");
  const [list, setList] = useState(null);
  const [students, setStudents] = useState([]);

  const load = useCallback(() => {
    api.get("/achievements", { params: { status: status || undefined, category: category || undefined, q: q || undefined, department: department || undefined } })
      .then((r) => setList(r.data));
  }, [status, category, q, department]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    if (user.role === "faculty") api.get("/faculty/students").then((r) => setStudents(r.data));
  }, [user.role]);
  useSocketEvent("achievement:new", load);
  useSocketEvent("achievement:updated", load);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{user.role === "faculty" ? "Achievement review queue" : "All achievements"}</h1>
          <p className="muted">{user.role === "faculty" ? `Validate evidence for ${user.department} students. New submissions appear automatically.` : "Admins can review submissions from every department."}</p>
        </div>
      </div>
      <div className="card row">
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: "#94a3b8" }} />
          <input style={{ paddingLeft: 32 }} placeholder="Search by title..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
        <select style={{ width: 160 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
        </select>
        {user.role === "admin" && (
          <select style={{ width: 130 }} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All depts</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>
      <div className="mt">
        {!list ? <Loader /> : list.length === 0 ? <div className="card"><Empty>No submissions match these filters. 🎉</Empty></div> :
          <div className="stack">{list.map((a) => <ReviewCard key={a._id} a={a} onDone={load} />)}</div>}
      </div>
      {user.role === "faculty" && (
        <div className="card mt table-wrap">
          <h2>Class records · {user.department}</h2>
          <table>
            <thead><tr><th>Name</th><th>USN</th><th>Sem</th><th>Sec</th><th>CGPA</th><th>Attendance</th><th>Phone</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} style={{ opacity: s.isActive ? 1 : 0.5 }}>
                  <td>{s.name}</td><td>{s.usn.toUpperCase()}</td><td>{s.semester}</td><td>{s.section}</td>
                  <td>{s.cgpa || "—"}</td><td>{s.attendance ? `${s.attendance}%` : "—"}</td><td>{s.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
