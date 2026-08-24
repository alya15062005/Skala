import { useEffect, useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import AdminSidebar from "../components/AdminSidebar";
import DeleteConfirmation from "../components/DeleteConfirmation";
import { adminAPI } from "../service/api";
import "./KelolaUser.css";

import {
    FiEdit2,
    FiPlus,
    FiTrash2,
    FiX,
} from "react-icons/fi";

export default function KelolaUser() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
    role: "user",
    status: "aktif",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat daftar user");
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
      await adminAPI.deleteUser(deleteItem.id_user);
      setUsers((prev) => prev.filter((u) => u.id_user !== deleteItem.id_user));
      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        password: "",
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nama_lengkap: "",
        email: "",
        password: "",
        role: "user",
        status: "aktif",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nama_lengkap: "",
      email: "",
      password: "",
      role: "supervisor",
      status: "aktif",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_lengkap || !formData.email) {
      alert("Nama & email wajib diisi");
      return;
    }

    if (!editingUser && !formData.password) {
      alert("Password wajib diisi saat tambah user baru");
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        const payload = {
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };

        if (formData.password) {
          payload.password = formData.password;
        }

        const response = await adminAPI.updateUser(editingUser.id_user, payload);
        const updatedUser = response.data.data;

        setUsers((prev) =>
          prev.map((u) =>
            u.id_user === editingUser.id_user
              ? {
                  ...u,
                  nama_lengkap: updatedUser.nama_lengkap,
                  email: updatedUser.username || updatedUser.email,
                  role: updatedUser.role,
                  status: updatedUser.status,
                }
              : u
          )
        );
      } else {
        const response = await adminAPI.createUser({
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status,
        });
        const createdUser = response.data.data;
        setUsers((prev) => [
          ...prev,
          {
            id_user: createdUser.id_user,
            nama_lengkap: createdUser.nama_lengkap,
            email: createdUser.username || createdUser.email,
            role: createdUser.role,
            status: createdUser.status,
          },
        ]);
      }

      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  const filteredUser = users.filter((u) =>
    u.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="kelola-user-page">
      <AdminSidebar />

      <main className="kelola-user-main">
        {/* TOPBAR */}
        <AdminTopbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari user..."
        />

        {/* CONTENT */}
        <section className="content">
          <div className="header">
            <div>
              <h1>Kelola User</h1>
              <p>Manajemen data pengguna sistem</p>
            </div>

            <button className="btn-add" onClick={() => handleOpenModal()}>
              <FiPlus /> Tambah Data
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {/* TABLE */}
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty">Loading...</td>
                  </tr>
                ) : filteredUser.length > 0 ? (
                  filteredUser.map((item) => (
                    <tr key={item.id_user}>
                      <td>
                        <div className="user-row">
                          <div className="mini-avatar">
                            {item.nama_lengkap.charAt(0)}
                          </div>
                          {item.nama_lengkap}
                        </div>
                      </td>

                      <td>{item.email}</td>

                      <td>
                        <span className={`role ${item.role?.charAt(0).toUpperCase() + item.role?.slice(1)}`}>
                          {item.role}
                        </span>
                      </td>

                      <td>
                        <span className={`status ${item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="aksi">
                        <FiEdit2 
                          onClick={() => handleOpenModal(item)} 
                          style={{ color: "#3b82f6", cursor: "pointer" }}
                        />
                        <FiTrash2 
                          onClick={() => handleDelete(item)} 
                          style={{ color: "#ef4444", cursor: "pointer", marginLeft: "12px" }}
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Tambah User"}</h2>
              <FiX onClick={handleCloseModal} />
            </div>

            <form onSubmit={handleSubmit}>
              <input
                placeholder="Nama Lengkap"
                value={formData.nama_lengkap}
                onChange={(e) =>
                  setFormData({ ...formData, nama_lengkap: e.target.value })
                }
              />

              <input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder={editingUser ? "Password baru (opsional)" : "Password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit">
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
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${deleteItem?.nama_lengkap}"? Tindakan ini tidak dapat dibatalkan.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
