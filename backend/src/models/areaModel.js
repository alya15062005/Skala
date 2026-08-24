import pool from "../config/db.js";

const normalizeAreaStatus = (status) => {
  if (typeof status !== "string") return "aktif";
  const normalized = status.trim().toLowerCase();
  if (normalized === "nonaktif" || normalized === "non-aktif") return "non-aktif";
  return normalized === "aktif" ? "aktif" : status;
};

export const findAllArea = async () => {
  try {
    const result = await pool.query("SELECT id_ruangan as id_area, nama_ruangan as nama, lantai as deskripsi, status FROM ruangan ORDER BY nama_ruangan");
    return result.rows;
  } catch (error) {
    console.error("Error finding all area:", error);
    throw error;
  }
};

export const findAreaById = async (id) => {
  try {
    const result = await pool.query("SELECT id_ruangan as id_area, nama_ruangan as nama, lantai as deskripsi, status FROM ruangan WHERE id_ruangan = $1", [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding area by id:", error);
    throw error;
  }
};

export const createArea = async (data) => {
  try {
    const result = await pool.query(
      "INSERT INTO ruangan (nama_ruangan, lantai, status) VALUES ($1, $2, $3) RETURNING id_ruangan as id_area, nama_ruangan as nama, lantai as deskripsi, status",
      [data.nama, data.lantai || '1', normalizeAreaStatus(data.status)]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating area:", error);
    throw error;
  }
};

export const updateArea = async (id, data) => {
  try {
    const result = await pool.query(
      "UPDATE ruangan SET nama_ruangan = $1, lantai = $2, status = $3 WHERE id_ruangan = $4 RETURNING id_ruangan as id_area, nama_ruangan as nama, lantai as deskripsi, status",
      [data.nama, data.lantai || '1', normalizeAreaStatus(data.status), id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating area:", error);
    throw error;
  }
};

export const deleteArea = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM ruangan WHERE id_ruangan = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting area:", error);
    throw error;
  }
};