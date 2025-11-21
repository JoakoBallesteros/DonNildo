// api/src/routes/ventas.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

// 👇 Todas las rutas de ventas: solo ADMIN o VENTAS
router.use(requireAuth, allowRoles(["ADMIN", "VENTAS"]));

// ====================
// 1️⃣ Obtener ventas (OPTIMIZADO con RPC)
// ====================
router.get("/", async (req, res) => {
  try {
    const { only, estado } = req.query; // only=activas, only=anuladas, estado=COMPLETADO

    let estadoFiltro = null;
    if (only === "activas") {
      estadoFiltro = "COMPLETADO";
    } else if (only === "anuladas") {
      estadoFiltro = "ANULADO";
    } else if (estado) {
      estadoFiltro = estado;
    }

    // 💡 Llama a la función optimizada de PostgreSQL con un solo parámetro
    const query = `SELECT * FROM listar_ventas_optimizada($1);`;
    const { rows: ventas } = await pool.query(query, [estadoFiltro]);

    res.json(ventas);
  } catch (e) {
    console.error("Error al obtener ventas (OPTIMIZADO):", e);
    res.status(500).json({ error: e.message });
  }
});
// ====================
// 1️ Obtener ventas por ID para modificar
// ====================
router.get("/:id", requireAuth, async (req, res) => { // 💡 Asegurate de usar requireAuth si es necesario
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID de venta inválido." });
  }

  try {
    // 1. CABECERA DE LA VENTA
    const ventaQuery = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.observaciones
      FROM venta v
      WHERE v.id_venta = $1
      LIMIT 1;
    `;

    const { rows: ventaRows } = await pool.query(ventaQuery, [id]);

    if (ventaRows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada." });
    }

    // 2. DETALLES DE LA VENTA
    // Corregido el JOIN a 'medida' (singular) y usando tp.nombre para el tipo
    const productosQuery = `
      SELECT 
        dv.id_producto,
        p.nombre AS producto,
        tp.nombre AS tipo_producto, 
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        COALESCE(m.simbolo, 'u') AS medida
      FROM detalle_venta dv
      JOIN productos p ON p.id_producto = dv.id_producto
      LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = p.id_tipo_producto
      LEFT JOIN medida m ON m.id_medida = p.id_medida  -- 💡 CORREGIDO: tabla 'medida' (singular)
      WHERE dv.id_venta = $1;
    `;

    const { rows: productosRows } = await pool.query(productosQuery, [id]);

    // 3. FORMATEAR RESPUESTA (Coincide con lo que espera RegistrarVentas.jsx)
    const productos = productosRows.map((p) => ({
      id_producto: p.id_producto,
      producto: p.producto,       // Nombre del producto
      tipo: p.tipo_producto,      // "Caja" o "Producto terminado"
      tipo_producto: p.tipo_producto, // Duplicado para asegurar compatibilidad con tu front
      cantidad: Number(p.cantidad),
      precio_unitario: Number(p.precio_unitario), // Tu front espera precio_unitario o precio
      precio: Number(p.precio_unitario),          // Enviamos ambos por seguridad
      subtotal: Number(p.subtotal),
      medida: p.medida,
      descuento: 0,
    }));

    res.json({
      venta: ventaRows[0],
      productos, // Array de items
      success: true,
    });

  } catch (error) {
    console.error("❌ Error cargando venta:", error);
    res.status(500).json({ error: "Error al obtener la venta." });
  }
});

// ====================
// 2️⃣ MODIFICAR UNA VENTA (TRANSACCIONAL: Revierte stock, aplica nuevo stock)
// ====================
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { productos, observaciones = null } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Falta id de venta." });
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    return res
      .status(400)
      .json({ error: "Debe haber al menos un producto para modificar la venta." });
  }

  try {
    const itemsJsonb = JSON.stringify(productos);

    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM modificar_venta_transaccional($1, $2, $3)
    `;

    const { rows } = await pool.query(query, [id, observaciones, itemsJsonb]);

    // 🔹 AUDITORÍA: registrar modificación de venta
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "MODIFICAR_VENTA",
        "VENTAS",
        `Venta N°${rows[0].id_venta_ret} modificada. Nuevo total: ${rows[0].total_ret}`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando modificación de venta:",
        errAud.message
      );
    }

    res.status(200).json({
      message: `Venta N°${rows[0].id_venta_ret} modificada con éxito.`,
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      success: true,
    });
  } catch (e) {
    console.error(`❌ Error al modificar venta N°${id}:`, e);
    res.status(500).json({
      error:
        e.message || "Error al procesar la modificación de la venta.",
    });
  }
});

// ====================
// 3️⃣ Anular una venta
// ====================
router.put("/:id/anular", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const { rows: estRows } = await client.query(
      `SELECT id_estado FROM estado WHERE nombre = 'ANULADO' LIMIT 1`
    );
    if (!estRows.length) {
      return res.status(500).json({
        error:
          "Falta configuración: No existe estado ANULADO en la BD.",
      });
    }
    const idEstadoAnulado = estRows[0].id_estado;

    const { rows: movRows } = await client.query(
      `SELECT id_tipo_movimiento FROM tipo_movimiento WHERE nombre = 'ENTRADA' LIMIT 1`
    );
    if (!movRows.length) {
      return res.status(500).json({
        error:
          "Falta configuración: No existe tipo_movimiento ENTRADA.",
      });
    }
    const idTipoMovEntrada = movRows[0].id_tipo_movimiento;

    await client.query("BEGIN");

    const { rows: detalles } = await client.query(
      `SELECT id_producto, cantidad 
       FROM detalle_venta 
       WHERE id_venta = $1`,
      [id]
    );

    for (const detalle of detalles) {
      const { id_producto, cantidad } = detalle;
      const cantNum = Number(cantidad);

      await client.query(
        `UPDATE stock SET 
            cantidad = cantidad + $1,
            fecha_ultima_actualiza = NOW()
         WHERE id_producto = $2`,
        [cantNum, id_producto]
      );

      await client.query(
        `INSERT INTO movimientos_stock (id_producto, id_tipo_movimiento, cantidad, observaciones)
         VALUES ($1, $2, $3, $4)`,
        [id_producto, idTipoMovEntrada, cantNum, `Anulación Venta N°${id}`]
      );
    }

    await client.query(
      `UPDATE venta 
       SET id_estado = $1, 
           observaciones = COALESCE(observaciones, '') || E'\n-- ANULADA: ' || NOW() 
       WHERE id_venta = $2`,
      [idEstadoAnulado, id]
    );

    await client.query("COMMIT");

    // 🔹 AUDITORÍA: registrar anulación
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "ANULAR_VENTA",
        "VENTAS",
        `Venta N°${id} anulada y stock repuesto.`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando anulación de venta:",
        errAud.message
      );
    }

    res.json({
      success: true,
      message: `Venta ${id} anulada y stock repuesto.`,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error al anular venta:", e);
    res.status(500).json({
      error:
        e.message ||
        "Error al procesar la anulación. Transacción revertida.",
    });
  } finally {
    client.release();
  }
});

// ====================
// 4️⃣ Registrar una nueva venta (Transaccional - Llama a RPC)
// ====================
router.post("/", async (req, res) => {
  const { ventas: productos, id_cliente, observaciones } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res
      .status(400)
      .json({ error: "Faltan productos para registrar la venta" });
  }

  try {
    const productosJsonb = JSON.stringify(productos);

    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM registrar_venta_transaccional($1, $2, $3)
    `;

    const { rows } = await pool.query(query, [
      productosJsonb,
      id_cliente,
      observaciones,
    ]);

    // 🔹 AUDITORÍA: registrar nueva venta
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "CREAR_VENTA",
        "VENTAS",
        `Venta N°${rows[0].id_venta_ret} registrada. Total: ${rows[0].total_ret}`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando creación de venta:",
        errAud.message
      );
    }

    res.status(201).json({
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      estado: rows[0].estado_ret,
      success: true,
    });
  } catch (e) {
    console.error("❌ Error al registrar venta transaccional:", e);
    res.status(500).json({
      error: e.message || "Error al procesar la venta.",
    });
  }
});

export default router;