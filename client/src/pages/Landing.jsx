import { Link, Navigate } from "react-router-dom";
import { GraduationCap, ClipboardCheck, ShieldCheck, Briefcase, Trophy, Sparkles, BadgeCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../constants";

const PORTALS = [
  { role: "student", title: "Student Portal", icon: GraduationCap, color: "#4f46e5",
    text: "Upload certificates, track verification live, see your rank, earn badges and share a verified portfolio." },
  { role: "faculty", title: "Faculty Portal", icon: ClipboardCheck, color: "#0891b2",
    text: "Review evidence from your department, approve or reject with remarks, and monitor class performance." },
  { role: "admin", title: "Admin Portal", icon: ShieldCheck, color: "#7c3aed",
    text: "Manage accounts, approve recruiters, tune the ranking weights and view platform-wide analytics." },
  { role: "recruiter", title: "Recruiter Portal", icon: Briefcase, color: "#059669",
    text: "Search opted-in students by verified skills, view faculty-verified achievements and build a shortlist." },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return (
    <div>
      <nav className="landing-nav">
        <div className="brand" style={{ color: "#0f172a", padding: 0 }}>
          <div className="brand-logo" style={{ color: "#fff" }}><Trophy size={18} /></div>
          Smart Student Achievement Ranking System
        </div>
        <div className="row">
          <Link className="btn btn-outline" to="/login">Log in</Link>
          <Link className="btn" to="/register">Register</Link>
        </div>
      </nav>
      <section className="hero">
        <span className="chip chip-primary"><Sparkles size={12} /> Transparent · Verified · Real-time</span>
        <h1 style={{ marginTop: "1rem" }}>Every achievement, verified and fairly ranked</h1>
        <p>
          A secure portal for collecting student achievements, faculty evidence verification and transparent merit
          ranking that blends CGPA, attendance and verified achievements, with live updates on every dashboard.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn" to="/register">Get started</Link>
          <Link className="btn btn-outline" to="/login"><BadgeCheck size={16} /> I already have an account</Link>
        </div>
      </section>
      <section className="grid grid-4" style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem 1.5rem 4rem" }}>
        {PORTALS.map(({ role, title, icon: Icon, color, text }) => (
          <div className="card portal" key={role}>
            <div className="stat-icon" style={{ background: `${color}1a`, color }}><Icon size={24} /></div>
            <h2>{title}</h2>
            <p className="muted small" style={{ flex: 1 }}>{text}</p>
            <div className="row">
              <Link className="btn btn-sm" to="/login">Log in</Link>
              <Link className="btn btn-outline btn-sm" to={`/register?role=${role}`}>Register</Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
