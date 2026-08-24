import { useEffect, useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import AdminSidebar from "../components/AdminSidebar";
import DeleteConfirmation from "../components/DeleteConfirmation";
import { areaAPI } from "../service/api";
import "./KelolaArea.css";

import {
    FiEdit2,
    FiPlus,
    FiTrash2,
    FiX,
} from "react-icons/fi";

export default function KelolaArea() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({ nama: "", lantai: "1", status: "aktif" });
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchArea();
  }, []);

  const fetchArea = async () => {
    try {
      setLoading(true);
      const res = await areaAPI.getAll();

      if (res.data.success) {
        setAreas(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
      setAreas([]);
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
      await areaAPI.delete(deleteItem.id_ruangan || deleteItem.id_area);
      await fetchArea();
      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus area. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        nama: area.nama_ruangan || area.nama || "",
        lantai: area.lantai !== undefined ? String(area.lantai) : String(area.deskripsi || "1"),
        status: area.status || "aktif"
      });
    } else {
      setEditingArea(null);
      setFormData({ nama: "", lantai: "1", status: "aktif" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArea(null);
    setFormData({ nama: "", lantai: "1", status: "aktif" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert("Nama area harus diisi");
      return;
    }

    try {
      setSaving(true);
      if (editingArea) {
        await areaAPI.update(editingArea.id_ruangan || editingArea.id_area, {
          nama: formData.nama,
          lantai: formData.lantai,
          status: formData.status,
        });
      } else {
        await areaAPI.create({
          nama: formData.nama,
          lantai: formData.lantai,
          status: formData.status,
        });
      }

      handleCloseModal();
      fetchArea();
    } catch (err) {
      console.log(err);
      alert("Terjadi kesalahan saat menyimpan area. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const filteredArea = areas.filter((a) =>
    ((a.nama_ruangan || a.nama || "").toLowerCase().includes(search.toLowerCase())) ||
    ((String(a.lantai || a.deskripsi || "")).includes(search.toLowerCase()))
  );

  return (
    <div className="kelola-area-page">
      <AdminSidebar />

      <main className="kelola-area-main">
        {/* TOPBAR */}
        <AdminTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari area..."
        />

        {/* CONTENT */}
        <section className="content">
          <div className="header">
            <div>
              <h1>Kelola Ruangan</h1>
              <p>Manajemen data ruangan dan lantai</p>
            </div>

            <button className="btn-add" onClick={() => handleOpenModal()}>
              <FiPlus /> Tambah Data
            </button>
          </div>

          {/* TABLE */}
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Nama Ruangan</th>
                  <th>Lantai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty">
                      Loading...
                    </td>
                  </tr>
                ) : filteredArea.length > 0 ? (
                  filteredArea.map((item) => (
                    <tr key={item.id_ruangan || item.id_area}>
                      <td>{item.nama_ruangan || item.nama}</td>
                      <td>{item.lantai || item.deskripsi || "-"}</td>
                      <td>
                        <span
                          className={`status ${
                            item.status === "aktif"
                              ? "aktif"
                              : "nonaktif"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="aksi">
                        <FiEdit2 className="edit" onClick={() => handleOpenModal(item)} />
                        <FiTrash2
                          className="delete"
                          onClick={() => handleDelete(item)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty">
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingArea ? "Edit Area" : "Tambah Area"}</h2>
              <FiX className="close-btn" onClick={handleCloseModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Ruangan</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama ruangan"
                  required
                />
              </div>
              <div className="form-group">
                <label>Lantai</label>
                <input
                  type="text"
                  value={formData.lantai}
                  onChange={(e) => setFormData({ ...formData, lantai: e.target.value })}
                  placeholder="Masukkan lantai ruangan"
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
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
        title="Hapus Area"
        message={`Apakah Anda yakin ingin menghapus area "${deleteItem?.nama_ruangan || deleteItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
