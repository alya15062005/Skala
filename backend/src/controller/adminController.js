import bcrypt from "bcrypt";
import { findAllArea } from "../models/areaModel.js";
import { findAllPenugasan } from "../models/penugasanModel.js";
import { countActiveAdmins, createUser, deleteUser, findUserById, getAllUsers, updateUser } from "../models/userModel.js";

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    console.log("🔍 [getDashboardStats] Mengambil data...");
    
    console.log("📊 Mengambil semua users...");
    const users = await getAllUsers();
    console.log(`✅ Users berhasil diambil: ${users.length} users`);
    
    console.log("📊 Mengambil semua penugasan...");
    const penugasan = await findAllPenugasan();
    console.log(`✅ Penugasan berhasil diambil: ${penugasan.length} penugasan`);
    
    console.log("📊 Mengambil semua area...");
    const area = await findAllArea();
    console.log(`✅ Area berhasil diambil: ${area.length} area`);

    const response = {
      success: true,
      data: {
        totalUser: users.length,
        totalTugas: penugasan.length,
        totalArea: area.length,
      }
    };
    console.log("✅ [getDashboardStats] Response:", response);
    res.json(response);
  } catch (error) {
    console.error("❌ [getDashboardStats] Error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error mengambil statistik dashboard",
      error: error.message,
      details: error.stack
    });
  }
};

export const createUserAdmin = async (req, res) => {
  try {
    const { nama_lengkap, email, role, status, password } = req.body;

    if (!email || !password || !nama_lengkap) {
      return res.status(400).json({
        success: false,
        message: "Nama lengkap, email, dan password wajib diisi"
      });
    }

    const username = email.trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, hashedPassword, nama_lengkap, role || "user", status || "nonaktif", email.trim());

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_lengkap, email, role, status, password } = req.body;

    const existingUser = await findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    // Cek jika user adalah admin dan status diubah ke nonaktif
    if (existingUser.role === "admin" && status === "nonaktif") {
      const activeAdminCount = await countActiveAdmins();
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Tidak bisa menonaktifkan admin ini. Minimal harus ada 1 admin yang aktif!"
        });
      }
    }

    const updateData = {
      nama_lengkap,
      role,
      status
    };
    if (email?.trim()) {
      updateData.email = email.trim();
      updateData.username = email.trim();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await updateUser(id, updateData);
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    // Cek jika user adalah admin dan masih aktif
    if (existingUser.role === "admin" && existingUser.status !== "nonaktif") {
      const activeAdminCount = await countActiveAdmins();
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Tidak bisa menghapus admin ini. Minimal harus ada 1 admin yang aktif!"
        });
      }
    }

    await deleteUser(id);
    res.json({
      success: true,
      message: "User berhasil dihapus"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};