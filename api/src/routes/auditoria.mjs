// api/src/routes/auditoria.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

// Solo ADMIN puede ver auditoría
router.get("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const query = `
      SELECT 
          a.id_auditoria AS id,
          a.evento AS tipo,
          a.fecha_hora AS fecha,
          a.modulo,
          a.descripcion AS detalle,
          u.mail AS usuario,
          'N/A' AS ip
      FROM auditoria a
      LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
      ORDER BY a.fecha_hora DESC;
    `;
    const { rows: eventos } = await pool.query(query);

    res.json({ eventos });
  } catch (e) {
    console.error("Error al obtener auditoría:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;