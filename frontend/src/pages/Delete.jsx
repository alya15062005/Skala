import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { penugasanAPI } from "../service/api";
import "./Delete.css";

const Delete = ({ show, onClose, onConfirm, selectedTask }) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedTask || !selectedTask.id_penugasan) {
      console.error("Error: Task ID tidak ditemukan");
      onClose();
      return;
    }

    try {
      setIsDeleting(true);
      await penugasanAPI.delete(selectedTask.id_penugasan);

      // Catat aktivitas penghapusan penugasan
      try {
        const aktivitasData = {
          id_user: user.id,
          nama_user: user.nama_lengkap,
          role_user: user.role,
          tipe_aktivitas: "penugasan",
          aksi: "Hapus penugasan",
          nama_entitas: "Penugasan",
          id_entitas: selectedTask.id_penugasan,
          detail: `Menghapus penugasan untuk area ${selectedTask.area || "Tidak ditentukan"}`,
          area_terkait: selectedTask.area,
          status: "selesai"
        };
        console.log("📤 Mengirim aktivitas delete:", aktivitasData);
        const aktivitasResponse = await penugasanAPI.createAktivitas(aktivitasData);
        console.log("✅ Aktivitas delete berhasil dicatat:", aktivitasResponse.data);
      } catch (activityError) {
        console.warn("❌ Gagal mencatat aktivitas delete:", activityError);
        // Lanjutkan meskipun pencatatan aktivitas gagal karena penugasan sudah dihapus
      }

      onConfirm();
    } catch (error) {
      console.error("Error deleting penugasan:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-hapus-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hapus-icon-bg">
          <FiAlertTriangle />
        </div>

        <h2 className="modal-hapus-title">Apakah Anda Yakin?</h2>
        <p className="modal-hapus-text">
          Tindakan ini tidak dapat dibatalkan. Semua nilai yang terkait dengan bidang ini akan hilang.
        </p>

        <div className="modal-hapus-actions">
          <button className="btn-hapus-confirm" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
          <button className="btn-hapus-batal" onClick={onClose} disabled={isDeleting}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Delete;