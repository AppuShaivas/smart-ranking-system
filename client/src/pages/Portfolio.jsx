import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, ExternalLink, Trophy } from "lucide-react";
import api, { errorMessage } from "../api";
import { BadgeList, Loader, SkillChip } from "../components/ui";
import { fmtDate, label } from "../constants";

// Public, shareable portfolio: /p/<usn>  (only if the student made it public)
export default function Portfolio() {
  const { usn } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`/public/portfolio/${usn}`).then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, [usn]);

  if (error) return <div className="auth-page"><div className="card center"><h2>Portfolio unavailable</h2><p className="muted">{error}</p><Link to="/">Go home</Link></div></div>;
  if (!data) return <Loader />;
  const { student: s, achievements } = data;
  return (
    <div className="content" style={{ margin: "0 auto", maxWidth: 900 }}>
      <div className="card">
        <div className="row between">
          <div>
            <h1>{s.name}</h1>
            <p className="muted">{s.usn.toUpperCase()} · {s.department} · Semester {s.semester}</p>
          </div>
          <span className="chip chip-verified"><BadgeCheck size={14} /> Faculty-verified portfolio</span>
        </div>
        <div className="kv mt">
          {s.interestedDomain && (<><span>Domain</span><span>{s.interestedDomain}</span></>)}
          {s.careerGoal && (<><span>Career goal</span><span>{s.careerGoal}</span></>)}
          {s.cgpa !== undefined && s.cgpa > 0 && (<><span>CGPA</span><span>{s.cgpa}</span></>)}
        </div>
        <h3 className="mt">Skills</h3>
        <div className="row">{s.skills.map((k) => <SkillChip key={k.name} skill={k} />)}</div>
      </div>
      <div className="card">
        <h2>Badges</h2>
        <BadgeList badges={s.badges} emptyText="No badges yet." />
      </div>
      <div className="card">
        <h2>Verified achievements ({achievements.length})</h2>
        {achievements.map((a) => (
          <div className="list-item" key={a._id}>
            <div className="row between">
              <strong>{a.title}</strong>
              {a.certificate && <a href={a.certificate} target="_blank" rel="noreferrer" className="small"><ExternalLink size={13} /> Certificate</a>}
              {a.projectUrl && <a href={a.projectUrl} target="_blank" rel="noreferrer" className="small"><ExternalLink size={13} /> Project</a>}
            </div>
            <div className="row small muted">
              <span className="chip">{label(a.category)}</span><span className="chip">{label(a.level)}</span><span className="chip">{label(a.position)}</span>
              <span>{fmtDate(a.eventDate)}</span>
            </div>
            <div className="small" style={{ color: "#047857", marginTop: 4 }}>
              <BadgeCheck size={13} /> Verified by {a.verifiedBy?.name || "faculty"} on {fmtDate(a.verifiedAt)}
            </div>
          </div>
        ))}
      </div>
      <p className="center muted small"><Trophy size={13} /> Smart Student Achievement Ranking System · BMS Institute of Technology and Management</p>
    </div>
  );
}
