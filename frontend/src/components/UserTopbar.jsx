import { FiChevronDown, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logoBeta from "../assets/beta.png";
import { useAuth } from "../context/AuthContext";
import { getUserDisplayName, getUserPhotoUrl } from "../utils/userUtils";

export default function UserTopbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari",
  searchDisabled = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const photoUrl = getUserPhotoUrl(user);
  const displayName = getUserDisplayName(user);
  const displayRole = user?.role || "Pengawas";

  return (
    <header className="topbar">
      <div className="topbar-brand-row">
        <img src={logoBeta} alt="BETA logo" className="topbar-logo" />

        <div className="search-bar topbar-search">
          <FiSearch />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
            disabled={searchDisabled || !onSearchChange}
          />
        </div>

        <div
          className="user-profile"
          onClick={() => navigate("/profile")}
          style={{ cursor: "pointer" }}
        >
          <img src={photoUrl} alt="avatar" className="avatar" />
          <div className="user-info">
            <p className="user-name">{displayName}</p>
            <p className="user-role">{displayRole}</p>
          </div>
          <FiChevronDown className="dropdown-icon" />
        </div>
      </div>
    </header>
  );
}
