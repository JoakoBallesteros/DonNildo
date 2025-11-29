import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";
import { registrarAuditoria, getUserIdFromToken } from "../utils/auditoriaService.mjs";

const router = Router();

// ============================
// GET /api/reportes
// ============================
router.get("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const query = `
      SELECT 
        id_reporte,
        codigo,
        tipo,
        producto,
        fecha_desde,
        fecha_hasta,
        cantidad_unidad,
        monto_total,
        fecha_generacion
      FROM reportes
      ORDER BY fecha_generacion DESC
      LIMIT 50;
    `;
    const { rows } = await pool.query(query);
    res.json({ reportes: rows });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

// ============================
// GET productos por tipo
// ============================
router.get("/productos", async (req, res) => {
  try {
    const tipo = req.query.tipo;

    let query = "";

    if (tipo === "Compras") {
      query = `
        SELECT DISTINCT p.id_producto, p.nombre
        FROM detalle_compra dc
        JOIN productos p ON p.id_producto = dc.id_producto
        ORDER BY p.nombre;
      `;
    } else if (tipo === "Ventas") {
      query = `
        SELECT DISTINCT p.id_producto, p.nombre
        FROM detalle_venta dv
        JOIN productos p ON p.id_producto = dv.id_producto
        ORDER BY p.nombre;
      `;
    } else {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    const { rows } = await pool.query(query);
    res.json({ productos: rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================
// POST /api/reportes
// ============================
// ============================
// POST /api/reportes
// ============================
router.post("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("\n🔥 NUEVO REPORTE");
    console.log("Body:", req.body);

    const { tipo, id_producto, fecha_desde, fecha_hasta } = req.body || {};

    if (!tipo || !id_producto || !fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: { message: "Faltan datos obligatorios para el reporte." },
      });
    }

    const sql = `SELECT * FROM generar_reporte_transaccional($1,$2,$3,$4);`;

    const result = await client.query(sql, [
      tipo,
      id_producto,
      fecha_desde,
      fecha_hasta,
    ]);

    console.log("\nRAW SQL:", result.rows);

    if (result.rows.length === 0)
      return res.status(500).json({ error: { message: "Sin resultados" } });

    const raw = result.rows[0];

    const reporte = {
      id_reporte: raw.reporte_id,
      codigo: raw.reporte_codigo,
      tipo: raw.reporte_tipo,
      id_producto: raw.reporte_id_producto,
      producto: raw.reporte_producto,
      fecha_desde: raw.reporte_fecha_desde,
      fecha_hasta: raw.reporte_fecha_hasta,
      cantidad_unidad: raw.reporte_cantidad,
      monto_total: raw.reporte_monto_total,
      fecha_generacion: raw.reporte_fecha_generado,
    };

    console.log("\n📤 REPORTE MAPEADO:");
    console.log(reporte);

    return res.json({ success: true, reporte });

  } catch (err) {
    console.error("ERROR:", err);

    const msg = String(err.message || "");

    if (msg.includes("SIN_DATOS_REPORTE"))
      return res.status(400).json({
        error: { message: "No hay datos en ese rango para ese producto." },
      });

    return res.status(500).json({ error: { message: msg } });

  } finally {
    client.release();
  }
});

// ============================
// DELETE /api/reportes
// ============================
router.delete("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: { message: "No se enviaron ids para eliminar." } });
    }

    await client.query("BEGIN");

    const sql = `DELETE FROM reportes WHERE id_reporte = ANY($1::int[]) RETURNING id_reporte`;
    const { rows } = await client.query(sql, [ids]);

    await client.query("COMMIT");

    // registrar auditoría
    const token = req.headers.authorization?.split(" ")[1];
    const userId = await getUserIdFromToken(token);
    await registrarAuditoria(userId, "BORRAR_REPORTES", "Reportes", `Eliminados: ${rows.map(r => r.id_reporte).join(",")}`);

    return res.json({ success: true, deleted: rows.length, deletedIds: rows.map(r => r.id_reporte) });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR BORRAR REPORTES:", error);
    return res.status(500).json({ error: { message: String(error.message || "Error interno") } });
  } finally {
    client.release();
  }
});


export default router;