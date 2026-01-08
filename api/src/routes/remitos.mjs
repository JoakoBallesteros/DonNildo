// api/src/routes/remitos_v.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";

const router = Router();

/* ============================
   GET /api/v1/remitos_v
   ============================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        rv.id_remito,
        rv.id_venta,
        rv.fecha,
        rv.observaciones,
        v.total,
        v.observaciones AS obs_venta
      FROM remitos_v rv
      JOIN venta v ON v.id_venta = rv.id_venta
      ORDER BY rv.id_remito DESC
    `);

    res.json({ ok: true, remitos: rows });
  } catch (err) {
    console.error("Error obteniendo remitos_v:", err);
    res.status(500).json({ ok: false, message: "Error al obtener remitos de venta" });
  }
});


/* ============================
   GET /api/v1/remitos_v/:id
   (Detalle del remito con productos)
   ============================ */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const remito = await pool.query(`
      SELECT 
        rv.id_remito,
        rv.fecha,
        rv.observaciones,
        v.id_venta,
        v.total
      FROM remitos_v rv
      JOIN venta v ON v.id_venta = rv.id_venta
      WHERE rv.id_remito = $1
    `, [id]);

    if (remito.rows.length === 0)
      return res.status(404).json({ ok: false, message: "Remito no encontrado" });

    const productos = await pool.query(`
      SELECT 
        dv.id_producto,
        p.nombre AS producto,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        COALESCE(m.simbolo, 'u') AS medida
      FROM detalle_venta dv
      JOIN productos p ON p.id_producto = dv.id_producto
      LEFT JOIN medida m ON m.id_medida = p.id_medida
      WHERE dv.id_venta = $1
    `, [remito.rows[0].id_venta]);

    res.json({
      ok: true,
      remito: remito.rows[0],
      productos: productos.rows
    });

  } catch (err) {
    console.error("Error detalle remito_v:", err);
    res.status(500).json({ ok: false, message: "Error al obtener detalle" });
  }
});


/* ============================
   POST /api/v1/remitos_v
   ============================ */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { id_venta, fecha, observaciones } = req.body;

    if (!id_venta)
      return res.status(400).json({ ok: false, message: "Falta id_venta" });

    const { rows } = await pool.query(`
      INSERT INTO remitos_v (id_venta, fecha, observaciones)
      VALUES ($1, $2, $3)
      RETURNING id_remito
    `, [
      id_venta,
      fecha ?? new Date(),
      observaciones ?? null
    ]);

    res.json({ ok: true, id_remito: rows[0].id_remito });

  } catch (err) {
    console.error("Error creando remito_v:", err);
    res.status(500).json({ ok: false, message: "Error al crear remito" });
  }
});


/* ============================
   DELETE /api/v1/remitos_v
   ============================ */
router.delete("/", requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids?.length)
      return res.status(400).json({ ok: false, message: "No hay remitos para borrar" });

    await pool.query(`
      DELETE FROM remitos_v
      WHERE id_remito = ANY($1::int[])
    `, [ids]);

    res.json({ ok: true, message: "Remitos eliminados" });

  } catch (err) {
    console.error("Error eliminando remitos_v:", err);
    res.status(500).json({ ok: false, message: "Error al eliminar remitos" });
  }
});

export default router;
