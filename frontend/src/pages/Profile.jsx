import { useEffect, useRef, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import Sidebar from "../components/Sidebar";
import UserTopbar from "../components/UserTopbar";
import { useAuth } from "../context/AuthContext";
import { getUserDisplayName, getUserProfilePhotoUrl } from "../utils/userUtils";
import "./Dashboard.css";
import "./Profile.css";

import {
    FiEdit2,
} from "react-icons/fi";

export default function Profile() {
  const { user, updateProfile, uploadPhoto } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cacheKey, setCacheKey] = useState(0);
  const fileInputRef = useRef(null);
  const profilePhotoUrl = getUserProfilePhotoUrl(user, cacheKey);

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 3000);
  };

  const validateEmail = (email) => {
    if (!email) return false;
    const parts = email.split("@");
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;
    if (!localPart || !domainPart) return false;

    const domainLabels = domainPart.split(".");
    if (domainLabels.length < 2) return false;

    const validDomainLabel = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
    if (!domainLabels.every((label) => validDomainLabel.test(label))) return false;

    const topLevelDomain = domainLabels[domainLabels.length - 1].toLowerCase();
    if (!["com", "id"].includes(topLevelDomain)) return false;

    const localPattern = /^[^\s@]+$/;
    return localPattern.test(localPart);
  };

  const [formData, setFormData] = useState({
    username: user?.username || "user",
    fullName: getUserDisplayName(user),
    email: user?.email || user?.username || "supervisor@beta.com"
  });

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      username: user.username || prev.username,
      fullName: getUserDisplayName(user),
      email: user.email || user.username || prev.email
    }));
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file type
    if (!file.type.startsWith("image/")) {
      notify("Hanya file gambar yang diperbolehkan", "error");
      return;
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify("Ukuran file tidak boleh lebih dari 5MB", "error");
      return;
    }

    try {
      // Upload foto ke backend langsung
      await uploadPhoto(file);
      console.log("✅ Photo upload success, user:", user);
      // Force cache busting untuk image
      setCacheKey(Date.now());
      notify("Foto berhasil diupload", "success");
    } catch (error) {
      console.error("❌ Photo upload failed:", error);
      notify(error.response?.data?.message || "Gagal upload foto", "error");
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      if (!validateEmail(formData.email)) {
        notify("Email harus berupa alamat email yang valid", "error");
        return;
      }

      setIsSaving(true);
      try {
        await updateProfile({
          username: formData.username,
          email: formData.email,
          nama_lengkap: formData.fullName
        });
        setIsEditing(false);
        notify("Profil berhasil diperbarui", "success");
      } catch (error) {
        notify(error.response?.data?.message || "Gagal menyimpan profil", "error");
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const isAdmin = user?.role === "admin";
  const profileTitle = isAdmin ? "Profil Admin" : "Profil Akun";
  const profileDescription = isAdmin ? "Informasi Akun Admin" : "Informasi Akun Supervisor";

  return (
    <div className="dashboard-container">
      {isAdmin ? <AdminSidebar /> : <Sidebar />}

      <main className="main-content">
        {isAdmin ? <AdminTopbar searchDisabled /> : <UserTopbar searchDisabled />}

        <section className="content-inner">
          <div className="profile-page">
            <div className="profile-header">
              <h1>{profileTitle}</h1>
              <p>{profileDescription}</p>
            </div>

      <div className="profile-card">

        {/* Avatar */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img 
              key={cacheKey}
              src={profilePhotoUrl} 
              alt="Profile" 
              className="profile-avatar"
              onLoad={() => console.log("✅ Image loaded:", user?.foto)}
              onError={(e) => console.error("❌ Image load error:", e.target.src)}
            />

            <button 
              className="avatar-lock"
              onClick={() => isEditing && fileInputRef.current?.click()}
              type="button"
              disabled={!isEditing}
            >
              +
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="profile-form">

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

        </div>

        <button
          type="button"
          className={`edit-profile-btn ${isEditing ? 'save-mode' : 'edit-mode'}`}
          onClick={handleEdit}
          disabled={isSaving}
        >
          <FiEdit2 />
          {isSaving ? "Menyimpan..." : isEditing ? "Simpan Profil" : "Edit Profil"}
        </button>

        {notification && (
          <div className={`profile-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

      </div>
    </div>
  </section>
      </main>
    </div>
  );
}
