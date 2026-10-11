import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { homeFor } from "./constants";
import { Loader } from "./components/ui";
import Layout from "./components/Layout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Portfolio from "./pages/Portfolio";
import Rankings from "./pages/Rankings";
import StudentDashboard from "./pages/student/StudentDashboard";
import UploadAchievement from "./pages/student/UploadAchievement";
import MyAchievements from "./pages/student/MyAchievements";
import StudentAnalytics from "./pages/student/StudentAnalytics";
import Profile from "./pages/student/Profile";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import Verification from "./pages/faculty/Verification";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RecruiterSearch from "./pages/recruiter/RecruiterSearch";
import CandidateProfile from "./pages/recruiter/CandidateProfile";
import Shortlist from "./pages/recruiter/Shortlist";

// Only lets logged-in users with the right role see a page
function Protected({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/p/:usn" element={<Portfolio />} />

      <Route element={<Protected roles={["student"]} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/upload" element={<UploadAchievement />} />
        <Route path="/student/achievements" element={<MyAchievements />} />
        <Route path="/student/analytics" element={<StudentAnalytics />} />
        <Route path="/student/profile" element={<Profile />} />
      </Route>
      <Route element={<Protected roles={["faculty"]} />}>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/verify" element={<Verification />} />
      </Route>
      <Route element={<Protected roles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/verify" element={<Verification />} />
      </Route>
      <Route element={<Protected roles={["recruiter"]} />}>
        <Route path="/recruiter" element={<RecruiterSearch />} />
        <Route path="/recruiter/students/:id" element={<CandidateProfile />} />
        <Route path="/recruiter/shortlist" element={<Shortlist />} />
      </Route>
      <Route element={<Protected roles={["student", "faculty", "admin"]} />}>
        <Route path="/rankings" element={<Rankings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
