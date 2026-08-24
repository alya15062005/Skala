import {
    FiClipboard,
    FiClock,
    FiFileText,
    FiGrid,
    FiMapPin,
    FiSettings,
    FiUsers,
} from "react-icons/fi";

import { Link, useLocation, useNavigate } from "react-router-dom";
import logoBeta from "../assets/beta.png";
import { useAuth } from "../context/AuthContext";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menus = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <FiGrid />,
    },
    {
      name: "Kelola Area",
      path: "/admin/area",
      icon: <FiMapPin />,
    },
    {
      name: "Kelola Shift",
      path: "/admin/shift",
      icon: <FiClock />,
    },
    {
      name: "Kelola OB",
      path: "/admin/ob",
      icon: <FiUsers />,
    },
    {
      name: "Kelola User",
      path: "/admin/users",
      icon: <FiUsers />,
    },
    {
      name: "Kelola Tugas",
      path: "/admin/tugas",
      icon: <FiClipboard />,
    },
    {
      name: "Laporan",
      path: "/admin/laporan",
      icon: <FiFileText />,
    },
    {
      name: "Pengaturan",
      path: "/admin/setting",
      icon: <FiSettings />,
    },
  ];

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="logo-section">
        <img
          src={logoBeta}
          alt="BETA"
          className="logo-full-img"
        />
      </div>

      {/* MENU */}
      <nav className="menu">
        <p className="menu-label">ADMIN</p>

        {menus.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`menu-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}

      </nav>
    </aside>
  );
}