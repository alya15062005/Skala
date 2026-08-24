import bcrypt from "bcrypt";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { findUserById, findUserByUsername, getAllUsers, updateUser } from "../models/userModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../upload");

const getUploadFilePath = (fotoPath) => {
  if (!fotoPath) return null;
  return path.join(uploadDir, path.basename(fotoPath));
};

const deleteUploadedPhoto = async (fotoPath) => {
  const filePath = getUploadFilePath(fotoPath);
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Gagal menghapus foto lama:", error.message);
    }
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    // Validasi body ada
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        success: false,
        message: "Request body tidak valid. Pastikan mengirim JSON dengan Content-Type: application/json" 
      });
    }

    const username = req.body.username?.trim();
    const password = req.body.password;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username dan password harus diisi" 
      });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    // Bandingkan password dengan hash yang disimpan di database
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        message: "Password salah" 
      });
    }

    if (user.status && user.status.toLowerCase() === "nonaktif") {
      return res.status(403).json({
        success: false,
        message: "Anda tidak bisa login harap meminta persetujuan admin"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id_user, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        email: user.email || (user.username?.includes("@") ? user.username : null),
        foto: user.foto
      }
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// GET USER INFO (Protected route)
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        email: user.email || (user.username?.includes("@") ? user.username : null),
        foto: user.foto
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, nama_lengkap, email } = req.body;

    if (!username && !nama_lengkap && !email) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu field profil harus diubah"
      });
    }

    const updateData = {};
    if (username) updateData.username = String(username).trim();
    if (email) updateData.email = String(email).trim();
    else if (username?.includes("@")) updateData.email = String(username).trim();
    if (nama_lengkap !== undefined) updateData.nama_lengkap = nama_lengkap;

    const updatedUser = await updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id_user,
        username: updatedUser.username,
        nama_lengkap: updatedUser.nama_lengkap,
        role: updatedUser.role,
        email: updatedUser.email || updatedUser.username,
        foto: updatedUser.foto
      }
    });
  } catch (error) {
    console.error("❌ UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Semua field password harus diisi"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password baru tidak cocok"
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Password lama tidak sesuai"
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "Sandi sedang digunakan gunakan sandi lain"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUser(userId, { password: hashedPassword });

    res.json({
      success: true,
      message: "Password berhasil diperbarui"
    });
  } catch (error) {
    console.error("❌ CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPLOAD PHOTO
export const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan"
      });
    }

    const currentUser = await findUserById(userId);
    if (!currentUser) {
      await deleteUploadedPhoto(`/uploads/${file.filename}`);
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    // Simpan path foto ke database
    const fotoPath = `/uploads/${file.filename}`;
    const updatedUser = await updateUser(userId, { foto: fotoPath });

    if (!updatedUser) {
      await deleteUploadedPhoto(fotoPath);
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    if (currentUser.foto && currentUser.foto !== fotoPath) {
      await deleteUploadedPhoto(currentUser.foto);
    }

    res.json({
      success: true,
      message: "Foto berhasil diupload",
      foto: fotoPath,
      user: {
        id: updatedUser.id_user,
        username: updatedUser.username,
        nama_lengkap: updatedUser.nama_lengkap,
        role: updatedUser.role,
        email: updatedUser.email,
        foto: updatedUser.foto
      }
    });
  } catch (error) {
    console.error("❌ UPLOAD PHOTO ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET ALL USERS (Admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
