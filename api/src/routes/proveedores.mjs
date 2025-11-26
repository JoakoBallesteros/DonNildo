import { Router } from "express";
import { pool } from "../db.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

// 👇 Todas las rutas de PROVEEDORES: solo ADMIN o COMPRAS
router.use(requireAuth, allowRoles(["ADMIN", "COMPRAS"]));

/* ============================
 * 1️⃣ Listar proveedores
 * GET /api/proveedores
 * ============================ */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_proveedor,
              cuit,
              nombre,
              contacto,
              direccion
       FROM proveedores
       ORDER BY nombre`
    );

    res.json({ ok: true, proveedores: rows });
  } catch (e) {
    console.error("Error al obtener proveedores:", e);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener proveedores." });
  }
});

/* ============================
 * 2️⃣ Obtener proveedor por ID
 * GET /api/proveedores/:id
 * ============================ */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ ok: false, message: "ID de proveedor inválido." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id_proveedor,
              cuit,
              nombre,
              contacto,
              direccion
       FROM proveedores
       WHERE id_proveedor = $1`,
      [id]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ ok: false, message: "Proveedor no encontrado." });
    }

    res.json({ ok: true, proveedor: rows[0] });
  } catch (e) {
    console.error("Error al obtener proveedor:", e);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener el proveedor." });
  }
});

/* ============================
 * 3️⃣ Crear proveedor
 * POST /api/proveedores
 * body: { cuit, nombre, contacto?, direccion? }
 * ============================ */
router.post("/", async (req, res) => {
  const { cuit, nombre, contacto, direccion } = req.body || {};

  if (!cuit || !nombre) {
    return res.status(400).json({
      ok: false,
      message: "CUIT y nombre son obligatorios.",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO proveedores (cuit, nombre, contacto, direccion)
       VALUES ($1, $2, $3, $4)
       RETURNING id_proveedor, cuit, nombre, contacto, direccion`,
      [cuit.trim(), nombre.trim(), contacto || null, direccion || null]
    );

    // 🔹 Auditoría
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "CREAR_PROVEEDOR",
        "PROVEEDORES",
        `Se creó el proveedor ${rows[0].nombre} (${rows[0].cuit}).`
      );
    } catch (errAud) {
      console.error("⚠️ Error auditando creación proveedor:", errAud.message);
    }

    res.status(201).json({ ok: true, proveedor: rows[0] });
  } catch (e) {
    console.error("Error al crear proveedor:", e);

    // CUIT duplicado
    if (e.code === "23505") {
      return res.status(400).json({
        ok: false,
        message: "El CUIT ya existe para otro proveedor.",
      });
    }

    res
      .status(500)
      .json({ ok: false, message: "Error al crear el proveedor." });
  }
});

/* ============================
 * 4️⃣ Modificar proveedor
 * PUT /api/proveedores/:id
 * ============================ */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ ok: false, message: "ID de proveedor inválido." });
  }

  const { cuit, nombre, contacto, direccion } = req.body || {};

  try {
    const { rows } = await pool.query(
      `UPDATE proveedores
       SET cuit      = COALESCE($1, cuit),
           nombre    = COALESCE($2, nombre),
           contacto  = COALESCE($3, contacto),
           direccion = COALESCE($4, direccion)
       WHERE id_proveedor = $5
       RETURNING id_proveedor, cuit, nombre, contacto, direccion`,
      [
        cuit ? cuit.trim() : null,
        nombre ? nombre.trim() : null,
        contacto ?? null,
        direccion ?? null,
        id,
      ]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ ok: false, message: "Proveedor no encontrado." });
    }

    // 🔹 Auditoría
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "MODIFICAR_PROVEEDOR",
        "PROVEEDORES",
        `Se modificó el proveedor ID ${id}.`
      );
    } catch (errAud) {
      console.error("⚠️ Error auditando modificación proveedor:", errAud.message);
    }

    res.json({ ok: true, proveedor: rows[0] });
  } catch (e) {
    console.error("Error al actualizar proveedor:", e);

    if (e.code === "23505") {
      return res.status(400).json({
        ok: false,
        message: "El CUIT ya existe para otro proveedor.",
      });
    }

    res
      .status(500)
      .json({ ok: false, message: "Error al actualizar el proveedor." });
  }
});

/* ============================
 * 5️⃣ Eliminar proveedor
 * DELETE /api/proveedores/:id
 * ============================ */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ ok: false, message: "ID de proveedor inválido." });
  }

  try {
    const { rowCount } = await pool.query(
      "DELETE FROM proveedores WHERE id_proveedor = $1",
      [id]
    );

    if (!rowCount) {
      return res
        .status(404)
        .json({ ok: false, message: "Proveedor no encontrado." });
    }

    // 🔹 Auditoría
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "ELIMINAR_PROVEEDOR",
        "PROVEEDORES",
        `Se eliminó el proveedor ID ${id}.`
      );
    } catch (errAud) {
      console.error("⚠️ Error auditando eliminación proveedor:", errAud.message);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("Error al eliminar proveedor:", e);

    // FK: tiene compras asociadas
    if (e.code === "23503") {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede eliminar el proveedor porque tiene compras asociadas.",
      });
    }

    res
      .status(500)
      .json({ ok: false, message: "Error al eliminar el proveedor." });
  }
});

export default router;
