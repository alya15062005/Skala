import { useEffect, useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import AdminSidebar from "../components/AdminSidebar";
import DeleteConfirmation from "../components/DeleteConfirmation";
import { tugasAPI } from "../service/api";
import "./KelolaTugas.css";

import {
    FiEdit2,
    FiPlus,
    FiTrash2,
    FiX,
} from "react-icons/fi";

export default function KelolaTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    nama_tugas: "",
    deskripsi: "",
    kategori: "Pembersihan",
    status: "aktif",
  });

  useEffect(() => {
    fetchTugas();
  }, []);

  const fetchTugas = async () => {
    try {
      setLoading(true);

      const res = await tugasAPI.getAll();

      if (res.data.success) {
        setTugas(res.data.data);
      }
    } catch (err) {
      console.log(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      await tugasAPI.delete(deleteItem.id_tugas);
      await fetchTugas();
      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus tugas. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingTugas(item);

      setFormData({
        nama_tugas: item.nama_tugas,
        deskripsi: item.deskripsi ?? "",
        kategori: item.kategori || "Pembersihan",
        status: item.status || "aktif",
      });
    } else {
      setEditingTugas(null);

      setFormData({
        nama_tugas: "",
        deskripsi: "",
        kategori: "Pembersihan",
        status: "aktif",
      });
    }

    setShowModal(true);
    setFormError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_tugas.trim()) {
      alert("Nama tugas harus diisi");
      return;
    }

    // Cek duplikat nama tugas (case-insensitive)
    const namaBaru = formData.nama_tugas.trim().toLowerCase();
    const duplicate = tugas.some((t) => {
      if (editingTugas && t.id_tugas === editingTugas.id_tugas) return false; // ignore current when editing
      return (t.nama_tugas || "").trim().toLowerCase() === namaBaru;
    });

    if (duplicate) {
      setFormError("Tugas sudah tersedia");
      return;
    }

    setFormError("");
    try {
      setSaving(true);

      if (editingTugas) {
        await tugasAPI.update(editingTugas.id_tugas, formData);
      } else {
        await tugasAPI.create(formData);
      }

      handleCloseModal();
      await fetchTugas();
    } catch (err) {
      console.log(err);
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const filteredTugas = tugas.filter((item) =>
    (item.nama_tugas || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="kelola-tugas-page">
      <AdminSidebar />

      <main className="kelola-tugas-main">
        {/* TOPBAR */}
        <AdminTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari tugas..."
        />

        {/* CONTENT */}
        <section className="content">
          <div className="header">
            <div>
              <h1>Kelola Tugas</h1>
              <p>Manajemen data tugas kebersihan</p>
            </div>

            <button
              className="btn-add"
              onClick={() => handleOpenModal()}
            >
              <FiPlus />
              Tambah Data
            </button>
          </div>

          {/* TABLE */}
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Nama Tugas</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      Loading...
                    </td>
                  </tr>
                ) : filteredTugas.length > 0 ? (
                  filteredTugas.map((item) => (
                    <tr key={item.id_tugas}>
                      <td>{item.nama_tugas}</td>

                      <td>{item.deskripsi}</td>

                      <td>
                        <span className="kategori-badge">
                          {item.kategori}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            item.status?.toLowerCase() === "aktif"
                              ? "aktif"
                              : "nonaktif"
                          }`}
                        >
                          {item.status
                            ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                            : "-"}
                        </span>
                      </td>

                      <td className="aksi">
                        <FiEdit2
                          className="edit"
                          onClick={() => handleOpenModal(item)}
                        />

                        <FiTrash2
                          className="delete"
                          onClick={() => handleDelete(item)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={handleCloseModal}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editingTugas
                  ? "Edit Tugas"
                  : "Tambah Tugas"}
              </h2>

              <FiX
                className="close-btn"
                onClick={handleCloseModal}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Tugas</label>

                <input
                  type="text"
                  value={formData.nama_tugas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama_tugas: e.target.value,
                    })
                  }
                  required
                />
                {formError && (
                  <div style={{ color: "#b00020", fontSize: 13, marginTop: 6 }}>{formError}</div>
                )}
              </div>

              <div className="form-group">
                <label>Deskripsi</label>

                <textarea
                  rows="3"
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deskripsi: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>

                <select
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategori: e.target.value,
                    })
                  }
                >
                  <option>Pembersihan</option>
                  <option>Sanitasi</option>
                  <option>Pengumpulan Sampah</option>
                </select>
              </div>

                      <div className="form-group">
                <label>Status</label>

                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="aktif">Aktif</option>
                  <option value="non-aktif">Nonaktif</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmation
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Tugas"
        message={`Apakah Anda yakin ingin menghapus tugas "${deleteItem?.nama_tugas}"? Tindakan ini tidak dapat dibatalkan.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
