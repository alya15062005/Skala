import fs from "fs/promises";
import path from "path";
import {
    createAktivitas,
    createLaporan,
    createOB,
    createPenugasan,
    createRuangan,
    createTugas,
    deleteOB,
    deletePenugasan,
    deleteTugas,
    findAllAktivitas,
    findAllLaporan,
    findAllOB,
    findAllPenugasan,
    findAllRuangan,
    findAllTugas,
    findLaporanById,
    findLaporanByPenugasan,
    findPenugasanById,
    findTugasById,
    updateLaporan,
    updateOB,
    updatePenugasan,
    updateTugas
} from "../models/penugasanModel.js";

const getUploadFilePath = (fotoPath) => {
  if (!fotoPath) return null;
  return path.join(process.cwd(), "src", "upload", path.basename(fotoPath));
};

const deleteLocalFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`🗑️ Deleted upload file: ${filePath}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`⚠️ Cannot delete upload file ${filePath}:`, err.message);
    }
  }
};

// PENUGASAN CRUD
export const getPenugasan = async (req, res) => {
  try {
    const penugasan = await findAllPenugasan();
    res.json({
      success: true,
      data: penugasan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPenugasanById = async (req, res) => {
  try {
    const { id } = req.params;
    const penugasan = await findPenugasanById(id);

    if (!penugasan) {
      return res.status(404).json({
        success: false,
        message: "Penugasan tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: penugasan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewPenugasan = async (req, res) => {
  try {
    const data = req.body;

    console.log("📥 Data diterima di backend:", data);

    // Validasi input - hanya id_user dan tanggal_awal yang wajib
    if (!data.id_user || !data.tanggal_awal) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap. Pastikan id_user dan tanggal_awal diisi"
      });
    }

    // Validasi id_tugas jika ada - pastikan id_tugas ada di tabel tugas
    if (data.id_tugas) {
      console.log(`🔍 [CREATE] Validasi id_tugas: ${data.id_tugas}`);
      const tugasExists = await findTugasById(data.id_tugas);
      console.log(`   Hasil validasi: ${tugasExists ? '✅ Ada' : '❌ Tidak ada'}`);
      if (!tugasExists) {
        console.log(`   ⚠️ Tugas dengan ID ${data.id_tugas} tidak ditemukan`);
        return res.status(400).json({
          success: false,
          message: `Tugas dengan ID ${data.id_tugas} tidak ditemukan. Pilih tugas yang valid atau kosongkan field tugas.`
        });
      }
    }

    // Generate kode pengerjaan jika tidak ada
    if (!data.kode_pengerjaan) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      data.kode_pengerjaan = `P${year}${month}${day}-${Date.now().toString().slice(-4)}`;
    }

    const penugasan = await createPenugasan(data);
    res.status(201).json({
      success: true,
      message: "Penugasan berhasil dibuat",
      data: penugasan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingPenugasan = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Validasi id_tugas jika ada - pastikan id_tugas ada di tabel tugas
    if (data.id_tugas) {
      const tugasExists = await findTugasById(data.id_tugas);
      if (!tugasExists) {
        return res.status(400).json({
          success: false,
          message: `Tugas dengan ID ${data.id_tugas} tidak ditemukan. Pilih tugas yang valid atau kosongkan field tugas.`
        });
      }
    }

    const penugasan = await updatePenugasan(id, data);
    if (!penugasan) {
      return res.status(404).json({
        success: false,
        message: "Penugasan tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "Penugasan berhasil diupdate",
      data: penugasan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingPenugasan = async (req, res) => {
  try {
    const { id } = req.params;
    const penugasan = await deletePenugasan(id);

    if (!penugasan) {
      return res.status(404).json({
        success: false,
        message: "Penugasan tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "Penugasan berhasil dihapus"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// OB (Orang Bersih) CRUD
export const getOB = async (req, res) => {
  try {
    const ob = await findAllOB();
    res.json({
      success: true,
      data: ob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewOB = async (req, res) => {
  try {
    const data = req.body;
    const validStatuses = ["aktif", "nonaktif"];

    if (!data.nama_ob) {
      return res.status(400).json({
        success: false,
        message: "Nama OB harus diisi"
      });
    }

    if (data.status !== undefined && !validStatuses.includes(data.status)) {
      return res.status(400).json({
        success: false,
        message: `Status OB harus salah satu dari: ${validStatuses.join(", ")}`
      });
    }

    const ob = await createOB(data);
    res.status(201).json({
      success: true,
      message: "OB berhasil dibuat",
      data: ob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingOB = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const validStatuses = ["aktif", "nonaktif"];

    if (!data.nama_ob) {
      return res.status(400).json({
        success: false,
        message: "Nama OB harus diisi"
      });
    }

    if (data.status !== undefined && !validStatuses.includes(data.status)) {
      return res.status(400).json({
        success: false,
        message: `Status OB harus salah satu dari: ${validStatuses.join(", ")}`
      });
    }

    const ob = await updateOB(id, data);
    if (!ob) {
      return res.status(404).json({
        success: false,
        message: "OB tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "OB berhasil diupdate",
      data: ob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingOB = async (req, res) => {
  try {
    const { id } = req.params;
    const ob = await deleteOB(id);

    if (!ob) {
      return res.status(404).json({
        success: false,
        message: "OB tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "OB berhasil dihapus"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// RUANGAN CRUD
export const getRuangan = async (req, res) => {
  try {
    const ruangan = await findAllRuangan();
    res.json({
      success: true,
      data: ruangan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewRuangan = async (req, res) => {
  try {
    const data = req.body;

    if (!data.nama_ruangan) {
      return res.status(400).json({
        success: false,
        message: "Nama ruangan harus diisi"
      });
    }

    const ruangan = await createRuangan(data);
    res.status(201).json({
      success: true,
      message: "Ruangan berhasil dibuat",
      data: ruangan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTugas = async (req, res) => {
  try {
    const tugas = await findAllTugas();
    res.json({
      success: true,
      data: tugas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewTugas = async (req, res) => {
  try {
    const data = req.body;

    if (!data.nama_tugas) {
      return res.status(400).json({
        success: false,
        message: "Nama tugas harus diisi"
      });
    }

    const tugas = await createTugas(data);
    res.status(201).json({
      success: true,
      message: "Tugas berhasil dibuat",
      data: tugas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingTugas = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const tugas = await updateTugas(id, data);
    if (!tugas) {
      return res.status(404).json({
        success: false,
        message: "Tugas tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "Tugas berhasil diupdate",
      data: tugas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingTugas = async (req, res) => {
  try {
    const { id } = req.params;
    const tugas = await deleteTugas(id);

    if (!tugas) {
      return res.status(404).json({
        success: false,
        message: "Tugas tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "Tugas berhasil dihapus"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// LAPORAN CRUD
export const getLaporan = async (req, res) => {
  try {
    const { tanggal, tanggal_awal, tanggal_akhir } = req.query;
    const laporan = await findAllLaporan({ tanggal, tanggal_awal, tanggal_akhir });
    res.json({
      success: true,
      data: laporan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getLaporanByPenugasan = async (req, res) => {
  try {
    const { id_penugasan } = req.params;
    const tanggal = req.query.tanggal;
    const laporan = await findLaporanByPenugasan(id_penugasan, tanggal);
    
    if (!laporan) {
      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan untuk penugasan ini"
      });
    }

    res.json({
      success: true,
      data: laporan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewLaporan = async (req, res) => {
  try {
    const data = req.body;

    console.log("📥 Body yang diterima di controller:", JSON.stringify(data, null, 2));
    console.log("📁 File yang diunggah:", req.file ? req.file.filename : "tidak ada");

    // Validasi minimal: hanya id_penugasan, tanggal, dan status_kehadiran yang wajib
    if (!data.id_penugasan || !data.tanggal || !data.status_kehadiran) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap. Pastikan id_penugasan, tanggal, dan status_kehadiran diisi"
      });
    }

    // Jika ada file yang diunggah, simpan path-nya
    if (req.file) {
      data.foto_path = `uploads/${req.file.filename}`;
      console.log("📷 Path foto yang disimpan:", data.foto_path);
    }

    // Cari laporan yang sudah ada
    const existingLaporan = await findLaporanByPenugasan(data.id_penugasan, data.tanggal);

    if (existingLaporan && req.file && existingLaporan.foto_path) {
      const oldFile = getUploadFilePath(existingLaporan.foto_path);
      await deleteLocalFile(oldFile);
    }

    if (data.nilai === "green") {
      if (req.file) {
        const newFile = getUploadFilePath(data.foto_path);
        await deleteLocalFile(newFile);
      }
      if (existingLaporan?.foto_path) {
        const oldFile = getUploadFilePath(existingLaporan.foto_path);
        await deleteLocalFile(oldFile);
      }
      data.foto_path = null;
      console.log("🧹 Nilai green di create/update, foto akan dihapus dari data jika ada");
    }

    // Periksa apakah laporan untuk penugasan dan tanggal ini sudah ada
    if (existingLaporan) {
      console.log("🔄 Laporan sudah ada untuk penugasan ini dan tanggal ini. Mengupdate data yang sudah ada.", {
        id_laporan: existingLaporan.id_laporan,
        id_penugasan: existingLaporan.id_penugasan,
        tanggal: existingLaporan.tanggal
      });

      const updatedLaporan = await updateLaporan(existingLaporan.id_laporan, data);
      return res.json({
        success: true,
        message: "Laporan berhasil diupdate",
        data: updatedLaporan
      });
    }

    // Log semua field untuk debugging
    console.log("✅ Field yang akan disimpan:");
    console.log("  - id_penugasan:", data.id_penugasan, "type:", typeof data.id_penugasan);
    console.log("  - tanggal:", data.tanggal, "type:", typeof data.tanggal);
    console.log("  - shift:", data.shift, "type:", typeof data.shift);
    console.log("  - status_kehadiran:", data.status_kehadiran, "type:", typeof data.status_kehadiran);
    console.log("  - person_assigned:", data.person_assigned, "type:", typeof data.person_assigned);
    console.log("  - nilai:", data.nilai, "type:", typeof data.nilai);
    console.log("  - id_user_pengawas:", data.id_user_pengawas, "type:", typeof data.id_user_pengawas);
    console.log("  - foto_path:", data.foto_path);

    const laporan = await createLaporan(data);
    res.status(201).json({
      success: true,
      message: "Laporan berhasil dibuat",
      data: laporan
    });
  } catch (error) {
    console.error("❌ Error creating laporan:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Full error:", error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail || "Unknown error"
    });
  }
};

// Update Laporan
export const updateLaporanController = async (req, res) => {
  try {
    const { id_laporan } = req.params;
    const data = req.body;

    console.log("🔄 ========== UPDATE LAPORAN ==========");
    console.log("🔄 Request params:", req.params);
    console.log("🔄 ID Laporan dari params:", id_laporan);
    console.log("🔄 Request body:", JSON.stringify(data, null, 2));
    console.log("📁 File yang diunggah:", req.file ? req.file.filename : "tidak ada");
    console.log("🔄 Full URL:", req.originalUrl);
    console.log("🔄 Method:", req.method);
    console.log("🔄 =====================================");

    if (!id_laporan || id_laporan === 'undefined') {
      return res.status(400).json({
        success: false,
        message: "ID Laporan tidak valid atau undefined",
        receivedId: id_laporan
      });
    }

    const existingLaporan = await findLaporanById(id_laporan);
    if (!existingLaporan) {
      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan",
      });
    }

    // Jika ada file yang diunggah, ganti foto lama dengan foto baru
    if (req.file) {
      const newFotoPath = `uploads/${req.file.filename}`;
      data.foto_path = newFotoPath;
      console.log("📷 Path foto yang diupdate:", data.foto_path);

      if (existingLaporan.foto_path) {
        const oldFile = getUploadFilePath(existingLaporan.foto_path);
        await deleteLocalFile(oldFile);
      }
    }

    if (data.nilai === "green") {
      if (req.file) {
        const newFile = getUploadFilePath(data.foto_path);
        await deleteLocalFile(newFile);
      }
      if (existingLaporan.foto_path) {
        const oldFile = getUploadFilePath(existingLaporan.foto_path);
        await deleteLocalFile(oldFile);
      }
      data.foto_path = null;
      console.log("🧹 Update nilai green, foto lama dihapus dan foto baru dibatalkan");
    }

    const laporan = await updateLaporan(id_laporan, data);
    res.json({
      success: true,
      message: "Laporan berhasil diupdate",
      data: laporan
    });
  } catch (error) {
    console.error("❌ Error updating laporan:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== AKTIVITAS ====================

export const getAktivitas = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`📝 [getAktivitas] Mengambil aktivitas dengan limit: ${limit}`);
    
    const aktivitas = await findAllAktivitas(limit);
    console.log(`✅ [getAktivitas] Berhasil mengambil ${aktivitas.length} aktivitas`);
    
    res.json({
      success: true,
      data: aktivitas
    });
  } catch (error) {
    console.error("❌ [getAktivitas] Error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error mengambil aktivitas",
      error: error.message
    });
  }
};

export const createNewAktivitas = async (req, res) => {
  try {
    const data = req.body;
    console.log("📝 [createNewAktivitas] Data diterima:", data);

    // Validasi input
    if (!data.id_user || !data.tipe_aktivitas || !data.aksi) {
      console.warn("⚠️ Data tidak lengkap:", { id_user: data.id_user, tipe_aktivitas: data.tipe_aktivitas, aksi: data.aksi });
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap. Pastikan id_user, tipe_aktivitas, dan aksi diisi"
      });
    }

    const aktivitas = await createAktivitas(data);
    console.log("✅ Aktivitas berhasil dibuat:", aktivitas);
    res.status(201).json({
      success: true,
      message: "Aktivitas berhasil dicatat",
      data: aktivitas
    });
  } catch (error) {
    console.error("❌ Error creating aktivitas:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
