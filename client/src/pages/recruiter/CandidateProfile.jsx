import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ExternalLink, Mail, Phone, Star } from "lucide-react";
import api, { errorMessage } from "../../api";
import { BadgeList, Loader, SkillChip } from "../../components/ui";
import { fmtDate, label } from "../../constants";

export default function CandidateProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/recruiter/students/${id}`).then((r) => setData(r.data)).catch((e) => setError(errorMessage(e))); }, [id]);
  if (error) return <div className="card"><p>{error}</p><Link to="/recruiter">Back</Link></div>;
  if (!data) return <Loader />;
  const { student: s, achievements } = data;
  const star = async () => {
    const r = await api.post(`/recruiter/shortlist/${s._id}`);
    setData({ ...data, shortlisted: r.data.shortlisted });
  };
  return (
    <div>
      <Link to="/recruiter" className="small"><ArrowLeft size={14} /> Back to search</Link>
      <div className="card mt">
        <div className="row between">
          <div><h1>{s.name}</h1><p className="muted">{s.usn.toUpperCase()} · {s.department} · Semester {s.semester}</p></div>
          <button className="btn btn-outline" onClick={star}><Star size={16} fill={data.shortlisted ? "#f59e0b" : "none"} color="#f59e0b" /> {data.shortlisted ? "Shortlisted" : "Add to shortlist"}</button>
        </div>
        <div className="grid grid-2 mt">
          <div className="kv small">
            <span>CGPA</span><span>{s.cgpa || "—"}</span>
            <span>Active backlogs</span><span>{s.activeBacklogs}</span>
            <span>Domain</span><span>{s.interestedDomain || "—"}</span>
            <span>Career goal</span><span>{s.careerGoal || "—"}</span>
          </div>
          <div className="kv small">
            <span><Mail size={13} /> Email</span><span><a href={`mailto:${s.email}`}>{s.email}</a></span>
            <span><Phone size={13} /> Phone</span><span>{s.phone || "—"}</span>
          </div>
        </div>
        <h3 className="mt">Skills</h3>
        <div className="row">{s.skills.map((k) => <SkillChip key={k.name} skill={k} />)}</div>
      </div>
      <div className="card"><h2>Badges</h2><BadgeList badges={s.badges} emptyText="No badges yet." /></div>
      <div className="card">
        <h2>Faculty-verified achievements ({achievements.length})</h2>
        {achievements.map((a) => (
          <div className="list-item" key={a._id}>
            <div className="row between">
              <strong>{a.title}</strong>
              <div className="row">
                {a.certificate && <a className="small" href={a.certificate} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Certificate</a>}
                {a.projectUrl && <a className="small" href={a.projectUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Project</a>}
              </div>
            </div>
            <div className="row small muted"><span className="chip">{label(a.category)}</span><span className="chip">{label(a.level)}</span><span className="chip">{label(a.position)}</span>{fmtDate(a.eventDate)}{a.skillTags?.length > 0 && ` · ${a.skillTags.join(", ")}`}</div>
            <div className="small" style={{ color: "#047857", marginTop: 4 }}><BadgeCheck size={13} /> Verified by {a.verifiedBy?.name} ({a.verifiedBy?.designation || "Faculty"}) on {fmtDate(a.verifiedAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
