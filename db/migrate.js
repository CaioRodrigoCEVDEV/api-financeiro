import { readFileSync } from "fs";
import { pool } from "../src/db.js";

async function migrate() {
  const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migração aplicada com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro na migração:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit());
