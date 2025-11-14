// api/src/routes/ventas.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { registrarAuditoria, getUserIdFromToken } from "../utils/auditoriaService.mjs"; // 🔹 NUEVO

const router = Router();

// ====================
// 1️⃣ Obtener ventas (OPTIMIZADO con RPC)
// ====================
router.get("/", async (req, res) => {
  try {
    const { only, estado } = req.query; // only=activas, only=anuladas, estado=COMPLETADO
    
    let estadoFiltro = null;
    if (only === "activas") {
      estadoFiltro = 'COMPLETADO';
    } else if (only === "anuladas") {
      estadoFiltro = 'ANULADO';
    } else if (estado) {
      estadoFiltro = estado;
    }
    
    // 💡 Llama a la función optimizada de PostgreSQL con un solo parámetro
    const query = `SELECT * FROM listar_ventas_optimizada($1);`;
    const { rows: ventas } = await pool.query(query, [estadoFiltro]);

    // Node.js solo devuelve el resultado directo de la base de datos (rendimiento máximo)
    res.json(ventas);

  } catch (e) {
    console.error("Error al obtener ventas (OPTIMIZADO):", e);
    res.status(500).json({ error: e.message });
  }
});

// ====================
// 2️⃣ MODIFICAR UNA VENTA (TRANSACCIONAL: Revierte stock, aplica nuevo stock)
// ====================
router.put("/:id", async (req, res) => {
  // El ID de la venta viene de los parámetros de la URL
  const id = Number(req.params.id); 
  // Los ítems y las observaciones vienen del cuerpo de la solicitud
  const { productos, observaciones = null } = req.body; 

  if (!id) {
    return res.status(400).json({ error: "Falta id de venta." });
  }
  // El frontend (ListaVentas.jsx) envía 'productos' (el array de detalles)
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Debe haber al menos un producto para modificar la venta." });
  }

  try {
    // 1. Convertir el array de ítems en JSONB para la función de la BD
    const itemsJsonb = JSON.stringify(productos);
    
    // 2. Llamada a la función transaccional de PostgreSQL/Supabase
    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM modificar_venta_transaccional($1, $2, $3)
    `;
    
    // Parámetros: [p_id_venta, p_observaciones, p_items_jsonb]
    const { rows } = await pool.query(query, [id, observaciones, itemsJsonb]);

    // 🔹 AUDITORÍA: registrar modificación de venta (no afecta la respuesta)
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "MODIFICAR_VENTA",
        "VENTAS",
        `Venta N°${rows[0].id_venta_ret} modificada. Nuevo total: ${rows[0].total_ret}`
      );
    } catch (errAud) {
      console.error("⚠️ Error auditando modificación de venta:", errAud.message);
    }

    // 3. Respuesta exitosa
    res.status(200).json({ 
      message: `Venta N°${rows[0].id_venta_ret} modificada con éxito.`,
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      success: true 
    });
  } catch (e) {
    // 4. Manejo de errores de la BD (incluido STOCK_INSUFICIENTE)
    console.error(`❌ Error al modificar venta N°${id}:`, e);
    res.status(500).json({ error: e.message || "Error al procesar la modificación de la venta." });
  }
});

// ====================
// 3️⃣ Anular una venta
// ====================
router.put("/:id/anular", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect(); // Obtener una conexión del pool

  try {
    // 1. Obtener IDs de catálogo
    const { rows: estRows } = await client.query(
      `SELECT id_estado FROM estado WHERE nombre = 'ANULADO' LIMIT 1`
    );
    if (!estRows.length) {
      return res.status(500).json({ error: "Falta configuración: No existe estado ANULADO en la BD." });
    }
    const idEstadoAnulado = estRows[0].id_estado; // Será 3

    const { rows: movRows } = await client.query(
      `SELECT id_tipo_movimiento FROM tipo_movimiento WHERE nombre = 'ENTRADA' LIMIT 1`
    );
    if (!movRows.length) {
      return res.status(500).json({ error: "Falta configuración: No existe tipo_movimiento ENTRADA." });
    }
    const idTipoMovEntrada = movRows[0].id_tipo_movimiento; // Será 1

    await client.query('BEGIN'); // 2. INICIAR TRANSACCIÓN

    // 3. Obtener detalles de la venta a anular
    const { rows: detalles } = await client.query(
      `SELECT id_producto, cantidad 
       FROM detalle_venta 
       WHERE id_venta = $1`, 
      [id]
    );

    // 4. Reponer stock y registrar movimientos (para CADA producto)
    for (const detalle of detalles) {
      const { id_producto, cantidad } = detalle;
      const cantNum = Number(cantidad);

      // a) Actualizar Stock (Sumar cantidad)
      await client.query(
        `UPDATE stock SET 
            cantidad = cantidad + $1,
            fecha_ultima_actualiza = NOW()
         WHERE id_producto = $2`,
        [cantNum, id_producto]
      );

      // b) Insertar Movimiento de Stock (ENTRADA por reversión)
      await client.query(
        `INSERT INTO movimientos_stock (id_producto, id_tipo_movimiento, cantidad, observaciones)
         VALUES ($1, $2, $3, $4)`,
        [id_producto, idTipoMovEntrada, cantNum, `Anulación Venta N°${id}`]
      );
    }

    // 5. Cambiar estado de la venta
    await client.query(
      `UPDATE venta 
       SET id_estado = $1, 
           observaciones = COALESCE(observaciones, '') || E'\n-- ANULADA: ' || NOW() 
       WHERE id_venta = $2`, 
      [idEstadoAnulado, id]
    );

    await client.query('COMMIT'); // 6. FINALIZAR TRANSACCIÓN (todo OK)

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
      console.error("⚠️ Error auditando anulación de venta:", errAud.message);
    }

    res.json({ success: true, message: `Venta ${id} anulada y stock repuesto.` });

  } catch (e) {
    await client.query('ROLLBACK'); // Si algo falla, revertir todo.
    console.error("Error al anular venta:", e);
    res.status(500).json({ error: e.message || "Error al procesar la anulación. Transacción revertida." });
  } finally {
    client.release(); // 7. Liberar la conexión
  }
});

// ====================
// 4️⃣ Registrar una nueva venta (Transaccional - Llama a RPC)
// ====================
router.post("/", async (req, res) => {
  // Esperamos un body como { ventas: [item1, item2, ...], id_cliente: 1, observaciones: "..." }
  const { ventas: productos, id_cliente, observaciones } = req.body; 

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Faltan productos para registrar la venta" });
  }

  try {
    // 1. Convertir el array de JS a un JSONB string
    const productosJsonb = JSON.stringify(productos);
    
    // 2. Llamar a la función transaccional de PostgreSQL/Supabase
    // NOTA: registrar_venta_transaccional debe estar creada en tu SQL Editor de Supabase
    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM registrar_venta_transaccional($1, $2, $3)
    `;

    // Pasamos el JSONB de productos, id_cliente (puede ser null), y observaciones (puede ser null)
    const { rows } = await pool.query(query, [productosJsonb, id_cliente, observaciones]);

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
      console.error("⚠️ Error auditando creación de venta:", errAud.message);
    }

    // 3. Devolver la venta creada
    res.status(201).json({ 
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      estado: rows[0].estado_ret,
      success: true
    });
  } catch (e) {
    console.error("❌ Error al registrar venta transaccional:", e);
    // 💡 Devolvemos el error de la DB (incluido el de stock insuficiente: "STOCK_INSUFICIENTE")
    res.status(500).json({ error: e.message || "Error al procesar la venta." });
  }
});

export default router;