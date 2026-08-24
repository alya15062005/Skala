import { useEffect, useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import AdminSidebar from "../components/AdminSidebar";
import DeleteConfirmation from "../components/DeleteConfirmation";
import { penugasanAPI } from "../service/api";
import "./KelolaOB.css";

import {
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";

export default function KelolaOB() {
  const [obList, setObList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [editingOB, setEditingOB] = useState(null);

  const [formData, setFormData] = useState({
    nama: "",
    kontak: "",
    status: "aktif",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOB();
  }, []);

  const normalizeOB = (item) => ({
    id_ob: item.id_ob,
    nama: item.nama || item.nama_ob || "",
    kontak: item.kontak || "",
    status: item.status || "aktif",
  });

  const fetchOB = async () => {
    try {
      setLoading(true);
      const response = await penugasanAPI.getOB();
      const data = response?.data?.data || [];
      setObList(data.map(normalizeOB));
    } catch (err) {
      console.error("Gagal memuat OB:", err);
      setObList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingOB(item);

      setFormData({
        nama: item.nama,
        kontak: item.kontak,
        status: item.status,
      });
    } else {
      setEditingOB(null);

      setFormData({
        nama: "",
        kontak: "",
        status: "aktif",
      });
    }

    setShowModal(true);
    setFormError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOB(null);

    setFormData({
      nama: "",
      kontak: "",
      status: "aktif",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama.trim() || !formData.kontak.trim()) {
      setFormError("Semua field wajib diisi");
      return;
    }

    const namaBaru = formData.nama.trim().toLowerCase();

    const duplicate = obList.some((t) => {
      if (editingOB && t.id_ob === editingOB.id_ob) return false;
      return (t.nama || "").trim().toLowerCase() === namaBaru;
    });

    if (duplicate) {
      setFormError("Nama OB sudah tersedia");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      if (editingOB) {
        const response = await penugasanAPI.updateOB(editingOB.id_ob, {
          nama_ob: formData.nama,
          kontak: formData.kontak,
          status: formData.status,
        });

        const updatedOB = normalizeOB(response.data.data);
        setObList((prev) =>
          prev.map((it) =>
            it.id_ob === editingOB.id_ob ? updatedOB : it
          )
        );
      } else {
        const response = await penugasanAPI.createOB({
          nama_ob: formData.nama,
          kontak: formData.kontak,
          status: formData.status,
        });

        const newOB = normalizeOB(response.data.data);
        setObList((prev) => [...prev, newOB]);
      }

      handleCloseModal();
    } catch (err) {
      console.error("Gagal menyimpan OB:", err);
      setFormError(err.response?.data?.message || "Gagal menyimpan data OB");
    } finally {
      setSaving(false);
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
      await penugasanAPI.deleteOB(deleteItem.id_ob);
      setObList((prev) =>
        prev.filter((it) => it.id_ob !== deleteItem.id_ob)
      );
      setDeleteItem(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Gagal menghapus OB:", err);
      alert(err.response?.data?.message || "Gagal menghapus data OB");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = obList.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="kelola-ob-page">
      <AdminSidebar />

      <main className="kelola-ob-main">
        {/* TOPBAR */}
        <AdminTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari petugas..."
        />

        {/* CONTENT */}
        <section className="ob-content">
          <div className="ob-header">
            <div>
              <h1>Kelola OB</h1>
              <p>Kelola data petugas kebersihan</p>
            </div>

            <button className="btn-add" onClick={() => handleOpenModal()}>
              <FiPlus />
              Tambah Data
            </button>
          </div>

          {/* TABLE */}
          <div className="ob-table-box">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Petugas</th>
                  <th>Kontak</th>
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
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.id_ob}>
                      <td>
                        OB-{String(index + 1).padStart(3, "0")}
                      </td>

                      <td>{item.nama}</td>

                      <td>{item.kontak}</td>

                      <td>
                        <span
                          className={`status-ob ${
                            item.status === "aktif"
                              ? "aktif"
                              : "nonaktif"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="aksi-ob">
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
                {editingOB
                  ? "Edit Petugas OB"
                  : "Tambah Petugas OB"}
              </h2>

              <FiX
                className="close-btn"
                onClick={handleCloseModal}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama OB</label>

                <input
                  type="text"
                  placeholder="Masukan Nama OB"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>No Kontak</label>

                <input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={formData.kontak}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kontak: e.target.value,
                    })
                  }
                />
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
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              {formError && (
                <div
                  style={{
                    color: "#b00020",
                    fontSize: 13,
                    marginTop: 6,
                  }}
                >
                  {formError}
                </div>
              )}

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
        title="Hapus Petugas OB"
        message={`Apakah Anda yakin ingin menghapus petugas "${deleteItem?.nama}"?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
