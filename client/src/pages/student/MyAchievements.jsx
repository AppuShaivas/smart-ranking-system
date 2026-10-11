import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useSocketEvent } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Empty, Loader, StatusChip } from "../../components/ui";
import { fmtDate, label } from "../../constants";

export default function MyAchievements() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("");
  const load = useCallback(() => { api.get("/achievements/mine").then((r) => setList(r.data)); }, []);
  useEffect(() => { load(); }, [load]);
  useSocketEvent("achievement:updated", load);

  const remove = async (id) => {
    if (!window.confirm("Delete this pending submission?")) return;
    try {
      await api.delete(`/achievements/${id}`);
      toast("Submission deleted", "success");
      load();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  if (!list) return <Loader />;
  const shown = filter ? list.filter((a) => a.status === filter) : list;
  return (
    <div>
      <div className="page-head">
        <div><h1>My achievements</h1><p className="muted">Status updates appear here live as faculty review your submissions.</p></div>
        <div className="row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 150 }}>
            <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
          <Link className="btn" to="/student/upload"><Upload size={16} /> Upload</Link>
        </div>
      </div>
      <div className="card table-wrap">
        {shown.length === 0 ? <Empty>No achievements to show.</Empty> : (
          <table>
            <thead><tr><th>Title</th><th>Category / Level / Position</th><th>Event date</th><th>Score</th><th>Status</th><th>Faculty remarks</th><th></th></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a._id}>
                  <td><strong>{a.title}</strong>{a.skillTags?.length > 0 && <div className="muted small">{a.skillTags.join(", ")}</div>}</td>
                  <td className="small">{label(a.category)} · {label(a.level)} · {label(a.position)}</td>
                  <td className="small">{fmtDate(a.eventDate)}</td>
                  <td><strong>{a.smartScore}</strong></td>
                  <td><StatusChip status={a.status} /></td>
                  <td className="small">{a.remarks || "—"}{a.verifiedBy && <div className="muted">by {a.verifiedBy.name}, {fmtDate(a.verifiedAt)}</div>}</td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      {a.certificate && <a className="btn btn-ghost" href={a.certificate} target="_blank" rel="noreferrer" title="View certificate"><ExternalLink size={16} /></a>}
                      {a.projectUrl && <a className="btn btn-ghost" href={a.projectUrl} target="_blank" rel="noreferrer" title="Open project"><ExternalLink size={16} /></a>}
                      {a.status === "pending" && <button className="btn btn-ghost" onClick={() => remove(a._id)} title="Delete"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
