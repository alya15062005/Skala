import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import DashboardAdmin from "./pages/DashboardAdmin";
import KelolaArea from "./pages/KelolaArea";
import KelolaOB from "./pages/KelolaOB";
import KelolaShift from "./pages/KelolaShift";
import KelolaTugas from "./pages/KelolaTugas";
import KelolaUser from "./pages/KelolaUser";
import Laporan from "./pages/Laporan";
import Login from "./pages/Login";
import Pengawasan from "./pages/Pengawasan";
import PenugasanOB from "./pages/PenugasanOB";
import Profile from "./pages/Profile";
import Setting from "./pages/Setting";
import SettingAdmin from "./pages/SettingAdmin";

// Component untuk redirect berdasarkan role
function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><DashboardAdmin /></AdminRoute>} />
      <Route path="/admin/area" element={<AdminRoute><KelolaArea /></AdminRoute>} />
      <Route path="/admin/shift" element={<AdminRoute><KelolaShift /></AdminRoute>} />
      <Route path="/admin/ob" element={<AdminRoute><KelolaOB /></AdminRoute>} />
      <Route path="/admin/tugas" element={<AdminRoute><KelolaTugas /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><KelolaUser /></AdminRoute>} />
      <Route path="/admin/laporan" element={<AdminRoute><Laporan /></AdminRoute>} />
      <Route path="/admin/setting" element={<AdminRoute><SettingAdmin /></AdminRoute>} />
      <Route path="/penugasan" element={<ProtectedRoute><PenugasanOB /></ProtectedRoute>} />
      <Route path="/pengawasan" element={<ProtectedRoute><Pengawasan /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/setting" element={<ProtectedRoute><Setting /></ProtectedRoute>} />
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );
}