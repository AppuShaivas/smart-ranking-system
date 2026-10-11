import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Power, Search, Trash2, UserCheck } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useAuth, useSocketEvent } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Empty, Loader, Modal } from "../../components/ui";
import { DEPARTMENTS } from "../../constants";

function EditUser({ u, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ ...u });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${u._id}`, f);
      toast("User updated", "success");
      onSaved();
      onClose();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };
  const input = (k, lbl, props = {}) => <div className="field"><label>{lbl}</label><input value={f[k] ?? ""} onChange={set(k)} {...props} /></div>;
  return (
    <Modal title={`Edit ${u.name}`} onClose={onClose}>
      <form onSubmit={save}>
        {input("name", "Name", { required: true })}
        <div className="grid grid-2">
          <div className="field"><label>Department</label>
            <select value={f.department} onChange={set("department")}><option value="">—</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          {input("phone", "Phone")}
        </div>
        {u.role === "student" && (
          <>
            <div className="grid grid-3">{input("semester", "Semester")}{input("section", "Section")}{input("activeBacklogs", "Active backlogs", { type: "number", min: 0 })}</div>
            <div className="grid grid-2">
              {input("cgpa", "CGPA (0–10)", { type: "number", step: "0.01", min: 0, max: 10 })}
              {input("attendance", "Attendance % (0–100)", { type: "number", min: 0, max: 100 })}
            </div>
            <p className="hint" style={{ marginTop: "-0.4rem" }}>Saving recalculates this student's ranking and badges instantly.</p>
          </>
        )}
        {u.role === "faculty" && <div className="grid grid-2">{input("designation", "Designation")}{input("specialization", "Specialization")}</div>}
        {u.role === "recruiter" && <div className="grid grid-2">{input("company", "Company")}{input("designation", "Designation")}</div>}
        <button className="btn btn-block">Save</button>
      </form>
    </Modal>
  );
}

export default function UserManagement() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "");
  const [q, setQ] = useState("");
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    api.get("/admin/users", { params: { role: role || undefined, q: q || undefined } }).then((r) => setList(r.data));
  }, [role, q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useSocketEvent("users:updated", load);

  const toggle = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}`, { isActive: !u.isActive });
      toast(u.role === "recruiter" && !u.isActive ? `${u.name} approved` : `${u.name} ${u.isActive ? "disabled" : "enabled"}`, "success");
      load();
    } catch (e) { toast(errorMessage(e), "error"); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This also deletes their achievements. This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast("User deleted", "success");
      load();
    } catch (e) { toast(errorMessage(e), "error"); }
  };

  return (
    <div>
      <div className="page-head"><div><h1>User management</h1><p className="muted">Search, edit, enable/disable or delete accounts. Approve recruiters here.</p></div></div>
      <div className="card row">
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: "#94a3b8" }} />
          <input style={{ paddingLeft: 32 }} placeholder="Search name, email, USN, employee ID or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select style={{ width: 160 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option><option value="student">Students</option><option value="faculty">Faculty</option><option value="admin">Admins</option><option value="recruiter">Recruiters</option>
        </select>
      </div>
      <div className="card mt table-wrap">
        {!list ? <Loader /> : list.length === 0 ? <Empty>No users found.</Empty> : (
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>ID / Company</th><th>Dept</th><th>CGPA</th><th>Attend.</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong><div className="muted small">{u.email}</div></td>
                  <td><span className="chip chip-primary">{u.role}</span></td>
                  <td className="small">{u.usn?.toUpperCase() || u.employeeId || u.company || "—"}</td>
                  <td>{u.department || "—"}</td>
                  <td>{u.role === "student" ? u.cgpa || "—" : ""}</td>
                  <td>{u.role === "student" ? (u.attendance ? `${u.attendance}%` : "—") : ""}</td>
                  <td>{u.isActive ? <span className="chip chip-approved">active</span> :
                    <span className={`chip ${u.role === "recruiter" ? "chip-pending" : "chip-rejected"}`}>{u.role === "recruiter" ? "awaiting approval" : "disabled"}</span>}</td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap", gap: 2 }}>
                      <button className="btn btn-ghost" title="Edit" onClick={() => setEditing(u)}><Pencil size={15} /></button>
                      {u._id !== me._id && (
                        <>
                          <button className="btn btn-ghost" title={u.isActive ? "Disable" : u.role === "recruiter" ? "Approve" : "Enable"} onClick={() => toggle(u)}>
                            {!u.isActive && u.role === "recruiter" ? <UserCheck size={15} color="#059669" /> : <Power size={15} color={u.isActive ? "#64748b" : "#059669"} />}
                          </button>
                          <button className="btn btn-ghost" title="Delete" onClick={() => remove(u)}><Trash2 size={15} color="#dc2626" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <EditUser u={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
