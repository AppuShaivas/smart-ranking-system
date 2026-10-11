import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { homeFor } from "../constants";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(homeFor(u.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="center" style={{ marginBottom: "1rem" }}>
          <div className="brand-logo" style={{ margin: "0 auto 0.7rem", color: "#fff", width: 48, height: 48 }}><Trophy /></div>
          <h1>Welcome back</h1>
          <p className="muted small">Log in as a student, faculty member, admin or recruiter</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
          </div>
          <button className="btn btn-block" disabled={busy}><LogIn size={16} /> {busy ? "Logging in..." : "Log in"}</button>
        </form>
        <p className="center small mt">New here? <Link to="/register">Create an account</Link></p>
        <div className="alert alert-info small" style={{ marginTop: "1rem", marginBottom: 0 }}>
          <strong>Demo accounts</strong> (password <code>Demo@123</code>):<br />
          admin@example.com · recruiter@example.com · ramesh.kulkarni.faculty@example.com · imran.1by25mc004@example.com
        </div>
      </div>
    </div>
  );
}
