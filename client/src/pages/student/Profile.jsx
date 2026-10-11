import { useEffect, useState } from "react";
import { BadgeCheck, Copy, Eye, Plus, Save, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { DOMAINS, SKILL_LEVELS, fmtDate } from "../../constants";

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    phone: user.phone || "", interestedDomain: user.interestedDomain || "", careerGoal: user.careerGoal || "",
    recruiterVisible: user.recruiterVisible, portfolioPublic: user.portfolioPublic, showCgpaOnPortfolio: user.showCgpaOnPortfolio,
  });
  const [skills, setSkills] = useState(user.skills || []);
  const [views, setViews] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/profile/views").then((r) => setViews(r.data)).catch(() => {}); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const portfolioUrl = `${window.location.origin}/p/${user.usn}`;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/profile/me", { ...form, skills: skills.filter((s) => s.name.trim()) });
      setUser(data);
      setSkills(data.skills);
      toast("Profile saved", "success");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <div className="page-head">
        <div><h1>Profile & portfolio</h1><p className="muted">Your career profile, skills and who can see them.</p></div>
        <button className="btn" disabled={busy}><Save size={16} /> {busy ? "Saving..." : "Save changes"}</button>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h2>Academic details</h2>
          <div className="kv small">
            <span>Name</span><span>{user.name}</span>
            <span>USN</span><span>{user.usn.toUpperCase()}</span>
            <span>Department</span><span>{user.department} · Semester {user.semester} · Section {user.section || "—"}</span>
            <span>Email</span><span>{user.email}</span>
            <span>CGPA</span><span>{user.cgpa || "not entered"}</span>
            <span>Attendance</span><span>{user.attendance ? `${user.attendance}%` : "not entered"}</span>
          </div>
          <p className="hint">CGPA and attendance are entered by the administrator so they can be trusted.</p>
          <div className="field mt"><label>Mobile number</label><input value={form.phone} onChange={set("phone")} pattern="[6-9][0-9]{9}" title="10-digit mobile number" /></div>
          <div className="field"><label>Domain of interest</label>
            <select value={form.interestedDomain} onChange={set("interestedDomain")}>
              <option value="">Select...</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}
            </select></div>
          <div className="field"><label>Career goal</label><input value={form.careerGoal} onChange={set("careerGoal")} placeholder="e.g. Data Scientist" /></div>
        </div>

        <div className="card">
          <h2>Skills</h2>
          <p className="muted small">Skills backed by an approved achievement are marked <span className="chip chip-verified"><BadgeCheck size={12} /> verified</span> automatically.</p>
          {skills.map((s, i) => (
            <div className="skill-row" key={i}>
              <input value={s.name} placeholder="Skill" onChange={(e) => setSkills(skills.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <select value={s.level} onChange={(e) => setSkills(skills.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}>
                {SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <span className={`chip ${s.source === "verified" ? "chip-verified" : ""}`}>{s.source === "verified" ? "verified" : "self"}</span>
              <button type="button" className="btn btn-ghost" onClick={() => setSkills(skills.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSkills([...skills, { name: "", level: "Average", source: "self-declared" }])}>
            <Plus size={14} /> Add skill
          </button>
        </div>

        <div className="card">
          <h2>Privacy & sharing</h2>
          <label className="check"><input type="checkbox" checked={form.recruiterVisible} onChange={set("recruiterVisible")} />
            <span>Let approved recruiters find my profile<div className="hint">Shares your name, department, CGPA, backlogs, skills, badges and verified achievements with recruiters approved by the admin.</div></span></label>
          <label className="check mt"><input type="checkbox" checked={form.portfolioPublic} onChange={set("portfolioPublic")} />
            <span>Make my verified portfolio public<div className="hint">Anyone with the link can see your verified achievements, e.g. on your resume or LinkedIn.</div></span></label>
          <label className="check mt"><input type="checkbox" checked={form.showCgpaOnPortfolio} onChange={set("showCgpaOnPortfolio")} />
            <span>Show CGPA on my public portfolio</span></label>
          {user.portfolioPublic && (
            <div className="alert alert-info small mt" style={{ marginBottom: 0 }}>
              Your portfolio link: <a href={portfolioUrl} target="_blank" rel="noreferrer">{portfolioUrl}</a>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(portfolioUrl); toast("Link copied", "success"); }}><Copy size={13} /></button>
            </div>
          )}
        </div>

        <div className="card">
          <h2><Eye size={18} /> Recruiter views</h2>
          {views.length === 0 ? <p className="muted small">No recruiter has viewed your profile yet.</p> :
            views.map((v) => <div className="list-item small" key={v._id}><strong>{v.company}</strong> <span className="muted">· {v.recruiter} · {fmtDate(v.at)}</span></div>)}
        </div>
      </div>
    </form>
  );
}
