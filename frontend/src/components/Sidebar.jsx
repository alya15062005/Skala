import {
    FiFileText,
    FiLayout,
    FiSettings,
    FiUsers
} from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import logoBeta from "../assets/beta.png";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img 
          src={logoBeta} 
          alt="BETA - Bersih dan Tertata" 
          className="logo-full-img" 
        />
      </div>

      <nav className="menu">
        <p className="menu-label">MENU</p>
        
        <Link to="/dashboard" className={`menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <FiLayout /> Dashboard
        </Link>
        
        <Link to="/penugasan" className={`menu-item ${location.pathname === '/penugasan' ? 'active' : ''}`}>
          <FiUsers /> Penugasan 
        </Link>
        
        <Link to="/pengawasan" className={`menu-item ${location.pathname === '/pengawasan' ? 'active' : ''}`}>
          <FiFileText /> Pengawasan
        </Link>

        <p className="menu-label" style={{ marginTop: "30px" }}>UMUM</p>
        
        <Link to="/setting" className={`menu-item ${location.pathname === '/setting' ? 'active' : ''}`}>
          <FiSettings /> Pengaturan
        </Link>
      </nav>
    </aside>
  );
}
