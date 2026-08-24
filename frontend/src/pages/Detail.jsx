import { useEffect, useState } from 'react';
import { FiCamera, FiClipboard, FiClock, FiEdit2, FiMapPin, FiUser } from "react-icons/fi";
import IconPenilaian from "../assets/Icon.png";
import { useAuth } from "../context/AuthContext";
import { penugasanAPI } from "../service/api";
import './Penilaian.css';

const Detail = ({ data, laporanData, onClose, onUpdateSuccess }) => {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State untuk edit
  const [statusKehadiran, setStatusKehadiran] = useState(laporanData?.status_kehadiran || "hadir");
  const [selectedNilai, setSelectedNilai] = useState(laporanData?.nilai || "");
  const [namaPetugas, setNamaPetugas] = useState(laporanData?.person_assigned || data?.petugas || "");
  const [fotoBukti, setFotoBukti] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Auto-update nama petugas saat status kehadiran berubah (saat edit mode)
  useEffect(() => {
    if (isEditMode && statusKehadiran === "hadir") {
      setNamaPetugas(data?.petugas || "");
    }
  }, [statusKehadiran, isEditMode, data?.petugas]);



  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });

  // Helper untuk mendapatkan label dan deskripsi nilai
  const getNilaiLabel = (nilai) => {
    const labels = {
      green: { label: "Baik", desc: "Pekerjaan sesuai standar" },
      yellow: { label: "Cukup", desc: "Pekerjaan ada kekurangan minor" },
      red: { label: "Kurang", desc: "Pekerjaan ada kekurangan signifikan" }
    };
    return labels[nilai] || { label: "-", desc: "-" };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoBukti(file);
    }
  };

  const handleNilaiChange = (nilai) => {
    setSelectedNilai(nilai);
  };

  // Fungsi untuk handle update laporan
  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validasi: laporanData harus ada dan punya id_laporan
      if (!laporanData || !laporanData.id_laporan) {
        console.error("❌ laporanData tidak valid:", laporanData);
        console.error("❌ Type dari laporanData:", typeof laporanData);
        console.error("❌ Keys dalam laporanData:", laporanData ? Object.keys(laporanData) : "N/A");
        setError("Data laporan tidak ditemukan. Silakan reload halaman.");
        return;
      }

      // Validasi: pastikan nilai dipilih
      if (!selectedNilai) {
        setError("Silakan pilih nilai");
        return;
      }

      // Validasi: jika kuning/merah, foto wajib ada (existing atau baru)
      if ((selectedNilai === "yellow" || selectedNilai === "red")) {
        if (!fotoBukti && !laporanData.foto_path) {
          setError("Foto bukti wajib diupload untuk nilai kuning atau merah");
          return;
        }
      }

      // Siapkan data untuk update
      const updateData = {
        shift: data?.shift || data?.nama_shift || "",
        status_kehadiran: statusKehadiran,
        person_assigned: namaPetugas,
        nilai: selectedNilai,
        id_user_pengawas: user?.id,
      };

      if (selectedNilai === "green") {
        updateData.foto_path = null;
      } else if (!fotoBukti && laporanData?.foto_path) {
        updateData.foto_path = laporanData.foto_path;
      }

      console.log("🔄 ========== PREPARE UPDATE ==========");
      console.log("📌 ID Laporan:", laporanData.id_laporan);
      console.log("📌 Type ID Laporan:", typeof laporanData.id_laporan);
      console.log("📌 Data update:", updateData);
      const urlPath = `/penugasan/laporan/${laporanData.id_laporan}`;
      console.log("📌 URL yang akan digunakan:", urlPath);
      console.log("🔄 ====================================");

      let response;
      if (fotoBukti) {
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
        formData.append("foto", fotoBukti);
        response = await penugasanAPI.updateLaporan(laporanData.id_laporan, formData, true);
      } else {
        response = await penugasanAPI.updateLaporan(laporanData.id_laporan, updateData);
      }

      if (response.data.success) {
        setSuccess(true);
        console.log("✅ Laporan berhasil diupdate:", response.data.data);
        
        // Panggil callback untuk refresh data
        if (onUpdateSuccess) {
          setTimeout(() => {
            onUpdateSuccess();
          }, 500);
        }

        // Tutup edit mode
        setTimeout(() => {
          setIsEditMode(false);
        }, 1000);
      }
    } catch (err) {
      console.error("❌ Gagal update laporan:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error config:", err.config);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          err.response?.data?.message || 
                          err.message || 
                          "Gagal update laporan. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-new" onClick={onClose}>
      <div className="modal-container-penilaian" onClick={(e) => e.stopPropagation()}>
        {/* Guard: Cek jika laporanData tidak ada */}
        {!laporanData || !laporanData.id_laporan ? (
          <div className="modal-header-penilaian">
            <h2 style={{ color: "red", textAlign: "center" }}>
              ⚠️ Data tidak ditemukan. Silakan reload halaman.
            </h2>
            <button 
              type="button" 
              className="btn-p-simpan" 
              onClick={onClose}
              style={{ marginTop: "20px" }}
            >
              ✓ Tutup
            </button>
          </div>
        ) : (
        <>
        <div className="modal-header-penilaian">
          <div className="header-icon-box">
            <img src={IconPenilaian} alt="icon" className="header-custom-icon" />
          </div>
          <h2>{isEditMode ? "Edit Penilaian" : "Detail Penilaian"}</h2>
        </div>

        <form className="modal-form-penilaian">
          <div className="form-group-p">
            <label><FiClock className="icon-p" /> Hari, Tanggal <span className="req">*</span></label>
            <input type="text" value={today} readOnly className="input-p-disabled" />
          </div>

          <div className="form-group-p">
            <label><FiMapPin className="icon-p" /> Area <span className="req">*</span></label>
            <input type="text" value={data.area} readOnly className="input-p-disabled" />
          </div>

          <div className="form-group-p">
            <label><FiClipboard className="icon-p" /> Tugas <span className="req">*</span></label>
            <input type="text" value={data.tugas} readOnly className="input-p-disabled" />
          </div>

          <div className="form-group-p">
            <label><FiClock className="icon-p" /> Shift <span className="req">*</span></label>
            <input type="text" value={data.shift} readOnly className="input-p-disabled" />
          </div>

          {/* Kondisional Status Kehadiran */}
          <div className="form-group-p">
            <label><FiClock className="icon-p" /> Status Kehadiran <span className="req">*</span></label>
            <select 
              className="form-select-p" 
              value={statusKehadiran}
              onChange={(e) => setStatusKehadiran(e.target.value)}
              disabled={loading || !isEditMode}
            >
              <option value="hadir">Hadir</option>
              <option value="tidak-hadir">Tidak Hadir</option>
            </select>
          </div>

          <div className="form-group-p">
            <label><FiUser className="icon-p" /> {statusKehadiran === "hadir" ? "Petugas/OB" : "Pengganti"} <span className="req">*</span></label>
            {statusKehadiran === "hadir" ? (
              <input 
                type="text" 
                value={namaPetugas} 
                readOnly 
                className="input-p-disabled" 
              />
            ) : (
              <input 
                type="text" 
                className="input-p-text"
                value={namaPetugas}
                onChange={(e) => setNamaPetugas(e.target.value)}
                disabled={loading || !isEditMode}
                placeholder="Masukkan nama pengganti..."
              />
            )}
          </div>

          <div className="form-group-p">
            <label><FiCamera className="icon-p" /> Nilai <span className="req">*</span></label>
            {isEditMode ? (
              // Mode edit: tampilkan radio buttons + indikator
              <>
                <div className="radio-group-p">
                  <label className="radio-item-p">
                    <input 
                      type="radio" 
                      name="nilai" 
                      value="green" 
                      checked={selectedNilai === "green"}
                      onChange={() => handleNilaiChange("green")}
                      disabled={loading}
                    />
                    <span className="color-box-p green-p"></span>
                    <span style={{ fontSize: "12px", marginLeft: "4px" }}>Baik</span>
                  </label>
                  <label className="radio-item-p">
                    <input 
                      type="radio" 
                      name="nilai" 
                      value="yellow" 
                      checked={selectedNilai === "yellow"}
                      onChange={() => handleNilaiChange("yellow")}
                      disabled={loading}
                    />
                    <span className="color-box-p yellow-p"></span>
                    <span style={{ fontSize: "12px", marginLeft: "4px" }}>Cukup</span>
                  </label>
                  <label className="radio-item-p">
                    <input 
                      type="radio" 
                      name="nilai" 
                      value="red" 
                      checked={selectedNilai === "red"}
                      onChange={() => handleNilaiChange("red")}
                      disabled={loading}
                    />
                    <span className="color-box-p red-p"></span>
                    <span style={{ fontSize: "12px", marginLeft: "4px" }}>Kurang</span>
                  </label>
                </div>
                {/* Tampilkan indikator nilai yang dipilih */}
                {selectedNilai && (
                  <div className="nilai-display" style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span 
                        className={`color-box-p ${selectedNilai}-p`} 
                        style={{ width: "40px", height: "40px", borderRadius: "4px" }}
                      ></span>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
                          {getNilaiLabel(selectedNilai).label}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {getNilaiLabel(selectedNilai).desc}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Mode view: tampilkan indikator warna dengan keterangan
              <div className="nilai-display" style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span 
                    className={`color-box-p ${selectedNilai}-p`} 
                    style={{ width: "40px", height: "40px", borderRadius: "4px" }}
                  ></span>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
                      {getNilaiLabel(selectedNilai).label}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {getNilaiLabel(selectedNilai).desc}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kondisional Upload Foto: Muncul jika edit mode dan nilai kuning/merah */}
          {isEditMode && selectedNilai !== "" && selectedNilai !== "green" && (
            <div className="form-group-p fade-in">
              <label><FiCamera className="icon-p" /> Upload Foto <span className="req">*</span></label>
              <div className="upload-placeholder">
                <input 
                  type="file" 
                  id="upload-poto-detail" 
                  hidden 
                  onChange={handleFileChange}
                  accept="image/*"
                  disabled={loading}
                />
                <label htmlFor="upload-poto-detail" style={{ cursor: 'pointer' }}>
                  {fotoBukti ? `✓ ${fotoBukti.name}` : (laporanData?.foto_path ? `✓ ${laporanData.foto_path}` : "Klik untuk tambah foto...")}
                </label>
              </div>
            </div>
          )}

          {/* Tampilkan pesan error atau success */}
          {error && (
            <div className="alert-error" style={{
              backgroundColor: "#fee",
              color: "#c33",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "14px",
              border: "1px solid #fcc"
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="alert-success" style={{
              backgroundColor: "#efe",
              color: "#3c3",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "14px",
              border: "1px solid #cfc"
            }}>
              ✓ Laporan berhasil diupdate!
            </div>
          )}

          <div className="modal-footer-p">
            {isEditMode ? (
              <>
                <button 
                  type="button" 
                  className="btn-p-batal" 
                  onClick={() => {
                    setIsEditMode(false);
                    setError(null);
                    setSuccess(false);
                  }} 
                  disabled={loading}
                >
                  ✕ Batal
                </button>
                <button 
                  type="button" 
                  className="btn-p-simpan" 
                  onClick={handleUpdate}
                  disabled={loading}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "⏳ Menyimpan..." : "✓ Simpan"}
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  className="btn-p-batal" 
                  onClick={() => setIsEditMode(true)}
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FiEdit2 /> Edit
                </button>
                <button 
                  type="button" 
                  className="btn-p-simpan" 
                  onClick={onClose}
                >
                  ✓ Tutup
                </button>
              </>
            )}
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
};

export default Detail;
