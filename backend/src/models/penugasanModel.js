import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";

const getUploadFilePath = (fotoPath) => {
  if (!fotoPath) return null;
  const filename = path.basename(fotoPath);
  return path.join(process.cwd(), "src", "upload", filename);
};

const deleteUploadFile = async (fotoPath) => {
  const filePath = getUploadFilePath(fotoPath);
  if (!filePath) return;

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`🗑️ Deleted old upload file: ${filePath}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`⚠️ Gagal menghapus file ${filePath}:`, err.message);
    }
  }
};

export const findAllPenugasan = async () => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.username,
        u.nama_lengkap,
        o.nama_ob,
        o.kontak,
        r.nama_ruangan,
        r.lantai,
        t.nama_tugas as detail_pekerjaan,
        t.status as status_tugas
      FROM penugasan p
      LEFT JOIN users u ON p.id_user = u.id_user
      LEFT JOIN ob o ON p.id_ob = o.id_ob
      LEFT JOIN ruangan r ON p.id_ruangan = r.id_ruangan
      LEFT JOIN tugas t ON p.id_tugas = t.id_tugas
      ORDER BY p.tanggal_awal DESC
    `);
    return result.rows;
  } catch (error) {
    console.error("Error finding all penugasan:", error);
    throw error;
  }
};

export const findPenugasanById = async (id) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.username,
        u.nama_lengkap,
        o.nama_ob,
        o.kontak,
        r.nama_ruangan,
        r.lantai,
        t.nama_tugas as detail_pekerjaan,
        t.status as status_tugas
      FROM penugasan p
      LEFT JOIN users u ON p.id_user = u.id_user
      LEFT JOIN ob o ON p.id_ob = o.id_ob
      LEFT JOIN ruangan r ON p.id_ruangan = r.id_ruangan
      LEFT JOIN tugas t ON p.id_tugas = t.id_tugas
      WHERE p.id_penugasan = $1
    `, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding penugasan by id:", error);
    throw error;
  }
};

export const createPenugasan = async (data) => {
  try {
    console.log("📊 Insert Query - Data yang akan disimpan:", {
      id_user: data.id_user,
      id_ob: data.id_ob,
      id_ruangan: data.id_ruangan,
      id_tugas: data.id_tugas,
      tanggal_awal: data.tanggal_awal,
      tanggal_akhir: data.tanggal_akhir,
      kode_pengerjaan: data.kode_pengerjaan,
      shift: data.shift,
      deskripsi: data.deskripsi,
      rolling_mingguan: data.rolling_mingguan
    });

    const result = await pool.query(`
      INSERT INTO penugasan (
        id_user, id_ob, id_ruangan, id_tugas, tanggal_awal, tanggal_akhir,
        kode_pengerjaan, shift, deskripsi, rolling_mingguan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.id_user,
      data.id_ob,
      data.id_ruangan,
      data.id_tugas || null,
      data.tanggal_awal,
      data.tanggal_akhir,
      data.kode_pengerjaan,
      data.shift || null,
      data.deskripsi || null,
      data.rolling_mingguan || false
    ]);
    console.log("✅ Data berhasil disimpan:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating penugasan:", error);
    throw error;
  }
};

export const updatePenugasan = async (id, data) => {
  try {
    console.log("📊 Update Query - ID:", id, "Data yang akan diupdate:", {
      id_user: data.id_user,
      id_ob: data.id_ob,
      id_ruangan: data.id_ruangan,
      id_tugas: data.id_tugas,
      tanggal_awal: data.tanggal_awal,
      tanggal_akhir: data.tanggal_akhir,
      kode_pengerjaan: data.kode_pengerjaan,
      shift: data.shift,
      deskripsi: data.deskripsi,
      rolling_mingguan: data.rolling_mingguan
    });

    const result = await pool.query(`
      UPDATE penugasan SET
        id_user = $1,
        id_ob = $2,
        id_ruangan = $3,
        id_tugas = $4,
        tanggal_awal = $5,
        tanggal_akhir = $6,
        kode_pengerjaan = $7,
        shift = $8,
        deskripsi = $9,
        rolling_mingguan = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_penugasan = $11
      RETURNING *
    `, [
      data.id_user,
      data.id_ob,
      data.id_ruangan,
      data.id_tugas || null,
      data.tanggal_awal,
      data.tanggal_akhir,
      data.kode_pengerjaan,
      data.shift || null,
      data.deskripsi || null,
      data.rolling_mingguan || false,
      id
    ]);
    console.log("✅ Data berhasil diupdate:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating penugasan:", error);
    throw error;
  }
};

export const deletePenugasan = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM penugasan WHERE id_penugasan = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting penugasan:", error);
    throw error;
  }
};

// OB (Orang Bersih) functions
export const ensureOBStatusColumn = async () => {
  try {
    await pool.query(
      "ALTER TABLE ob ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'aktif'"
    );
    await pool.query(
      "UPDATE ob SET status = 'aktif' WHERE status IS NULL"
    );
    // Try to add a CHECK constraint; ignore duplicate constraint errors
    try {
      await pool.query(
        "ALTER TABLE ob ADD CONSTRAINT ob_status_check CHECK (status IN ('aktif', 'nonaktif'))"
      );
    } catch (err) {
      // MySQL may report duplicate constraint or unsupported syntax — ignore duplicates
      if (err && (err.errno === 1826 || (err.sqlMessage && /Duplicate/i.test(err.sqlMessage)))) {
        console.log('ob_status_check already exists, skipping');
      } else {
        console.warn('Could not add ob_status_check constraint:', err.message || err);
      }
    }
  } catch (error) {
    console.error("Error ensuring ob.status column and constraint:", error);
    throw error;
  }
};

export const ensureTugasDescriptionColumn = async () => {
  try {
    await pool.query(
      "ALTER TABLE tugas ADD COLUMN IF NOT EXISTS deskripsi TEXT"
    );
  } catch (error) {
    console.error("Error ensuring tugas.deskripsi column:", error);
    throw error;
  }
};

export const findAllOB = async () => {
  try {
    const result = await pool.query(
      "SELECT id_ob, nama_ob, kontak, COALESCE(status, 'aktif') AS status FROM ob ORDER BY nama_ob"
    );
    return result.rows;
  } catch (error) {
    console.error("Error finding all OB:", error);
    throw error;
  }
};

export const createOB = async (data) => {
  try {
    const result = await pool.query(
      "INSERT INTO ob (nama_ob, kontak, status) VALUES ($1, $2, COALESCE($3, 'aktif')) RETURNING *",
      [data.nama_ob, data.kontak, data.status]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating OB:", error);
    throw error;
  }
};

export const updateOB = async (id, data) => {
  try {
    const result = await pool.query(
      "UPDATE ob SET nama_ob = $1, kontak = $2, status = COALESCE($3, status) WHERE id_ob = $4 RETURNING *",
      [data.nama_ob, data.kontak, data.status, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating OB:", error);
    throw error;
  }
};

export const deleteOB = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM ob WHERE id_ob = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting OB:", error);
    throw error;
  }
};

// Ruangan functions
export const findAllRuangan = async () => {
  try {
    const result = await pool.query("SELECT * FROM ruangan ORDER BY nama_ruangan");
    return result.rows;
  } catch (error) {
    console.error("Error finding all ruangan:", error);
    throw error;
  }
};

export const createRuangan = async (data) => {
  try {
    const result = await pool.query(
      "INSERT INTO ruangan (nama_ruangan, lantai, status) VALUES ($1, $2, COALESCE($3, 'aktif')) RETURNING *",
      [data.nama_ruangan, data.lantai, data.status]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating ruangan:", error);
    throw error;
  }
};

// Tugas functions
export const findAllTugas = async () => {
  try {
    const result = await pool.query("SELECT * FROM tugas ORDER BY nama_tugas");
    return result.rows;
  } catch (error) {
    console.error("Error finding all tugas:", error);
    throw error;
  }
};

export const findTugasById = async (id) => {
  try {
    console.log(`   🔎 Query database untuk tugas ID: ${id}`);
    const result = await pool.query("SELECT * FROM tugas WHERE id_tugas = $1", [id]);
    console.log(`   Query result: ${result.rows.length} rows found`);
    if (result.rows.length > 0) {
      console.log(`   ✅ Tugas ditemukan:`, result.rows[0]);
    } else {
      console.log(`   ❌ Tugas tidak ditemukan`);
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error finding tugas by id:", error);
    throw error;
  }
};

export const createTugas = async (data) => {
  try {
    const result = await pool.query(
      "INSERT INTO tugas (nama_tugas, deskripsi, status) VALUES ($1, $2, COALESCE($3, 'aktif')) RETURNING *",
      [data.nama_tugas, data.deskripsi || null, data.status]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating tugas:", error);
    throw error;
  }
};

export const updateTugas = async (id, data) => {
  try {
    const result = await pool.query(
      "UPDATE tugas SET nama_tugas = COALESCE($1, nama_tugas), deskripsi = COALESCE($2, deskripsi), status = COALESCE($3, status) WHERE id_tugas = $4 RETURNING *",
      [data.nama_tugas, data.deskripsi, data.status, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating tugas:", error);
    throw error;
  }
};

export const deleteTugas = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM tugas WHERE id_tugas = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting tugas:", error);
    throw error;
  }
};

// LAPORAN functions
export const findAllLaporan = async ({ tanggal, tanggal_awal, tanggal_akhir } = {}) => {
  try {
    let whereClause = "";
    const params = [];

    if (tanggal) {
      whereClause = "WHERE DATE(l.tanggal) = $1";
      params.push(tanggal);
    } else if (tanggal_awal && tanggal_akhir) {
      whereClause = "WHERE DATE(l.tanggal) BETWEEN $1 AND $2";
      params.push(tanggal_awal, tanggal_akhir);
    } else if (tanggal_awal) {
      whereClause = "WHERE DATE(l.tanggal) >= $1";
      params.push(tanggal_awal);
    } else if (tanggal_akhir) {
      whereClause = "WHERE DATE(l.tanggal) <= $1";
      params.push(tanggal_akhir);
    }

    const query = `
      SELECT
        l.*,
        p.kode_pengerjaan,
        p.deskripsi as deskripsi_penugasan,
        o.nama_ob,
        r.nama_ruangan,
        r.lantai,
        t.nama_tugas as detail_pekerjaan
      FROM laporan l
      LEFT JOIN penugasan p ON l.id_penugasan = p.id_penugasan
      LEFT JOIN ob o ON p.id_ob = o.id_ob
      LEFT JOIN ruangan r ON p.id_ruangan = r.id_ruangan
      LEFT JOIN tugas t ON p.id_tugas = t.id_tugas
      /*
        Tugas diambil dari relasi penugasan -> tugas melalui id_penugasan.
        Tidak perlu kolom tugas tambahan di tabel laporan.
      */
      ${whereClause}
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error finding all laporan:", error);
    throw error;
  }
};

export const findLaporanByPenugasan = async (id_penugasan, tanggal) => {
  try {
    const query = `
      SELECT
        l.*,
        p.kode_pengerjaan,
        p.deskripsi as deskripsi_penugasan,
        o.nama_ob,
        r.nama_ruangan,
        r.lantai,
        t.nama_tugas as detail_pekerjaan
      FROM laporan l
      LEFT JOIN penugasan p ON l.id_penugasan = p.id_penugasan
      LEFT JOIN ob o ON p.id_ob = o.id_ob
      LEFT JOIN ruangan r ON p.id_ruangan = r.id_ruangan
      LEFT JOIN tugas t ON p.id_tugas = t.id_tugas
      WHERE l.id_penugasan = $1
      ${tanggal ? "AND DATE(l.tanggal) = $2" : ""}
      ORDER BY l.created_at DESC
      LIMIT 1
    `;
    const params = tanggal ? [id_penugasan, tanggal] : [id_penugasan];
    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding laporan by penugasan:", error);
    throw error;
  }
};

export const findLaporanById = async (id_laporan) => {
  try {
    const result = await pool.query(`SELECT * FROM laporan WHERE id_laporan = $1`, [id_laporan]);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding laporan by id:", error);
    throw error;
  }
};

export const createLaporan = async (data) => {
  try {
    console.log("📊 createLaporan - Data yang akan disimpan:", {
      id_penugasan: data.id_penugasan,
      id_user_pengawas: data.id_user_pengawas,
      tanggal: data.tanggal,
      shift: data.shift,
      status_kehadiran: data.status_kehadiran,
      person_assigned: data.person_assigned,
      nilai: data.nilai,
      catatan: data.catatan,
      foto_path_exists: !!data.foto_path
    });

    const result = await pool.query(`
      INSERT INTO laporan (
        id_penugasan, id_user_pengawas, tanggal, shift,
        status_kehadiran, person_assigned, nilai, catatan, foto_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      data.id_penugasan,
      data.id_user_pengawas || null,
      data.tanggal,
      data.shift || null,
      data.status_kehadiran,
      data.person_assigned,
      data.nilai || null,
      data.catatan || null,
      data.foto_path || null
    ]);
    
    console.log("✅ Laporan berhasil disimpan ke DB:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error creating laporan:", error);
    throw error;
  }
};

// Update Laporan
export const updateLaporan = async (id_laporan, data) => {
  try {
    console.log("📊 updateLaporan - Data yang akan diupdate:", {
      id_laporan,
      id_user_pengawas: data.id_user_pengawas,
      shift: data.shift,
      status_kehadiran: data.status_kehadiran,
      person_assigned: data.person_assigned,
      nilai: data.nilai,
      catatan: data.catatan,
      foto_path_exists: data.foto_path !== undefined ? !!data.foto_path : undefined
    });

    const existingResult = await pool.query(`SELECT foto_path FROM laporan WHERE id_laporan = $1`, [id_laporan]);
    if (existingResult.rows.length === 0) {
      throw new Error(`Laporan dengan ID ${id_laporan} tidak ditemukan`);
    }
    const existingLaporan = existingResult.rows[0];

    if (data.foto_path !== undefined) {
      const isRemovingPhoto = data.foto_path === null;
      const isReplacingPhoto = data.foto_path && data.foto_path !== existingLaporan.foto_path;

      if (existingLaporan.foto_path && (isRemovingPhoto || isReplacingPhoto)) {
        await deleteUploadFile(existingLaporan.foto_path);
      }
    }

    // Build dynamic UPDATE query berdasarkan field yang ada
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (data.shift !== undefined) {
      updateFields.push(`shift = $${paramCount++}`);
      updateValues.push(data.shift || null);
    }
    if (data.status_kehadiran !== undefined) {
      updateFields.push(`status_kehadiran = $${paramCount++}`);
      updateValues.push(data.status_kehadiran);
    }
    if (data.person_assigned !== undefined) {
      updateFields.push(`person_assigned = $${paramCount++}`);
      updateValues.push(data.person_assigned);
    }
    if (data.nilai !== undefined) {
      updateFields.push(`nilai = $${paramCount++}`);
      updateValues.push(data.nilai || null);
    }
    if (data.catatan !== undefined) {
      updateFields.push(`catatan = $${paramCount++}`);
      updateValues.push(data.catatan || null);
    }
    if (data.id_user_pengawas !== undefined) {
      updateFields.push(`id_user_pengawas = $${paramCount++}`);
      updateValues.push(data.id_user_pengawas || null);
    }
    if (data.foto_path !== undefined) {
      updateFields.push(`foto_path = $${paramCount++}`);
      updateValues.push(data.foto_path || null);
    }

    // Add id_laporan sebagai parameter terakhir
    updateValues.push(id_laporan);

    if (updateFields.length === 0) {
      throw new Error("Tidak ada field untuk diupdate");
    }

    const query = `
      UPDATE laporan 
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id_laporan = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);
    
    if (result.rows.length === 0) {
      throw new Error(`Laporan dengan ID ${id_laporan} tidak ditemukan`);
    }

    console.log("✅ Laporan berhasil diupdate:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error updating laporan:", error);
    throw error;
  }
};

// ==================== AKTIVITAS ====================

export const findAllAktivitas = async (limit = 10) => {
  try {
    const result = await pool.query(`
      SELECT * FROM aktivitas
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  } catch (error) {
    console.error("Error finding all aktivitas:", error);
    throw error;
  }
};

export const createAktivitas = async (data) => {
  try {
    const result = await pool.query(`
      INSERT INTO aktivitas (
        id_user, nama_user, role_user, tipe_aktivitas, aksi,
        nama_entitas, id_entitas, detail, area_terkait, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.id_user,
      data.nama_user || null,
      data.role_user || null,
      data.tipe_aktivitas,
      data.aksi,
      data.nama_entitas || null,
      data.id_entitas || null,
      data.detail || null,
      data.area_terkait || null,
      data.status || 'selesai'
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating aktivitas:", error);
    throw error;
  }
};
