import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Search, Star } from "lucide-react";
import api, { errorMessage } from "../../api";
import { useToast } from "../../context/ToastContext";
import { Empty, Loader, SkillChip } from "../../components/ui";
import { DEPARTMENTS, DOMAINS } from "../../constants";

export default function RecruiterSearch() {
  const toast = useToast();
  const [f, setF] = useState({ skill: "", verifiedOnly: true, domain: "", department: "", minCgpa: "", maxBacklogs: "", q: "" });
  const [list, setList] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== "" && v !== false).map(([k, v]) => [k, String(v)]));
    api.get("/recruiter/students", { params }).then((r) => setList(r.data)).catch((e) => toast(errorMessage(e), "error"));
  }, [f, toast]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const star = async (s) => {
    const { data } = await api.post(`/recruiter/shortlist/${s._id}`);
    setList((l) => l.map((x) => (x._id === s._id ? { ...x, shortlisted: data.shortlisted } : x)));
  };

  return (
    <div>
      <div className="page-head">
        <div><h1>Find verified talent</h1><p className="muted">Only students who opted in are shown. Skills marked <BadgeCheck size={13} color="#059669" /> are backed by faculty-verified achievements.</p></div>
      </div>
      <div className="card">
        <div className="grid grid-4">
          <div className="field"><label>Skills (comma-separated)</label><input value={f.skill} onChange={set("skill")} placeholder="Python, SQL" /></div>
          <div className="field"><label>Domain</label><select value={f.domain} onChange={set("domain")}><option value="">Any</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="field"><label>Department</label><select value={f.department} onChange={set("department")}><option value="">Any</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div className="field"><label>Name</label><input value={f.q} onChange={set("q")} placeholder="Search by name" /></div>
          <div className="field"><label>Minimum CGPA</label><input type="number" step="0.1" min="0" max="10" value={f.minCgpa} onChange={set("minCgpa")} /></div>
          <div className="field"><label>Max active backlogs</label><input type="number" min="0" value={f.maxBacklogs} onChange={set("maxBacklogs")} /></div>
          <div className="field" style={{ alignSelf: "end" }}><label className="check"><input type="checkbox" checked={f.verifiedOnly} onChange={set("verifiedOnly")} /> Verified skills only</label></div>
        </div>
      </div>
      <div className="mt">
        {!list ? <Loader /> : list.length === 0 ? <div className="card"><Empty><Search size={18} /> No students match these filters.</Empty></div> : (
          <>
            <p className="muted small">{list.length} candidate(s)</p>
            <div className="grid grid-3">
              {list.map((s) => (
                <div className="card" key={s._id} style={{ marginTop: 0 }}>
                  <div className="row between">
                    <div><strong>{s.name}</strong><div className="muted small">{s.department} · Sem {s.semester} · CGPA {s.cgpa || "—"}</div></div>
                    <button className="btn btn-ghost" onClick={() => star(s)} title="Shortlist"><Star size={18} fill={s.shortlisted ? "#f59e0b" : "none"} color={s.shortlisted ? "#f59e0b" : "#94a3b8"} /></button>
                  </div>
                  {s.careerGoal && <p className="small" style={{ marginTop: 6 }}>🎯 {s.careerGoal}{s.interestedDomain ? ` · ${s.interestedDomain}` : ""}</p>}
                  <div className="row" style={{ gap: 4 }}>{s.skills.slice(0, 6).map((k) => <SkillChip key={k.name} skill={{ ...k, level: "" }} />)}</div>
                  <p className="small muted mt" style={{ marginBottom: 8 }}>{s.approvedCount} verified achievements · {s.badges.length} badges · {s.activeBacklogs} backlogs</p>
                  <Link className="btn btn-outline btn-sm btn-block" to={`/recruiter/students/${s._id}`}>View verified profile</Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
