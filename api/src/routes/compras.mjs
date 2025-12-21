import { Router } from "express";
import { pool } from "../db.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

router.use(requireAuth, allowRoles(["ADMIN", "COMPRAS"]));

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        oc.id_compra,
        p.nombre AS proveedor_nombre,
        oc.total,
        oc.fecha,
        oc.observaciones,
        e.nombre AS estado,

        CASE
          WHEN MIN(tp.id_tipo_producto) = MAX(tp.id_tipo_producto)
            THEN CASE
                   WHEN MIN(tp.id_tipo_producto) = 1 THEN 'Cajas'
                   WHEN MIN(tp.id_tipo_producto) = 2 THEN 'Materiales'
                   ELSE 'Otros'
                 END
          ELSE 'Mixtas'
        END AS tipo_compra,

        json_agg(
          json_build_object(
            'producto', prod.nombre,
            'medida', m.simbolo,
            'cantidad', dc.cantidad,
            'precio', dc.precio_unitario,
            'subtotal', dc.subtotal
          )
          ORDER BY dc.id_detalle
        ) FILTER (WHERE dc.id_detalle IS NOT NULL) AS items

      FROM orden_compra oc
      LEFT JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      LEFT JOIN detalle_compra dc ON dc.id_compra = oc.id_compra
      LEFT JOIN productos prod ON prod.id_producto = dc.id_producto
      LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = prod.id_tipo_producto
      LEFT JOIN medida m ON m.id_medida = prod.id_medida
      LEFT JOIN estado e ON e.id_estado = oc.id_estado

      GROUP BY oc.id_compra, p.nombre, oc.total, oc.fecha, oc.observaciones, e.nombre
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

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({
      ok: false,
      message: "ID de compra inválido.",
    });
  }

  try {
    const cabeceraSql = `
      SELECT
        oc.id_compra,
        oc.id_proveedor,
        p.nombre AS proveedor_nombre,
        oc.total,
        oc.fecha,
        oc.observaciones
      FROM orden_compra oc
      LEFT JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      WHERE oc.id_compra = $1
      LIMIT 1;
    `;

    const { rows: compraRows } = await pool.query(cabeceraSql, [id]);

    if (compraRows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Compra no encontrada.",
      });
    }

    const compra = compraRows[0];

    const detallesSql = `
      SELECT
        dc.id_producto,
        prod.nombre AS producto,
        tp.nombre AS tipo_producto,
        dc.cantidad,
        dc.precio_unitario,
        dc.subtotal,
        COALESCE(m.simbolo, 'u') AS medida
      FROM detalle_compra dc
      JOIN productos prod ON prod.id_producto = dc.id_producto
      LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = prod.id_tipo_producto
      LEFT JOIN medida m ON m.id_medida = prod.id_medida
      WHERE dc.id_compra = $1
      ORDER BY dc.id_detalle;
    `;

    const { rows: itemsRows } = await pool.query(detallesSql, [id]);

    const items = itemsRows.map((r) => ({
      id_producto: r.id_producto,
      producto: r.producto,
      tipo: r.tipo_producto,
      cantidad: Number(r.cantidad),
      precio_unitario: Number(r.precio_unitario),
      precio: Number(r.precio_unitario),
      subtotal: Number(r.subtotal),
      medida: r.medida,
      descuento: 0,
    }));

    return res.json({
      ok: true,
      compra,
      items,
    });
  } catch (err) {
    console.error("Error en GET /api/compras/:id:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener la compra.",
      detail: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id_proveedor, fecha, observaciones, items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Debes enviar al menos un ítem en la compra.",
      });
    }

    const provId =
      id_proveedor !== undefined &&
      id_proveedor !== null &&
      !Number.isNaN(Number(id_proveedor))
        ? Number(id_proveedor)
        : null;

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

    console.log("POST /api/compras body normalizado:", {
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
    console.log("Compra registrada en DB:", result);

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
    console.error("Error en POST /api/compras:", err);

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
    return res.status(400).json({
      ok: false,
      message: "ID de compra inválido",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: estRows } = await client.query(
      `SELECT id_estado FROM estado WHERE nombre = 'ANULADO' LIMIT 1`
    );
    if (!estRows.length) {
      throw new Error("Configuración faltante: estado 'ANULADO'");
    }
    const idEstadoAnulado = estRows[0].id_estado;

    const { rows: movRows } = await client.query(
      `SELECT id_tipo_movimiento
         FROM tipo_movimiento
        WHERE nombre = 'SALIDA'
        LIMIT 1`
    );
    if (!movRows.length) {
      throw new Error("Configuración faltante: tipo_movimiento 'SALIDA'");
    }
    const idTipoMovSalida = movRows[0].id_tipo_movimiento;

    const { rows: detalles } = await client.query(
      `
      SELECT id_producto, cantidad
        FROM detalle_compra
       WHERE id_compra = $1
      `,
      [id]
    );
    if (!movRows.length) throw new Error("Movimiento SALIDA no configurado.");
    const idTipoSalida = movRows[0].id_tipo_movimiento;

    if (!detalles.length) {
      console.warn(`[COMPRAS] Compra ${id} sin detalle; se anula solo cabecera`);
    }

    for (const det of detalles) {
      const cantNum = Number(det.cantidad) || 0;
      if (cantNum <= 0) continue;

      await client.query(
        `
        UPDATE stock
           SET cantidad = cantidad - $1,
               fecha_ultima_actualiza = now()
         WHERE id_producto = $2
      `,
        [cantNum, det.id_producto]
      );

      await client.query(
        `
        INSERT INTO movimientos_stock (
          id_producto,
          id_tipo_movimiento,
          cantidad,
          fecha,
          unidad,
          precio_kg,
          subtotal,
          observaciones
        )
        VALUES (
          $1,
          $2,
          $3,
          now(),
          NULL,
          NULL,
          NULL,
          $4
        )
      `,
        [det.id_producto, idTipoMovSalida, cantNum, `Anulación Compra N°${id}`]
      );
    }

    await client.query(
      `
      UPDATE orden_compra
         SET id_estado = $1,
             observaciones = COALESCE(observaciones, '') ||
               E'\n-- ANULADA: ' || now()
       WHERE id_compra = $2
    `,
      [idEstadoAnulado, id]
    );

    try {
      const userId = await getUserIdFromToken(req.accessToken);
      await registrarAuditoria(
        userId,
        "ANULAR_COMPRA",
        "COMPRAS",
        `Compra ${id} anulada. Stock ajustado con SALIDA.`
      );
    } catch (errAud) {
      console.error(
        "Error registrando auditoría de anulación:",
        errAud.message
      );
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: `Compra ${id} anulada y stock actualizado.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en PUT /api/compras/:id/anular:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al anular compra",
      detail: err.message,
    });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { items, observaciones, id_proveedor, fecha } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, message: "ID de compra inválido" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Debe enviar al menos un producto para modificar la compra",
    });
  }

  const provId =
    id_proveedor !== undefined &&
    id_proveedor !== null &&
    !Number.isNaN(Number(id_proveedor))
      ? Number(id_proveedor)
      : null;

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
    return res.status(400).json({ ok: false, message: valErr.message });
  }

  const itemsJson = JSON.stringify(itemsForDb);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE orden_compra
         SET id_proveedor = $2,
             fecha = COALESCE($3::date, fecha),
             observaciones = $4
       WHERE id_compra = $1
      `,
      [id, provId, fecha || null, observaciones ?? null]
    );

    const sql = `
      SELECT id_compra_ret, total_ret, estado_ret
      FROM modificar_compra_transaccional($1, $2, $3)
    `;

    const { rows } = await client.query(sql, [
      id,
      observaciones ?? null,
      itemsJson,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("La función no devolvió resultados");
    }

    const result = rows[0];

    try {
      const userId = await getUserIdFromToken(req.accessToken);
      await registrarAuditoria(
        userId,
        "MODIFICAR_COMPRA",
        "COMPRAS",
        `Compra ${result.id_compra_ret} modificada. Nuevo total: ${result.total_ret}`
      );
    } catch (errAud) {
      console.error(
        "Error registrando auditoría de modificación:",
        errAud.message
      );
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: `Compra ${result.id_compra_ret} modificada correctamente.`,
      id_compra: result.id_compra_ret,
      total: result.total_ret,
      estado: result.estado_ret,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en PUT /api/compras/:id:", err);
    return res.status(500).json({
      ok: false,
      message: "Error al modificar la compra",
      detail: err.message,
    });
  } finally {
    client.release();
  }
});

export default router;
