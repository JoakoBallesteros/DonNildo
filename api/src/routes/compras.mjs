// api/src/routes/compras.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

// Todas las rutas protegidas
// Solo pueden usarlas ADMIN o COMPRAS
router.use(requireAuth, allowRoles(["ADMIN", "COMPRAS"]));

/* ============================================
 * GET /api/compras  → listado de compras
 * (montado en server como /api/v1/compras)
 * ============================================ */
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        oc.id_compra,
        COALESCE(p.nombre, '—') AS proveedor_nombre,
        oc.total,
        oc.fecha,
        oc.observaciones,
        oc.estado,
        -- Clasificación visual del tipo
        CASE
          WHEN COUNT(DISTINCT tp.nombre) > 1 THEN 'Mixtas'
          WHEN MAX(tp.nombre) = 'Producto terminado' THEN 'Cajas'
          ELSE 'Materiales'
        END AS tipo_compra,
        COALESCE(
          json_agg(
            json_build_object(
              'producto', prod.nombre,
              'medida', m.simbolo,
              'cantidad', dc.cantidad,
              'precio', dc.precio_unitario,
              'descuento', 0,
              'subtotal', dc.subtotal
            )
            ORDER BY dc.id_detalle
          ) FILTER (WHERE dc.id_detalle IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orden_compra oc
      LEFT JOIN proveedores p   ON p.id_proveedor     = oc.id_proveedor
      LEFT JOIN detalle_compra dc ON dc.id_compra     = oc.id_compra
      LEFT JOIN productos prod  ON prod.id_producto   = dc.id_producto
      LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = prod.id_tipo_producto
      LEFT JOIN medida m        ON m.id_medida        = prod.id_medida
      GROUP BY oc.id_compra, p.nombre, oc.total, oc.fecha, oc.observaciones, oc.estado
      ORDER BY oc.fecha DESC, oc.id_compra DESC;
    `;

    const { rows } = await pool.query(sql);

    return res.json({
      ok: true,
      compras: rows,
    });
  } catch (err) {
    console.error("Error en GET /api/compras:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener compras",
      detail: err.message,
    });
  }
});

/* ============================================
 * GET /api/compras/productos  → catálogo
 * ============================================ */
router.get("/productos", async (req, res) => {
  try {
    const sql = `
      SELECT
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_unitario,
        p.id_tipo_producto,
        p.id_categoria,
        p.id_medida,
        tp.nombre AS tipo_nombre,
        c.nombre  AS categoria_nombre,
        m.simbolo AS medida_simbolo,
        m.nombre  AS medida_nombre
      FROM productos p
      LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = p.id_tipo_producto
      LEFT JOIN categoria c      ON c.id_categoria      = p.id_categoria
      LEFT JOIN medida m         ON m.id_medida         = p.id_medida
      WHERE p.estado = TRUE
      ORDER BY p.nombre;
    `;

    const { rows } = await pool.query(sql);

    return res.json({
      ok: true,
      productos: rows,
    });
  } catch (err) {
    console.error("Error en GET /api/compras/productos:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener productos",
      detail: err.message,
    });
  }
});

/* ============================================
 * GET /api/compras/proveedores  → catálogo
 * ============================================ */
router.get("/proveedores", async (req, res) => {
  try {
    const sql = `
      SELECT
        id_proveedor,
        cuit,
        nombre,
        contacto,
        direccion
      FROM proveedores
      ORDER BY nombre;
    `;

    const { rows } = await pool.query(sql);

    return res.json({
      ok: true,
      proveedores: rows,
    });
  } catch (err) {
    console.error("Error en GET /api/compras/proveedores:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener proveedores",
      detail: err.message,
    });
  }
});

/* ============================================
 * POST /api/compras  → registrar compra
 * ============================================ */
router.post("/", async (req, res) => {
  try {
    const { id_proveedor, fecha, observaciones, items } = req.body || {};

    // ---- Validaciones básicas ----
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Debes enviar al menos un ítem en la compra.",
      });
    }

    // Normalizamos id_proveedor:
    const provId =
      id_proveedor !== undefined &&
      id_proveedor !== null &&
      !Number.isNaN(Number(id_proveedor))
        ? Number(id_proveedor)
        : null;

    // ---- Normalizamos y validamos ítems ----
    let itemsForDb;
    try {
      itemsForDb = items.map((it, idx) => {
        const id_producto = Number(it.id_producto);
        const cantidad = Number(it.cantidad);
        const precio_unitario = Number(it.precio_unitario);

        if (!Number.isInteger(id_producto) || id_producto <= 0) {
          throw new Error(`Ítem ${idx + 1}: id_producto inválido`);
        }
        if (Number.isNaN(cantidad) || cantidad <= 0) {
          throw new Error(`Ítem ${idx + 1}: cantidad inválida`);
        }
        if (Number.isNaN(precio_unitario) || precio_unitario <= 0) {
          throw new Error(`Ítem ${idx + 1}: precio_unitario inválido`);
        }

        return { id_producto, cantidad, precio_unitario };
      });
    } catch (valErr) {
      return res.status(400).json({
        ok: false,
        message: valErr.message,
      });
    }

    const itemsJson = JSON.stringify(itemsForDb);

    console.log("▶ POST /api/compras body normalizado:", {
      provId,
      fecha,
      observaciones,
      itemsForDb,
    });

    const sql = `
      SELECT id_compra_ret, total_ret, estado_ret
      FROM registrar_compra_transaccional(
        $1::int,
        $2::date,
        $3::text,
        $4::jsonb
      );
    `;

    const { rows } = await pool.query(sql, [
      provId,
      fecha || null,
      observaciones || null,
      itemsJson,
    ]);

    if (!rows || rows.length === 0) {
      return res.status(500).json({
        ok: false,
        message:
          "La función registrar_compra_transaccional no devolvió resultados.",
      });
    }

    const result = rows[0];
    console.log("✅ Compra registrada en DB:", result);

    // Auditoría
    try {
      const userId = await getUserIdFromToken(req.accessToken);
      await registrarAuditoria(
        userId,
        "REGISTRAR_COMPRA",
        "COMPRAS",
        `Compra ${result.id_compra_ret} registrada por $${result.total_ret}`
      );
    } catch (errAud) {
      console.error("Error registrando auditoría de compra:", errAud.message);
    }

    return res.status(201).json({
      ok: true,
      id_compra: result.id_compra_ret,
      total: result.total_ret,
      estado: result.estado_ret,
    });
  } catch (err) {
    console.error("❌ Error en POST /api/compras:", err);

    return res.status(500).json({
      ok: false,
      message: "Error al registrar la compra",
      detail: err.message,
      dbDetail: err.detail ?? null,
      code: err.code ?? null,
      where: err.where ?? null,
    });
  }
});

router.put("/:id/anular", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "ID de compra inválido" });
  }

  try {
    // 1) Actualizar la compra en la DB (ajustá el estado según tu modelo)
    const { rows } = await pool.query(
      `
      UPDATE orden_compra
      SET estado = 'ANULADA'
      WHERE id_compra = $1
      RETURNING id_compra, total, estado;
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "Compra no encontrada" });
    }

    const compra = rows[0];

    // 2) Auditoría
    try {
      const userId = await getUserIdFromToken(req.accessToken);
      await registrarAuditoria(
        userId,
        "ANULAR_COMPRA",
        "COMPRAS",
        `Compra ${compra.id_compra} anulada (estado=${compra.estado})`
      );
    } catch (errAud) {
      console.error("Error registrando auditoría de anulación:", errAud.message);
    }

    return res.json({ ok: true, compra });
  } catch (err) {
    console.error("❌ Error en PUT /api/compras/:id/anular:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al anular la compra",
      detail: err.message,
    });
  }
});

/* ============================================
 * PUT /api/compras/:id  → modificar compra
 * ============================================ */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { observaciones, fecha } = req.body; // o lo que quieras permitir modificar

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "ID de compra inválido" });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE orden_compra
      SET
        observaciones = COALESCE($2, observaciones),
        fecha         = COALESCE($3, fecha)
      WHERE id_compra = $1
      RETURNING id_compra, total, estado;
      `,
      [id, observaciones ?? null, fecha ?? null]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "Compra no encontrada" });
    }

    const compra = rows[0];

    // Auditoría
    try {
      const userId = await getUserIdFromToken(req.accessToken);
      await registrarAuditoria(
        userId,
        "MODIFICAR_COMPRA",
        "COMPRAS",
        `Compra ${compra.id_compra} modificada`
      );
    } catch (errAud) {
      console.error("Error registrando auditoría de modificación:", errAud.message);
    }

    return res.json({ ok: true, compra });
  } catch (err) {
    console.error("❌ Error en PUT /api/compras/:id:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al modificar la compra",
      detail: err.message,
    });
  }
});


export default router;
