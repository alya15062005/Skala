const pkg = require('pg');
const dotenv = require('dotenv');
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: parseInt(process.env.DB_PORT,10) });
pool.query("SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'tugas'::regclass;").then(res=>{ console.log(JSON.stringify(res.rows,null,2)); pool.end(); }).catch(err=>{ console.error(err); pool.end(); process.exit(1); });
