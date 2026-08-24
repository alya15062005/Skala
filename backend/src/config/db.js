import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const requiredEnvVars = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "DB_PORT"];
// Treat variables as present if defined (allow empty string for DB_PASSWORD)
const missingVars = requiredEnvVars.filter(varName => typeof process.env[varName] === 'undefined');

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars.join(", "));
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: parseInt(process.env.DB_PORT, 10),
  waitForConnections: true,
  connectionLimit: 10,
});

// Compatibility wrapper: convert Postgres-style $1 placeholders to ? for MySQL
const query = async (sql, params = []) => {
  // Detect RETURNING clause (Postgres style) and extract requested columns
  const returningMatch = sql.match(/\bRETURNING\b\s+([\s\S]*?)$/i);
  let returningCols = null;
  if (returningMatch) {
    returningCols = returningMatch[1].trim().replace(/;$/, '');
    // remove RETURNING part from SQL before executing on MySQL
    sql = sql.replace(/\bRETURNING\b[\s\S]*$/i, '');
  }

  // Convert Postgres $1 placeholders to MySQL ? and build a params array
  const paramOrder = [];
  const convertedSql = sql.replace(/\$(\d+)/g, (_, num) => {
    paramOrder.push(Number(num));
    return '?';
  });
  const execParams = paramOrder.length > 0 ? paramOrder.map(i => params[i - 1]) : params;
  const [result] = await pool.query(convertedSql, execParams);

  // If caller wanted RETURNING, emulate it using insertId + SELECT
  if (returningCols) {
    const insertId = result && result.insertId ? result.insertId : null;
    // try to determine table name from INSERT INTO statement
    const insertMatch = convertedSql.match(/INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?/i);
    if (insertId && insertMatch) {
      const table = insertMatch[1];
      // take column names from returningCols (comma separated)
      const cols = returningCols.split(',').map(c => c.trim().split(/\s+/)[0].replace(/[`"']/g, ''));
      // choose a primary key candidate (first col that starts with id_ or first col)
      const pk = cols.find(c => /^id_/i.test(c)) || cols[0];
      try {
        const selectSql = `SELECT ${cols.join(', ')} FROM \`${table}\` WHERE \`${pk}\` = ?`;
        const [rows] = await pool.query(selectSql, [insertId]);
        return { rows };
      } catch (err) {
        // If select fails, return empty rows so callers can handle it
        return { rows: [] };
      }
    }
    return { rows: [] };
  }

  // Normalize result: SELECT returns array rows, non-SELECT returns OkPacket
  if (Array.isArray(result)) return { rows: result };
  return { rows: [] };
};

export default { query, pool };