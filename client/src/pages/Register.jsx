import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { DEPARTMENTS, homeFor } from "../constants";

const ROLES = [
  { id: "student", label: "Student" },
  { id: "faculty", label: "Faculty" },
  { id: "admin", label: "Admin" },
  { id: "recruiter", label: "Recruiter" },
];

export default function Register() {
  const [params] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(ROLES.some((r) => r.id === params.get("role")) ? params.get("role") : "student");
  const [form, setForm] = useState({ department: "MCA", semester: "1", section: "A" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await register({ ...form, role });
      if (data.pendingApproval) setSuccess(data.message);
      else navigate(homeFor(data.user.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const input = (k, lbl, props = {}) => (
    <div className="field">
      <label>{lbl}</label>
      <input value={form[k] || ""} onChange={set(k)} {...props} />
    </div>
  );
  const deptSelect = (
    <div className="field">
      <label>Department</label>
      <select value={form.department} onChange={set("department")}>
        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
      </select>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ maxWidth: 520 }}>
        <h1 className="center">Create your account</h1>
        <p className="muted small center">Choose your role to see the right form</p>
        <div className="tabs">
          {ROLES.map((r) => (
            <button key={r.id} type="button" className={`tab ${role === r.id ? "active" : ""}`} onClick={() => setRole(r.id)}>{r.label}</button>
          ))}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success ? (
          <div className="alert alert-success">{success} <Link to="/login">Back to login</Link></div>
        ) : (
          <form onSubmit={submit}>
            {input("name", "Full name", { required: true })}
            {input("email", "Email", { type: "email", required: true })}
            {input("password", "Password (min 6 characters)", { type: "password", required: true, minLength: 6 })}

            {role === "student" && (
              <>
                {input("usn", "USN (University Seat Number)", { required: true, placeholder: "1BY25MC001" })}
                <div className="grid grid-3">
                  {deptSelect}
                  <div className="field">
                    <label>Semester</label>
                    <select value={form.semester} onChange={set("semester")}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  {input("section", "Section", { maxLength: 2 })}
                </div>
                {input("phone", "Mobile number (optional)", { pattern: "[6-9][0-9]{9}", title: "10-digit mobile number" })}
              </>
            )}
            {role === "faculty" && (
              <>
                <div className="grid grid-2">
                  {input("employeeId", "Employee ID", { required: true })}
                  {deptSelect}
                </div>
                <div className="grid grid-2">
                  {input("designation", "Designation", { placeholder: "Assistant Professor" })}
                  {input("specialization", "Specialization")}
                </div>
              </>
            )}
            {role === "admin" && (
              <>
                {input("adminCode", "Admin security code", { required: true, type: "password" })}
                <p className="hint" style={{ marginTop: "-0.5rem", marginBottom: "0.9rem" }}>Ask the project owner for this code (set as ADMIN_CODE in server/.env).</p>
              </>
            )}
            {role === "recruiter" && (
              <>
                <div className="grid grid-2">
                  {input("company", "Company", { required: true })}
                  {input("designation", "Your designation")}
                </div>
                <div className="alert alert-info small">Recruiter accounts must be approved by an administrator before you can log in.</div>
              </>
            )}
            <button className="btn btn-block" disabled={busy}><UserPlus size={16} /> {busy ? "Creating..." : "Create account"}</button>
          </form>
        )}
        <p className="center small mt">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
