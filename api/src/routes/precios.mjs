import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";

const router = Router();
router.use(requireAuth);

/* ============================
 * 1. Obtener cotización Dólar (DolarAPI)
 * GET /api/v1/precios/dolar
 * ============================ */
router.get("/dolar", async (req, res) => {
  try {
    // Usamos DolarAPI (pública, sin key)
    const resp = await fetch("https://dolarapi.com/v1/dolares");
    if (!resp.ok) throw new Error("Error fetching dolar API");
    const dolares = await resp.json();
    
    // Devolvemos los principales: Oficial, Blue, MEP, CCL
    const filtro = dolares.filter(d => ["Oficial", "Blue", "Bolsa", "Contado con liquidación"].includes(d.nombre));
    
    res.json({ ok: true, dolares: filtro });
  } catch (e) {
    console.error("Error al obtener cotización del dólar:", e);
    res.status(500).json({ ok: false, message: "No se pudo obtener la cotización." });
  }
});

/* ============================
 * 2. CRUD Listas de Precios
 * ============================ */
router.get("/listas", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM listas_precios ORDER BY id_lista ASC`);
    res.json({ ok: true, listas: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Error al obtener listas." });
  }
});

router.post("/listas", async (req, res) => {
  const { nombre, descripcion, porcentaje_variacion, moneda } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO listas_precios (nombre, descripcion, porcentaje_variacion, moneda)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, descripcion, porcentaje_variacion || 0, moneda || 'ARS']
    );
    res.status(201).json({ ok: true, lista: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Error al crear lista de precios." });
  }
});

router.put("/listas/:id", async (req, res) => {
  const { nombre, descripcion, porcentaje_variacion, moneda, estado } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE listas_precios SET
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         porcentaje_variacion = COALESCE($3, porcentaje_variacion),
         moneda = COALESCE($4, moneda),
         estado = COALESCE($5, estado),
         updated_at = now()
       WHERE id_lista = $6 RETURNING *`,
      [nombre, descripcion, porcentaje_variacion, moneda, estado, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Lista no encontrada" });
    
    res.json({ ok: true, lista: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Error al actualizar lista." });
  }
});

export default router;
