import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    FiBriefcase,
    FiCalendar,
    FiClock, FiFileText,
    FiMapPin,
    FiUserPlus,
    FiUsers,
    FiX
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { penugasanAPI } from "../service/api";
import "./TambahTugas.css";

const TambahTugas = ({ show, onClose, dataEdit, onSaveSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tanggalMulai: new Date(),
    tanggalSelesai: new Date(),
    petugas: "",
    area: "",
    tugas: "",
    shift: "",
    deskripsi: ""
  });
  const [obList, setObList] = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [tugasList, setTugasList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [obError, setObError] = useState(null);
  const [ruanganError, setRuanganError] = useState(null);
  const [tugasError, setTugasError] = useState(null);
  const [sheetHeight, setSheetHeight] = useState(50);
  const [sheetTouchStartY, setSheetTouchStartY] = useState(null);
  const [sheetDragStartY, setSheetDragStartY] = useState(null);
  const [sheetDragStartHeight, setSheetDragStartHeight] = useState(50);

  const isActiveOption = (item) => {
    if (!item || typeof item.status !== 'string') return true;
    const normalized = item.status.trim().toLowerCase();
    return normalized !== 'nonaktif' && normalized !== 'non-aktif';
  };

  const getDefaultSheetHeight = () => {
    return 50;
  };

  // Load OB, Ruangan, dan Tugas data dari database
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Loading OB, Ruangan, dan Tugas...");
        
        try {
          console.log("  📥 Fetching OB...");
          const obResponse = await penugasanAPI.getOB();
          console.log("  ✅ OB loaded:", obResponse.data.data);
          setObList(obResponse.data.data || []);
          setObError(null);
        } catch (err) {
          console.error("  ❌ OB Error:", err);
          setObError(`Gagal memuat OB: ${err.response?.data?.error || err.message}`);
        }

        try {
          console.log("  📥 Fetching Ruangan...");
          const ruanganResponse = await penugasanAPI.getRuangan();
          console.log("  ✅ Ruangan loaded:", ruanganResponse.data.data);
          setRuanganList(ruanganResponse.data.data || []);
          setRuanganError(null);
        } catch (err) {
          console.error("  ❌ Ruangan Error:", err);
          setRuanganError(`Gagal memuat Ruangan: ${err.response?.data?.error || err.message}`);
        }

        try {
          console.log("  📥 Fetching Tugas...");
          const tugasResponse = await penugasanAPI.getTugas();
          console.log("  ✅ Tugas loaded:", tugasResponse.data.data);
          setTugasList(tugasResponse.data.data || []);
          setTugasError(null);
        } catch (err) {
          console.error("  ❌ Tugas Error:", err);
          setTugasError(`Gagal memuat Tugas: ${err.response?.data?.error || err.message}`);
        }
        
        console.log("✅ Semua data selesai dimuat");
      } catch (error) {
        console.error("❌ Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Logika Frontend: Pantau jika ada dataEdit yang masuk
  useEffect(() => {
    setSheetHeight(getDefaultSheetHeight());
    if (dataEdit) {
      setFormData({
        tanggalMulai: dataEdit.tanggalMulai ? new Date(dataEdit.tanggalMulai) : new Date(),
        tanggalSelesai: dataEdit.tanggalSelesai ? new Date(dataEdit.tanggalSelesai) : new Date(),
        petugas: dataEdit.petugas || "",
        area: dataEdit.area || "",
        tugas: dataEdit.id_tugas ? String(dataEdit.id_tugas) : "",
        shift: dataEdit.shift || "",
        deskripsi: dataEdit.deskripsi || ""
      });
    } else {
      // Reset form jika klik "Tambah Penugasan"
      setFormData({
        tanggalMulai: new Date(),
        tanggalSelesai: new Date(),
        petugas: "",
        area: "",
        tugas: "",
        shift: "",
        deskripsi: ""
      });
    }
  }, [dataEdit, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const formatDateLocal = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      console.error("User tidak terautentikasi");
      return;
    }

    try {
      setIsLoading(true);

      // Cari id_ob berdasarkan nama petugas (boleh kosong)
      let id_ob = null;
      if (formData.petugas) {
        const selectedOB = obList.find((ob) => ob.nama_ob === formData.petugas);
        id_ob = selectedOB ? selectedOB.id_ob : null;
      }

      // Cari id_ruangan berdasarkan area (boleh kosong)
      let id_ruangan = null;
      if (formData.area) {
        const areaName = formData.area.split(" - ")[0]; // Extract nama_ruangan
        const selectedRuangan = ruanganList.find(
          (r) => r.nama_ruangan === areaName
        );
        id_ruangan = selectedRuangan ? selectedRuangan.id_ruangan : null;
      }

      // Format tanggal ke YYYY-MM-DD tanpa offset timezone
      const tanggal_awal = formatDateLocal(formData.tanggalMulai);
      const tanggal_akhir = formatDateLocal(formData.tanggalSelesai);

      const payload = {
        id_user: user.id,
        id_ob: id_ob || null,
        id_ruangan: id_ruangan || null,
        id_tugas: formData.tugas ? Number(formData.tugas) : null,
        tanggal_awal,
        tanggal_akhir,
        shift: formData.shift || null,
        deskripsi: formData.deskripsi
      };

      console.log("📤 [Frontend] Payload yang akan dikirim:", payload);

      let response;
      if (dataEdit && dataEdit.id_penugasan) {
        // Update penugasan
        console.log("🔄 [Frontend] Melakukan UPDATE untuk ID:", dataEdit.id_penugasan);
        response = await penugasanAPI.update(dataEdit.id_penugasan, payload);
        console.log("Penugasan berhasil diupdate:", response.data);

        // Catat aktivitas update
        try {
          const aktivitasData = {
            id_user: user.id,
            nama_user: user.nama_lengkap,
            role_user: user.role,
            tipe_aktivitas: "penugasan",
            aksi: "Update penugasan",
            nama_entitas: "Penugasan",
            id_entitas: response.data.data.id_penugasan,
            detail: `Update penugasan untuk area ${formData.area || "Tidak ditentukan"}`,
            area_terkait: formData.area,
            status: "selesai"
          };
          console.log("📤 Mengirim aktivitas update:", aktivitasData);
          const aktivitasResponse = await penugasanAPI.createAktivitas(aktivitasData);
          console.log("✅ Aktivitas update berhasil dicatat:", aktivitasResponse.data);
        } catch (activityError) {
          console.warn("❌ Gagal mencatat aktivitas update:", activityError);
        }
      } else {
        // Create penugasan baru
        console.log("➕ [Frontend] Melakukan CREATE penugasan baru");
        response = await penugasanAPI.create(payload);
        console.log("Penugasan berhasil dibuat:", response.data);

        // Catat aktivitas create
        try {
          const aktivitasData = {
            id_user: user.id,
            nama_user: user.nama_lengkap,
            role_user: user.role,
            tipe_aktivitas: "penugasan",
            aksi: "Assign tugas",
            nama_entitas: "Penugasan",
            id_entitas: response.data.data.id_penugasan,
            detail: `Penugasan baru untuk area ${formData.area || "Tidak ditentukan"}`,
            area_terkait: formData.area,
            status: "selesai"
          };
          console.log("📤 Mengirim aktivitas create:", aktivitasData);
          const aktivitasResponse = await penugasanAPI.createAktivitas(aktivitasData);
          console.log("✅ Aktivitas create berhasil dicatat:", aktivitasResponse.data);
        } catch (activityError) {
          console.warn("❌ Gagal mencatat aktivitas create:", activityError);
        }
      }

      // Panggil callback jika ada untuk refresh data
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Tutup modal
      onClose();
    } catch (error) {
      console.error("❌ [Frontend] Error menyimpan penugasan:", error);
      console.error("   Response:", error.response);
      console.error("   Request:", error.request);
    } finally {
      setIsLoading(false);
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
    <div className="modal-overlay tambah-tugas-overlay" onClick={onClose}>
      <div
        className="modal-content tambah-tugas-sheet"
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
          className="tambah-tugas-handle"
          aria-label="Geser form penugasan"
          onPointerDown={handleSheetHandlePointerDown}
          onPointerMove={handleSheetHandlePointerMove}
          onPointerUp={handleSheetHandlePointerUp}
          onPointerCancel={handleSheetHandlePointerUp}
        />
        <div className="modal-header-section">
          <div className="icon-main-bg"><FiUserPlus /></div>
          <h2 className="modal-title">{dataEdit ? "Edit Penugasan" : "Input Penugasan"}</h2>
        </div>

        <form className="modal-form-body" onSubmit={handleSubmit}>
          
          <div className="form-group-item">
            <label className="label-with-icon"><FiCalendar /> Pilih Periode</label>
            <div className="grid-periode">
              <div className="input-sub-group">
                <span className="input-hint">Tanggal Mulai</span>
                <DatePicker
                  selected={formData.tanggalMulai}
                  onChange={(date) => handleDateChange(date, "tanggalMulai")}
                  dateFormat="dd/MM/yyyy"
                  className="custom-input"
                />
              </div>
              <div className="input-sub-group">
                <span className="input-hint">Tanggal Selesai</span>
                <DatePicker
                  selected={formData.tanggalSelesai}
                  onChange={(date) => handleDateChange(date, "tanggalSelesai")}
                  dateFormat="dd/MM/yyyy"
                  className="custom-input"
                />
              </div>
            </div>
          </div>

          <div className="form-group-item">
            <label className="label-with-icon"><FiUsers /> Pilih Petugas/OB</label>
            {obError && <div style={{color: 'red', fontSize: '12px', marginBottom: '5px'}}>⚠️ {obError}</div>}
            <select name="petugas" value={formData.petugas} onChange={handleChange} className="custom-select" disabled={obList.length === 0 && !obError}>
              <option value="">{obList.length === 0 && !obError ? "Loading..." : "-- Pilih Petugas --"}</option>
              {obList.filter(isActiveOption).map((ob) => (
                <option key={ob.id_ob} value={ob.nama_ob}>
                  {ob.nama_ob}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="label-with-icon"><FiMapPin /> Pilih Area</label>
            {ruanganError && <div style={{color: 'red', fontSize: '12px', marginBottom: '5px'}}>⚠️ {ruanganError}</div>}
            <select name="area" value={formData.area} onChange={handleChange} className="custom-select" disabled={ruanganList.length === 0 && !ruanganError}>
              <option value="">{ruanganList.length === 0 && !ruanganError ? "Loading..." : "-- Pilih Area --"}</option>
              {ruanganList.filter(isActiveOption).map((ruangan) => (
                <option key={ruangan.id_ruangan} value={`${ruangan.nama_ruangan} - Lantai ${ruangan.lantai}`}>
                  {ruangan.nama_ruangan} (Lantai {ruangan.lantai})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="label-with-icon"><FiBriefcase /> Pilih Tugas</label>
            {tugasError && <div style={{color: 'red', fontSize: '12px', marginBottom: '5px'}}>⚠️ {tugasError}</div>}
            <select name="tugas" value={formData.tugas} onChange={handleChange} className="custom-select" disabled={tugasList.length === 0 && !tugasError}>
              <option value="">{tugasList.length === 0 && !tugasError ? "Loading..." : tugasList.filter(isActiveOption).length === 0 ? "-- Tidak ada tugas aktif --" : "-- Pilih Tugas --"}</option>
              {tugasList
                .filter(isActiveOption)
                .map((tugas) => (
                  <option key={tugas.id_tugas} value={String(tugas.id_tugas)}>
                    {tugas.nama_tugas}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="label-with-icon"><FiClock /> Pilih Shift</label>
            <select name="shift" value={formData.shift} onChange={handleChange} className="custom-select">
              <option value="">-- Pilih Shift --</option>
              <option value="Pagi">Pagi</option>
              <option value="Siang">Siang</option>
              <option value="Sore">Sore</option>
            </select>
          </div>

          <div className="form-group-item">
            <label className="label-with-icon"><FiFileText /> Deskripsi</label>
            <textarea 
              name="deskripsi" 
              value={formData.deskripsi} 
              onChange={handleChange} 
              className="custom-textarea" 
              placeholder="Tuliskan detail pekerjaan..."
            ></textarea>
          </div>

          <div className="modal-footer-btns">
            <button type="button" className="btn-modal-batal" onClick={onClose} disabled={isLoading}><FiX /> Batal</button>
            <button type="submit" className="btn-modal-simpan" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahTugas;
