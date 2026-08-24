import { FiChevronDown, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserDisplayName, getUserPhotoUrl } from "../utils/userUtils";

export default function AdminTopbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari",
  searchDisabled = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const photoUrl = getUserPhotoUrl(user);
  const displayName = getUserDisplayName(user, "Admin");
  const displayRole = user?.role || "Admin";

  return (
    <header className="topbar">
      <div className="search-box">
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
        className="user-box"
        onClick={() => navigate("/profile")}
        style={{ cursor: "pointer" }}
      >
        <img src={photoUrl} alt="avatar" className="avatar" />
        <div>
          <h4>{displayName}</h4>
          <p>{displayRole}</p>
        </div>
        <FiChevronDown />
      </div>
    </header>
  );
}
