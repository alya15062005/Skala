import { useEffect, useState } from 'react';
import { FiCamera, FiClipboard, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import IconPenilaian from "../assets/Icon.png"; // Pastikan path file benar
import { useAuth } from "../context/AuthContext";
import { penugasanAPI } from "../service/api";
import './Penilaian.css';

const Penilaian = ({ data, onClose }) => {
  const { user } = useAuth();
  
  // State untuk kontrol kondisional
  const [statusKehadiran, setStatusKehadiran] = useState("hadir");
  const [selectedNilai, setSelectedNilai] = useState("");
  const [namaPetugas, setNamaPetugas] = useState(data?.petugas || "");
  const [fotoBukti, setFotoBukti] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingLaporan, setExistingLaporan] = useState(null); // Track existing laporan
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(50);
  const [sheetTouchStartY, setSheetTouchStartY] = useState(null);
  const [sheetDragStartY, setSheetDragStartY] = useState(null);
  const [sheetDragStartHeight, setSheetDragStartHeight] = useState(50);

  // Load laporan yang sudah ada untuk penugasan ini
  useEffect(() => {
    const loadExistingLaporan = async () => {
      try {
        const idPenugasan = data?.id || data?.id_penugasan;
        if (!idPenugasan) {
          setIsLoadingLaporan(false);
          return;
        }

        const todayString = new Date().toLocaleDateString('en-CA');
        const response = await penugasanAPI.getLaporanByPenugasan(idPenugasan, todayString);
        if (response.data.success && response.data.data) {
          const laporan = response.data.data;
          setExistingLaporan(laporan);
          
          // Pre-fill form dengan data laporan hari ini yang sudah ada
          setStatusKehadiran(laporan.status_kehadiran || "hadir");
          setSelectedNilai(laporan.nilai || "");
          setNamaPetugas(laporan.person_assigned || data?.petugas || "");
        }
      } catch (err) {
        // Laporan tidak ada, ini normal untuk penugasan baru
        console.log("ℹ️ Laporan belum ada untuk penugasan ini (normal untuk data baru)");
      } finally {
        setIsLoadingLaporan(false);
      }
    };

    if (data) {
      loadExistingLaporan();
    }
  }, [data]);

  // Auto-update nama petugas saat status kehadiran berubah
  useEffect(() => {
    if (statusKehadiran === "hadir") {
      setNamaPetugas(data?.petugas || "");
    } else if (!namaPetugas && !existingLaporan) {
      // Jika tidak ada laporan existing, reset nama petugas
      setNamaPetugas("");
    }
    // Jika ada laporan existing, jangan reset
  }, [statusKehadiran, data?.petugas, existingLaporan]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });

  // Fungsi untuk handle submit laporan
  const handleSimpan = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Cek user terlebih dahulu
      if (!user || !user.id) {
        setError("⚠️ User tidak terautentikasi. Silakan login kembali.");
        return;
      }

      // Validasi: jika pilih kuning/merah, foto wajib ada
      if ((selectedNilai === "yellow" || selectedNilai === "red") && !fotoBukti) {
        setError("Foto bukti wajib diupload untuk nilai kuning atau merah");
        return;
      }

      // Cek data props
      if (!data?.id && !data?.id_penugasan) {
        setError("⚠️ ID Penugasan tidak ditemukan. Silakan reload halaman.");
        return;
      }

      // Validasi nilai wajib diisi
      if (!selectedNilai) {
        setError("Harap isikan nilai");
        return;
      }

      // Convert file ke base64 jika ada
      let fotoPath = null;
      if (fotoBukti) {
        // File akan dikirim via FormData, jadi tidak perlu konversi
        console.log("📷 File akan dikirim: ", fotoBukti.name);
      }

      // Debug: cek user data
      console.log("👤 User data:", user);
      console.log("📋 Data yang diterima dari prop:", data);
      console.log("📋 Laporan existing:", existingLaporan);

      // Siapkan data untuk dikirim (struktur sama dengan PenugasanOB)
      const laporanData = {
        id_penugasan: data?.id || data?.id_penugasan,
        tanggal: new Date().toISOString().split('T')[0],
        shift: data?.shift || data?.nama_shift || "", 
        status_kehadiran: statusKehadiran,
        person_assigned: statusKehadiran === "hadir" ? namaPetugas : namaPetugas,
        id_user_pengawas: user.id, // Pastikan user.id ada, tidak undefined
      };

      // Jika nilai dipilih, tambahkan ke data
      if (selectedNilai) {
        laporanData.nilai = selectedNilai;
      }

      if (selectedNilai === "green" && existingLaporan?.foto_path) {
        laporanData.foto_path = null;
      } else if (!fotoBukti && existingLaporan?.foto_path) {
        laporanData.foto_path = existingLaporan.foto_path;
      }

      console.log("📤 Data laporan yang dikirim:", laporanData);
      console.log("📷 Foto file:", fotoBukti ? fotoBukti.name : "tidak ada");

      // Tentukan apakah CREATE atau UPDATE
      let response;
      if (existingLaporan && existingLaporan.id_laporan) {
        // LAPORAN SUDAH ADA - UPDATE
        console.log("🔄 UPDATE laporan dengan ID:", existingLaporan.id_laporan);
        
        // Gunakan FormData jika ada file, otherwise gunakan JSON
        if (fotoBukti) {
          const formData = new FormData();
          Object.keys(laporanData).forEach(key => {
            if (laporanData[key] !== undefined && laporanData[key] !== null) {
              formData.append(key, laporanData[key]);
            }
          });
          formData.append("foto", fotoBukti);
          response = await penugasanAPI.updateLaporan(existingLaporan.id_laporan, formData, true);
        } else {
          response = await penugasanAPI.updateLaporan(existingLaporan.id_laporan, laporanData);
        }
      } else {
        // LAPORAN BELUM ADA - CREATE
        console.log("✨ CREATE laporan baru");
        
        // Gunakan FormData jika ada file, otherwise gunakan JSON
        if (fotoBukti) {
          const formData = new FormData();
          Object.keys(laporanData).forEach(key => {
            formData.append(key, laporanData[key]);
          });
          formData.append("foto", fotoBukti);
          response = await penugasanAPI.createLaporan(formData, true);
        } else {
          response = await penugasanAPI.createLaporan(laporanData);
        }
      }

      if (response.data.success) {
        setSuccess(true);
        console.log("✅ Laporan berhasil disimpan:", response.data.data);

        try {
          const aktivitasPayload = {
            id_user: user.id,
            nama_user: user.nama_lengkap,
            role_user: user.role,
            tipe_aktivitas: "penilaian",
            aksi: existingLaporan && existingLaporan.id_laporan ? "Update penilaian" : "Buat penilaian",
            nama_entitas: "Pengawasan",
            id_entitas: response.data.data.id_laporan || laporanData.id_penugasan,
            detail: `Penilaian ${selectedNilai ? selectedNilai : "tanpa nilai"} untuk penugasan ${laporanData.id_penugasan}`,
            area_terkait: data.area || data.nama_ruangan || "-",
            status: response.data.data.status || "selesai"
          };

          console.log("📤 Mengirim aktivitas penilaian:", aktivitasPayload);
          await penugasanAPI.createAktivitas(aktivitasPayload);
          console.log("✅ Aktivitas penilaian berhasil dicatat");
        } catch (activityError) {
          console.warn("⚠️ Gagal mencatat aktivitas penilaian:", activityError);
        }
        
        // Tutup modal setelah 1.5 detik; kirim laporan yang baru dibuat ke parent untuk optimistic update
        setTimeout(() => {
          try {
            onClose(response.data.data);
          } catch (e) {
            onClose();
          }
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Gagal menyimpan laporan:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          err.response?.data?.message || 
                          err.message || 
                          "Gagal menyimpan laporan. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoBukti(file);
    }
  };

  const isMobileSheet = () => window.matchMedia("(max-width: 768px)").matches;
  const clampSheetHeight = (height) => Math.min(100, Math.max(25, height));

  const getClosestSheetLimit = (height) => {
    const limits = [25, 50, 100];
    return limits.reduce((closest, limit) => (
      Math.abs(limit - height) < Math.abs(closest - height) ? limit : closest
    ), limits[0]);
  };

  const getNextSheetLimit = () => {
    const limits = [25, 50, 100];
    const currentIndex = limits.findIndex((limit) => Math.abs(limit - sheetHeight) < 2);
    return currentIndex >= 0 ? limits[(currentIndex + 1) % limits.length] : getClosestSheetLimit(sheetHeight);
  };

  const resizeSheetBeforeContentScroll = (scrollDistance, scrollTop = 0) => {
    if (!isMobileSheet() || Math.abs(scrollDistance) < 1) return false;

    const isMovingDown = scrollDistance > 0;
    const isMovingUp = scrollDistance < 0;
    const isAtFullHeight = sheetHeight >= 99.5;
    const isAtSmallHeight = sheetHeight <= 25.5;

    if (isMovingDown && !isAtFullHeight) {
      setSheetHeight((currentHeight) => clampSheetHeight(currentHeight + (scrollDistance / window.innerHeight) * 100));
      return true;
    }

    if (isMovingUp && scrollTop <= 0 && !isAtSmallHeight) {
      setSheetHeight((currentHeight) => clampSheetHeight(currentHeight + (scrollDistance / window.innerHeight) * 100));
      return true;
    }

    return !isAtFullHeight;
  };

  const handleSheetHandlePointerDown = (e) => {
    if (!isMobileSheet()) return;
    setSheetDragStartY(e.clientY);
    setSheetDragStartHeight(sheetHeight);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSheetHandlePointerMove = (e) => {
    if (sheetDragStartY === null || !isMobileSheet()) return;

    const distance = sheetDragStartY - e.clientY;
    const nextHeight = sheetDragStartHeight + (distance / window.innerHeight) * 100;
    setSheetHeight(clampSheetHeight(nextHeight));
  };

  const handleSheetHandlePointerUp = (e) => {
    if (sheetDragStartY === null || !isMobileSheet()) return;

    const distance = sheetDragStartY - e.clientY;
    const nextHeight = sheetDragStartHeight + (distance / window.innerHeight) * 100;

    setSheetDragStartY(null);

    if (Math.abs(distance) <= 8) {
      setSheetHeight(getNextSheetLimit());
      return;
    }

    setSheetHeight(getClosestSheetLimit(clampSheetHeight(nextHeight)));
  };

  const handleSheetWheel = (e) => {
    if (resizeSheetBeforeContentScroll(e.deltaY, e.currentTarget.scrollTop)) {
      e.preventDefault();
    }
  };

  const handleSheetTouchStart = (e) => {
    setSheetTouchStartY(e.touches[0]?.clientY ?? null);
  };

  const handleSheetTouchMove = (e) => {
    if (sheetTouchStartY === null) return;

    const currentY = e.touches[0]?.clientY ?? sheetTouchStartY;
    const scrollDistance = sheetTouchStartY - currentY;

    if (resizeSheetBeforeContentScroll(scrollDistance, e.currentTarget.scrollTop)) {
      e.preventDefault();
      setSheetTouchStartY(currentY);
    }
  };

  const isSheetFullHeight = sheetHeight >= 99.5;

  return (
    <div className="modal-overlay-new penilaian-overlay" onClick={onClose}>
      <div
        className="modal-container-penilaian penilaian-sheet"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleSheetWheel}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        style={{
          "--sheet-height": `${sheetHeight}vh`,
          "--sheet-overflow": isSheetFullHeight ? "auto" : "hidden"
        }}
      >
        <button
          type="button"
          className="penilaian-sheet-handle"
          aria-label="Geser form penilaian"
          onPointerDown={handleSheetHandlePointerDown}
          onPointerMove={handleSheetHandlePointerMove}
          onPointerUp={handleSheetHandlePointerUp}
          onPointerCancel={handleSheetHandlePointerUp}
        />
        <div className="modal-header-penilaian">
          <div className="header-icon-box">
            {/* Menggunakan Icon.png sesuai permintaan */}
            <img src={IconPenilaian} alt="icon" className="header-custom-icon" />
          </div>
          <h2>Penilaian</h2>
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
              disabled={loading}
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
                placeholder="Masukkan nama pengganti..." 
                value={namaPetugas}
                onChange={(e) => setNamaPetugas(e.target.value)}
                disabled={loading}
              />
            )}
          </div>

          <div className="form-group-p">
            <label><FiCamera className="icon-p" /> Nilai <span className="req">*</span></label>
            <div className="radio-group-p">
              <label className="radio-item-p">
                <input 
                  type="radio" 
                  name="nilai" 
                  value="green" 
                  onChange={(e) => setSelectedNilai(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontSize: "12px", marginLeft: "4px" }}>Baik</span>
              </label>
              <label className="radio-item-p">
                <input 
                  type="radio" 
                  name="nilai" 
                  value="yellow" 
                  onChange={(e) => setSelectedNilai(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontSize: "12px", marginLeft: "4px" }}>Cukup</span>
              </label>
              <label className="radio-item-p">
                <input 
                  type="radio" 
                  name="nilai" 
                  value="red" 
                  onChange={(e) => setSelectedNilai(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontSize: "12px", marginLeft: "4px" }}>Kurang</span>
              </label>
            </div>
          </div>

          {/* Kondisional Upload Foto: Muncul jika nilai BUKAN hijau */}
          {selectedNilai !== "" && selectedNilai !== "green" && (
            <div className="form-group-p fade-in">
              <label><FiCamera className="icon-p" /> Upload Foto <span className="req">*</span></label>
              <div className="upload-placeholder">
                <input 
                  type="file" 
                  id="upload-poto" 
                  hidden 
                  onChange={handleFileChange}
                  accept="image/*"
                  disabled={loading}
                />
                <label htmlFor="upload-poto" style={{ cursor: 'pointer' }}>
                  {fotoBukti ? `✓ ${fotoBukti.name}` : "Klik untuk tambah foto..."}
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
              ✓ Laporan berhasil disimpan!
            </div>
          )}

          <div className="modal-footer-p">
            <button type="button" className="btn-p-batal" onClick={onClose} disabled={loading || isLoadingLaporan}>
              ✕ Batal
            </button>
            <button 
              type="button" 
              className="btn-p-simpan" 
              onClick={handleSimpan}
              disabled={loading || isLoadingLaporan}
              style={{ opacity: loading || isLoadingLaporan ? 0.6 : 1 }}
            >
              {loading ? "⏳ Menyimpan..." : existingLaporan ? "✓ Update" : "✓ Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Penilaian;
