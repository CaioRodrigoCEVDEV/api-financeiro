import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

export async function ping() {
  const r = await pool.query("SELECT 1 as ok");
  return r.rows[0].ok === 1;
}
