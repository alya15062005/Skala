import pool from "../config/db.js";

export const findAllShift = async () => {
  try {
    const result = await pool.query("SELECT * FROM shift ORDER BY jam_mulai");
    return result.rows;
  } catch (error) {
    console.error("Error finding all shift:", error);
    throw error;
  }
};

export const findShiftById = async (id) => {
  try {
    const result = await pool.query("SELECT * FROM shift WHERE id_shift = $1", [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding shift by id:", error);
    throw error;
  }
};

export const createShift = async (data) => {
  try {
    const result = await pool.query(
      "INSERT INTO shift (nama_shift, jam_mulai, jam_selesai) VALUES ($1, $2, $3) RETURNING *",
      [data.nama_shift, data.jam_mulai, data.jam_selesai]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating shift:", error);
    throw error;
  }
};

export const updateShift = async (id, data) => {
  try {
    const result = await pool.query(
      "UPDATE shift SET nama_shift = $1, jam_mulai = $2, jam_selesai = $3 WHERE id_shift = $4 RETURNING *",
      [data.nama_shift, data.jam_mulai, data.jam_selesai, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating shift:", error);
    throw error;
  }
};

export const deleteShift = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM shift WHERE id_shift = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting shift:", error);
    throw error;
  }
};