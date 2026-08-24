import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import { adminAPI, penugasanAPI } from "../service/api";
import "./DashboardAdmin.css";

import {
    FiArrowUpRight,
    FiCheckCircle,
} from "react-icons/fi";

// Data mock untuk fallback jika API gagal
const FALLBACK_STATS = {
  totalArea: 0,
  totalUser: 0,
  totalTugas: 0,
};

const FALLBACK_ACTIVITIES = [
  { id: 1, nama: "Admin", aksi: "Sistem dimulai", area: "-", waktu: "Baru saja", status: "selesai" },
];

export default function DashboardAdmin() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalArea: 0,
    totalUser: 0,
    totalTugas: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch stats dari backend
        const statsResponse = await adminAPI.getDashboardStats();
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }

        // Fetch aktivitas terbaru dari backend
        const aktivitasResponse = await penugasanAPI.getAktivitas(10);
        console.log("Aktivitas Response:", aktivitasResponse.data);
        if (aktivitasResponse.data.success) {
          // Transform data untuk UI
          const transformedActivities = aktivitasResponse.data.data.map(item => ({
            id: item.id_aktivitas,
            nama: item.nama_user || 'User',
            aksi: item.aksi,
            area: item.area_terkait || item.nama_entitas || '-',
            waktu: formatTimeAgo(item.created_at),
            status: item.status,
            tipe_aktivitas: item.tipe_aktivitas,
            detail: item.detail
          }));
          console.log("Transformed Activities:", transformedActivities);
          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback ke data default jika error
        setStats(FALLBACK_STATS);
        setActivities(FALLBACK_ACTIVITIES);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function untuk format waktu
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Baru saja";
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      return `${diffInDays} hari lalu`;
    }
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();

    if (s === "selesai") return "done";
    if (s === "sedang berlangsung") return "progress";
    return "waiting";
  };

  return (
    <div className="dashboard-admin-page">
      <AdminSidebar className="admin-sidebar" />

      <main className="dashboard-admin-main">
        {/* TOPBAR */}
        <AdminTopbar />

        {/* CONTENT */}
        <section className="dashboard-content">
          <div className="dashboard-title">
            <h1>Dashboard Admin</h1>
            <p>Selamat datang di sistem monitoring kebersihan BETA</p>
          </div>

          {/* CARD */}
          <div className="dashboard-cards">
            <div
              className="dashboard-card green"
              onClick={() => navigate("/admin/area")}
            >
              <div className="card-top">
                <span>Total Area</span>
                <div className="card-arrow white-circle">
                  <FiArrowUpRight />
                </div>
              </div>

              <h2>{loading ? "..." : stats.totalArea}</h2>
              <p className="koneng">Area</p>
              <p className="tiny">+1 bulan ini</p>
            </div>

            <div
              className="dashboard-card white"
              onClick={() => navigate("/admin/users")}
            >
              <div className="card-top">
                <span>Total User</span>
                <div className="card-arrow border-circle">
                  <FiArrowUpRight />
                </div>
              </div>

              <h2>{loading ? "..." : stats.totalUser}</h2>
              <p className="small">User</p>
            </div>

            <div
              className="dashboard-card white"
              onClick={() => navigate("/admin/tugas")}
            >
              <div className="card-top">
                <span>Total Tugas</span>
                <div className="card-arrow border-circle">
                  <FiArrowUpRight />
                </div>
              </div>

              <h2>{loading ? "..." : stats.totalTugas}</h2>
              <p className="small">Tugas</p>
              <p className="tiny">+10 hari ini</p>
            </div>
          </div>

          {/* TABLE */}
          <div className="dashboard-table-box">
            <h3>Aktivitas Terbaru</h3>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Aksi</th>
                  <th>Area</th>
                  <th>Waktu</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {activities.length > 0 ? (
                  activities.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="user-row">
                          <span className="mini-avatar">
                            {item.nama?.charAt(0)}
                          </span>
                          {item.nama}
                        </div>
                      </td>

                      <td>{item.aksi}</td>
                      <td>{item.area}</td>
                      <td>{item.waktu}</td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status === "Selesai" && (
                            <FiCheckCircle size={14} />
                          )}
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Tidak ada aktivitas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
