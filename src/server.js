import express from "express";
import cors from "cors";
import { pool, ping } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/health", async (_req, res) => {
  try {
    const ok = await ping();
    res.json({ status: ok ? "ok" : "down" });
  } catch (e) {
    res.status(500).json({ status: "down", error: e.message });
  }
});

// ============ Clientes ============
app.get("/clientes", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, nome, email, mensalidade, data_inicio FROM clientes ORDER BY criado_em DESC"
  );
  res.json(rows);
});

app.post("/clientes", async (req, res) => {
  const { nome, email, mensalidade, data_inicio } = req.body;
  if (!nome) return res.status(400).json({ error: "nome é obrigatório" });
  const q = `INSERT INTO clientes (nome, email, mensalidade, data_inicio)
             VALUES ($1,$2,COALESCE($3,0),COALESCE($4,CURRENT_DATE)) RETURNING *`;
  const { rows } = await pool.query(q, [nome, email || null, mensalidade, data_inicio]);
  res.status(201).json(rows[0]);
});

app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const allowed = ["nome", "email", "mensalidade", "data_inicio"];
  const fields = [];
  const values = [];
  let i = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) { fields.push(`${k}=$${i++}`); values.push(v); }
  }
  if (!fields.length) return res.status(400).json({ error: "nada para atualizar" });
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE clientes SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`, values);
  if (!rows[0]) return res.status(404).json({ error: "não encontrado" });
  res.json(rows[0]);
});

// ============ Domínios ============
app.get("/dominios", async (req, res) => {
  const { cliente_id } = req.query;
  const params = [];
  let where = "";
  if (cliente_id) { params.push(cliente_id); where = "WHERE cliente_id=$1"; }
  const q = `SELECT id, cliente_id, dominio, ativo, valor_anual, data_compra, criado_em
             FROM dominios ${where} ORDER BY criado_em DESC`;
  const { rows } = await pool.query(q, params);
  res.json(rows);
});

app.post("/dominios", async (req, res) => {
  const { cliente_id, dominio, ativo, valor_anual, data_compra } = req.body;
  if (!cliente_id || !dominio)
    return res.status(400).json({ error: "cliente_id e dominio são obrigatórios" });
  const q = `INSERT INTO dominios (cliente_id, dominio, ativo, valor_anual, data_compra)
             VALUES ($1,$2,COALESCE($3,true),COALESCE($4,0),COALESCE($5,CURRENT_DATE))
             RETURNING *`;
  const { rows } = await pool.query(q, [cliente_id, dominio, ativo, valor_anual, data_compra]);
  res.status(201).json(rows[0]);
});

// ============ Lançamentos ============
function toDbTipo(frontTipo) {
  if (!frontTipo) return null;
  const t = String(frontTipo).toLowerCase();
  return t === "receita" ? "E" : t === "despesa" ? "S" : null;
}
function fromDbTipo(dbTipo) {
  return dbTipo === "E" ? "receita" : dbTipo === "S" ? "despesa" : dbTipo;
}

app.get("/lancamentos", async (req, res) => {
  const { user_id, limit } = req.query;
  const lim = Math.min(Number(limit) || 100, 1000);
  const params = [];
  let where = "";
  if (user_id) { params.push(user_id); where = "WHERE user_id=$1"; }
  const q = `SELECT id, user_id, descricao, valor, data, tipo, categoria
             FROM lancamentos ${where}
             ORDER BY data DESC, id DESC LIMIT ${lim}`;
  const { rows } = await pool.query(q, params);
  // mapeia tipo para front
  res.json(rows.map(r => ({ ...r, tipo: fromDbTipo(r.tipo) })));
});

app.post("/lancamentos", async (req, res) => {
  let { user_id, descricao, valor, data, tipo, categoria } = req.body;
  const dbTipo = toDbTipo(tipo);
  if (!user_id || !dbTipo)
    return res.status(400).json({ error: "user_id e tipo (receita|despesa) são obrigatórios" });
  if (valor != null && isNaN(Number(valor)))
    return res.status(400).json({ error: "valor deve ser numérico" });

  const q = `INSERT INTO lancamentos (user_id, descricao, valor, data, tipo, categoria)
             VALUES ($1,$2,COALESCE($3,0),COALESCE($4,CURRENT_DATE),$5,$6)
             RETURNING id, user_id, descricao, valor, data, tipo, categoria`;
  const { rows } = await pool.query(q, [user_id, descricao ?? null, valor ?? null, data ?? null, dbTipo, categoria ?? null]);
  const r = rows[0]; r.tipo = fromDbTipo(r.tipo);
  res.status(201).json(r);
});

// 404
app.use((_req, res) => res.status(404).json({ error: "rota não encontrada" }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 API on http://caio.vps-kinghost.net:${PORT}`);
});
