import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES, LEVELS, POSITIONS, label, smartScore, CATEGORY_WEIGHTS, LEVEL_MULTIPLIERS, POSITION_BONUS } from "../../constants";

const today = new Date().toISOString().slice(0, 10);

export default function UploadAchievement() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "technical", level: "college", position: "participation",
    eventDate: "", evidenceType: "Certificate", skillTags: "", projectUrl: "", clientContact: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const freelance = form.category === "freelance";
  const score = smartScore(form.category, form.level, form.position);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!freelance && !file) return setError("Please attach your certificate.");
    if (file && file.size > 5 * 1024 * 1024) return setError("File must be smaller than 5 MB.");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (!freelance && file) fd.append("certificate", file);
    setBusy(true);
    try {
      await api.post("/achievements", fd);
      toast("Sent to your department's faculty for verification.", "success", "Achievement submitted");
      navigate("/student/achievements");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Upload achievement</h1>
          <p className="muted">Submit evidence for faculty verification. Approved achievements count towards your ranking.</p>
        </div>
      </div>
      <div className="grid grid-side">
        <form className="card" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field"><label>Title *</label><input required maxLength={150} value={form.title} onChange={set("title")} placeholder="e.g. HackNova 24-Hour Hackathon" /></div>
          <div className="grid grid-3">
            <div className="field"><label>Category *</label>
              <select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></div>
            <div className="field"><label>Level *</label>
              <select value={form.level} onChange={set("level")}>{LEVELS.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></div>
            <div className="field"><label>Position *</label>
              <select value={form.position} onChange={set("position")}>{POSITIONS.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="field"><label>Event date *</label><input type="date" required max={today} value={form.eventDate} onChange={set("eventDate")} /></div>
            <div className="field"><label>Evidence type</label>
              <select value={form.evidenceType} onChange={set("evidenceType")}>
                <option>Certificate</option><option>Certificate/Event Proof</option><option>Project Link</option>
              </select></div>
          </div>
          <div className="field"><label>Description</label><textarea maxLength={1000} value={form.description} onChange={set("description")} placeholder="What did you do? What was the outcome?" /></div>
          <div className="field"><label>Skills demonstrated</label>
            <input value={form.skillTags} onChange={set("skillTags")} placeholder="e.g. Python, React, Teamwork" />
            <div className="hint">Comma-separated. When approved, matching skills on your profile become <strong>verified</strong>, which recruiters can see.</div></div>

          {freelance ? (
            <div className="grid grid-2">
              <div className="field"><label>Project link *</label><input type="url" required value={form.projectUrl} onChange={set("projectUrl")} placeholder="https://..." /></div>
              <div className="field"><label>Client contact</label><input value={form.clientContact} onChange={set("clientContact")} placeholder="client email or phone" /></div>
            </div>
          ) : (
            <div className="field"><label>Certificate * (PDF, JPG or PNG, max 5 MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0] || null)} /></div>
          )}
          <button className="btn" disabled={busy}><Upload size={16} /> {busy ? "Uploading..." : "Submit for verification"}</button>
        </form>

        <div className="card" style={{ alignSelf: "start" }}>
          <h2>SmartScore preview</h2>
          <div className="preview-score">{score}</div>
          <p className="small muted">
            {label(form.category)} weight <strong>{CATEGORY_WEIGHTS[form.category]}</strong> × {label(form.level)} multiplier <strong>{LEVEL_MULTIPLIERS[form.level]}</strong> + {label(form.position)} bonus <strong>{POSITION_BONUS[form.position]}</strong>
          </p>
          <p className="small muted">The score only counts after faculty from your department approve it. Duplicate certificates are rejected automatically.</p>
        </div>
      </div>
    </div>
  );
}
