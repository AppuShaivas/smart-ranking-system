import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Upload, Trophy, ChartColumn, CircleUser, ClipboardCheck, Users, Search, Star, Bell, LogOut,
  FileText, GraduationCap, Menu,
} from "lucide-react";
import api from "../api";
import { useAuth, useSocketEvent } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtDate } from "../constants";

const NAV = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/upload", label: "Upload Achievement", icon: Upload },
    { to: "/student/achievements", label: "My Achievements", icon: FileText },
    { to: "/rankings", label: "Rankings", icon: Trophy },
    { to: "/student/analytics", label: "Analytics", icon: ChartColumn },
    { to: "/student/profile", label: "Profile & Portfolio", icon: CircleUser },
  ],
  faculty: [
    { to: "/faculty", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/faculty/verify", label: "Verification Queue", icon: ClipboardCheck },
    { to: "/rankings", label: "Rankings", icon: Trophy },
  ],
  admin: [
    { to: "/admin", label: "Control Centre", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/verify", label: "All Achievements", icon: ClipboardCheck },
    { to: "/rankings", label: "Rankings", icon: Trophy },
  ],
  recruiter: [
    { to: "/recruiter", label: "Find Talent", icon: Search, end: true },
    { to: "/recruiter/shortlist", label: "My Shortlist", icon: Star },
  ],
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const toast = useToast();
  const ref = useRef(null);

  const load = () => api.get("/notifications").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // A new notification arrived live from the server
  useSocketEvent("notification", (n) => {
    setData((d) => ({ items: [n, ...d.items].slice(0, 30), unread: d.unread + 1 }));
    toast(n.message, n.type === "rejected" ? "error" : n.type === "approved" || n.type === "badge" ? "success" : "info", n.title);
  });

  const toggle = async () => {
    setOpen((o) => !o);
    if (!open && data.unread) {
      await api.put("/notifications/read-all").catch(() => {});
      setData((d) => ({ ...d, unread: 0 }));
    }
  };

  return (
    <div className="bell" ref={ref}>
      <button className="btn btn-ghost" onClick={toggle} aria-label="Notifications">
        <Bell size={20} />
        {data.unread > 0 && <span className="bell-count">{data.unread}</span>}
      </button>
      {open && (
        <div className="card dropdown">
          <strong className="small" style={{ padding: "0.4rem", display: "block" }}>Notifications</strong>
          {data.items.length === 0 && <p className="muted small" style={{ padding: "0.4rem" }}>No notifications yet.</p>}
          {data.items.map((n) => (
            <div key={n._id} className={`notif ${n.read ? "" : "unread"}`}>
              <strong>{n.title}</strong>
              <div>{n.message}</div>
              <div className="muted" style={{ fontSize: "0.72rem" }}>{fmtDate(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = NAV[user.role] || [];

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div className="brand">
          <div className="brand-logo"><GraduationCap size={20} /></div>
          <span>Smart Achievement Ranking</span>
        </div>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
            <Icon size={18} /> {label}
          </NavLink>
        ))}
        <div className="sidebar-footer">BMS Institute of Technology and Management · Dept. of MCA</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row">
            <button className="btn btn-ghost menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu"><Menu size={20} /></button>
            <span className="muted small hide-mobile">
              {user.role === "student" && `${user.usn?.toUpperCase()} · ${user.department} · Sem ${user.semester}`}
              {user.role === "faculty" && `${user.designation || "Faculty"} · ${user.department}`}
              {user.role === "admin" && "Administrator"}
              {user.role === "recruiter" && `${user.company}`}
            </span>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="row hide-mobile" style={{ gap: "0.4rem" }}>
              <strong className="small">{user.name}</strong>
              <span className="chip chip-primary">{user.role}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
