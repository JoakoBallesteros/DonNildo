import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from '../middlewares/requireAuth.mjs'; 
import { getUserIdFromToken, registrarAuditoria } from '../utils/auditoriaService.mjs'; 

const router = Router();

// ====================
// 1️⃣ Obtener ventas (OPTIMIZADO - PÚBLICO)
// ====================
router.get("/", async (req, res) => {
  try {
    const { only, estado } = req.query; 
    
    let estadoFiltro = null;
    if (only === "activas") estadoFiltro = 'COMPLETADO';
    else if (only === "anuladas") estadoFiltro = 'ANULADO';
    else if (estado) estadoFiltro = estado;
    
    const query = `SELECT * FROM listar_ventas_optimizada($1);`;
    const { rows: ventas } = await pool.query(query, [estadoFiltro]);

    res.json(ventas);

  } catch (e) {
    console.error("Error al obtener ventas (OPTIMIZADO):", e);
    res.status(500).json({ error: e.message });
  }
});

// ====================
// 2️⃣ MODIFICAR VENTA (PROTEGIDO)
// ====================
router.put("/:id", requireAuth, async (req, res) => { 
  const id = Number(req.params.id); 
  const { productos, observaciones = null } = req.body; 

  if (!id) return res.status(400).json({ error: "Falta id de venta." });
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Se requieren productos para modificar." });
  }

  try {
    const itemsJsonb = JSON.stringify(productos);
    
    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM modificar_venta_transaccional($1, $2, $3)
    `;
    
    const { rows } = await pool.query(query, [id, observaciones, itemsJsonb]);

    // Auditoría (Usuario NULL si no hay token)
    const userId = await getUserIdFromToken(req.accessToken);
    registrarAuditoria(
        userId, 
        'Modificación', 
        'Ventas', 
        `Venta N°${id} modificada. Nuevo Total: ${rows[0].total_ret}`
    );

    res.status(200).json({ 
      message: `Venta N°${rows[0].id_venta_ret} modificada con éxito.`,
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      success: true 
    });
  } catch (e) {
    console.error(`❌ Error al modificar venta N°${id}:`, e);
    res.status(500).json({ error: e.message || "Error al procesar la modificación." });
  }
});

// ====================
// 3️⃣ ANULAR VENTA (PROTEGIDO)
// ====================
router.put("/:id/anular", requireAuth, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect(); 

  try {
    const { rows: estRows } = await client.query(`SELECT id_estado FROM estado WHERE nombre = 'ANULADO' LIMIT 1`);
    if (!estRows.length) throw new Error("Configuración faltante: Estado ANULADO");
    const idEstadoAnulado = estRows[0].id_estado; 

    const { rows: movRows } = await client.query(`SELECT id_tipo_movimiento FROM tipo_movimiento WHERE nombre = 'ENTRADA' LIMIT 1`);
    if (!movRows.length) throw new Error("Configuración faltante: Movimiento ENTRADA");
    const idTipoMovEntrada = movRows[0].id_tipo_movimiento; 

    await client.query('BEGIN'); 

    // Obtener detalles para reponer stock
    const { rows: detalles } = await client.query(
        `SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = $1`, [id]
    );

    // Reponer stock
    for (const detalle of detalles) {
        const cantNum = Number(detalle.cantidad);
        await client.query(
            `UPDATE stock SET cantidad = cantidad + $1, fecha_ultima_actualiza = NOW() WHERE id_producto = $2`,
            [cantNum, detalle.id_producto]
        );
        await client.query(
            `INSERT INTO movimientos_stock (id_producto, id_tipo_movimiento, cantidad, observaciones) 
             VALUES ($1, $2, $3, $4)`,
            [detalle.id_producto, idTipoMovEntrada, cantNum, `Anulación Venta N°${id}`]
        );
    }

    // Cambiar estado
    await client.query(
        `UPDATE venta SET id_estado = $1, observaciones = COALESCE(observaciones, '') || E'\n-- ANULADA: ' || NOW() WHERE id_venta = $2`, 
        [idEstadoAnulado, id]
    );

    // Auditoría
    const userId = await getUserIdFromToken(req.accessToken);
    await client.query(
        `SELECT registrar_auditoria($1, $2, $3, $4)`,
        [userId, 'Anulación', 'Ventas', `Venta N°${id} anulada y stock repuesto.`]
    );

    await client.query('COMMIT'); 
    res.json({ success: true, message: `Venta ${id} anulada y stock repuesto.` });

  } catch (e) {
    await client.query('ROLLBACK'); 
    console.error("Error al anular venta:", e);
    res.status(500).json({ error: e.message || "Error al anular venta." });
  } finally {
    client.release(); 
  }
});

// ====================
// 4️⃣ REGISTRAR VENTA (PROTEGIDO - SIN ID_CLIENTE)
// ====================
router.post("/", requireAuth, async (req, res) => { 
  // 💡 Eliminamos id_cliente del body
  const { ventas: productos, observaciones } = req.body; 

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Faltan productos." });
  }

  try {
    const productosJsonb = JSON.stringify(productos);
    
    // 💡 Llamamos a la RPC con SOLO 2 argumentos ($1, $2)
    const query = `
      SELECT id_venta_ret, total_ret, estado_ret
      FROM registrar_venta_transaccional($1, $2)
    `;

    // 💡 Pasamos solo [json, observaciones]
    const { rows } = await pool.query(query, [productosJsonb, observaciones]);

    // Auditoría
    const idVenta = rows[0].id_venta_ret;
    const userId = await getUserIdFromToken(req.accessToken);
    
    registrarAuditoria(
        userId, 
        'Creación', 
        'Ventas', 
        `Nueva Venta N°${idVenta} registrada. Total: ${rows[0].total_ret}.`
    );

    res.status(201).json({ 
      id_venta: rows[0].id_venta_ret,
      total: rows[0].total_ret,
      estado: rows[0].estado_ret,
      success: true
    });
  } catch (e) {
    console.error("❌ Error al registrar venta:", e);
    res.status(500).json({ error: e.message || "Error al procesar la venta." });
  }
});

export default router;