import { useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiHelpCircle,
  FiLock,
  FiLogOut
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Setting.css";

import Sidebar from "../components/Sidebar";
import UserTopbar from "../components/UserTopbar";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../service/api";

const faqData = [
  {
    question: "Bagaimana cara membuat penugasan baru untuk OB?",
    answer: "Masuk ke menu Penugasan OB kemudian klik tombol Tambah Tugas dan isi seluruh data yang diperlukan."
  },
  {
    question: "Bagaimana cara melakukan pengawasan tugas?",
    answer: "Masuk ke menu Pengawasan lalu pilih area yang ingin diperiksa dan berikan penilaian sesuai kondisi lapangan."
  },
  {
    question: "Bagaimana cara membuat laporan mingguan?",
    answer: "Masuk ke menu Laporan dan pilih rentang tanggal yang diinginkan kemudian klik Generate Laporan."
  },
  {
    question: "Apa yang harus dilakukan jika OB tidak hadir?",
    answer: "Segera lakukan penggantian petugas melalui menu Penugasan dan laporkan ke supervisor."
  },
  {
    question: "Bagaimana cara input data lapangan ke sistem?",
    answer: "Gunakan menu Pengawasan lalu isi hasil monitoring beserta dokumentasi jika diperlukan."
  },
  {
    question: "Bagaimana cara melihat riwayat tugas OB?",
    answer: "Masuk ke menu Penugasan kemudian pilih detail petugas untuk melihat seluruh riwayat tugas."
  }
];

export default function Setting() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [visiblePasswords, setVisiblePasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenChangePassword = () => {
    setShowChangePassword(true);
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setVisiblePasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    setMessage("");
    setMessageType("");
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setVisiblePasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    setMessage("");
    setMessageType("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage("Semua field harus diisi");
      setMessageType("error");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Konfirmasi password baru tidak cocok");
      setMessageType("error");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authAPI.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      setMessage(response.data.message || "Password berhasil diperbarui");
      setMessageType("success");
      setTimeout(() => {
        handleCloseChangePassword();
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal memperbarui password");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="setting-layout dashboard-container">
      <Sidebar />
      <main className="main-content">
        <UserTopbar />

        <section className="content-inner">

        <div className="setting-header">
          <h1>Pengaturan & Bantuan</h1>
          <p>Kelola preferensi, konfigurasi, dan dukungan sistem</p>
        </div>

        {/* SECURITY CARD */}
        <div className="setting-card">

          <div className="setting-card-title">

            <div className="setting-icon">
              <FiLock />
            </div>

            <div>
              <h2>Keamanan</h2>
              <p>Pengaturan keamanan akun</p>
            </div>

          </div>

          <div className="setting-menu">

            <div className="setting-item" onClick={handleOpenChangePassword} style={{ cursor: "pointer" }}>
              <div>
                <h4>Ubah Password</h4>
                <span>Perbarui kata sandi akun Anda</span>
              </div>

              <FiChevronRight />
            </div>

            <div className="setting-item">
              <div>
                <h4>Session History</h4>
                <span>Lihat riwayat login akun</span>
              </div>

              <FiChevronRight />
            </div>

          </div>
        </div>

        {/* MODAL GANTI PASSWORD */}
        {showChangePassword && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header-section">
                <div className="icon-main-bg">
                  <FiLock />
                </div>
                <h2 className="modal-title">Ganti Password</h2>
              </div>

              <form onSubmit={handleSubmitChangePassword}>
                <div className="form-group-item">
                  <label className="label-with-icon">
                    <FiLock style={{ fontSize: "16px" }} />
                    Sandi Lama
                  </label>
                  <div className="setting-password-input-wrap">
                    <input
                      type={visiblePasswords.oldPassword ? "text" : "password"}
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      placeholder="Masukkan sandi lama"
                      className="custom-input"
                    />
                    <button
                      type="button"
                      className="setting-password-toggle-btn"
                      onClick={() => togglePasswordVisibility("oldPassword")}
                      aria-label={visiblePasswords.oldPassword ? "Sembunyikan sandi lama" : "Tampilkan sandi lama"}
                    >
                      {visiblePasswords.oldPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="label-with-icon">
                    <FiLock style={{ fontSize: "16px" }} />
                    Sandi Baru
                  </label>
                  <div className="setting-password-input-wrap">
                    <input
                      type={visiblePasswords.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Masukkan sandi baru"
                      className="custom-input"
                    />
                    <button
                      type="button"
                      className="setting-password-toggle-btn"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      aria-label={visiblePasswords.newPassword ? "Sembunyikan sandi baru" : "Tampilkan sandi baru"}
                    >
                      {visiblePasswords.newPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="label-with-icon">
                    <FiLock style={{ fontSize: "16px" }} />
                    Konfirmasi Sandi Baru
                  </label>
                  <div className="setting-password-input-wrap">
                    <input
                      type={visiblePasswords.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Konfirmasi sandi baru"
                      className="custom-input"
                    />
                    <button
                      type="button"
                      className="setting-password-toggle-btn"
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                      aria-label={visiblePasswords.confirmPassword ? "Sembunyikan konfirmasi sandi" : "Tampilkan konfirmasi sandi"}
                    >
                      {visiblePasswords.confirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`message-alert ${messageType}`}>
                    {message}
                  </div>
                )}

                <div className="modal-footer-btns">
                  <button
                    type="button"
                    className="btn-modal-batal"
                    onClick={handleCloseChangePassword}
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-simpan"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="setting-card setting-faq-card">
          <div className="setting-card-title">
            <div className="setting-icon">
              <FiHelpCircle />
            </div>

            <div>
              <h2>Frequently Asked Questions</h2>
              <p>Pertanyaan yang sering diajukan</p>
            </div>
          </div>

          <div className="setting-faq-list">
            {faqData.map((faq, index) => (
              <details className="setting-faq-item" key={index}>
                <summary>
                  <span>{faq.question}</span>
                  <FiChevronDown />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <button type="button" className="setting-logout-card" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>

        </section>
      </main>
    </div>
  );
}
