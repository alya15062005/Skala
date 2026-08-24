import pool from "../config/db.js";

export const ensureUserStatusColumn = async () => {
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'aktif'"
    );
  } catch (error) {
    console.error("Error ensuring users.status column:", error);
    throw error;
  }
};

export const findUserByUsername = async (username) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE TRIM(username) = $1 OR TRIM(email) = $1",
      [username]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE id_user = $1",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

export const createUser = async (username, password, nama_lengkap = null, role = "user", status = "aktif", email = null) => {
  try {
    const result = await pool.query(
      "INSERT INTO users (username, password, nama_lengkap, role, status, email) VALUES ($1, $2, $3, $4, COALESCE($5, 'aktif'), $6) RETURNING id_user, username, nama_lengkap, role, status, email",
      [username, password, nama_lengkap, role, status, email]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const setFields = [];
    const values = [];
    let idx = 1;

    if (data.username !== undefined) {
      setFields.push(`username = $${idx++}`);
      values.push(data.username);
    }
    if (data.email !== undefined) {
      setFields.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.password !== undefined) {
      setFields.push(`password = $${idx++}`);
      values.push(data.password);
    }
    if (data.nama_lengkap !== undefined) {
      setFields.push(`nama_lengkap = $${idx++}`);
      values.push(data.nama_lengkap);
    }
    if (data.role !== undefined) {
      setFields.push(`role = $${idx++}`);
      values.push(data.role);
    }
    if (data.status !== undefined) {
      setFields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.foto !== undefined) {
      setFields.push(`foto = $${idx++}`);
      values.push(data.foto);
    }

    if (setFields.length === 0) {
      return findUserById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${setFields.join(", ")} WHERE id_user = $${idx} RETURNING id_user, username, nama_lengkap, role, status, email, foto`,
      values
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await pool.query("DELETE FROM users WHERE id_user = $1", [id]);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const result = await pool.query(
      "SELECT id_user, username, email, nama_lengkap, role, COALESCE(status, 'aktif') AS status, foto FROM users"
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

export const countActiveAdmins = async () => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND COALESCE(status, 'aktif') = 'aktif'"
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error counting active admins:", error);
    throw error;
  }
};
