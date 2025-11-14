// api/src/routes/ventas.mjs
import { Router } from "express";
import { pool } from "../db.mjs";

const router = Router();

// ====================
// 1️⃣ Obtener todas las ventas
// ====================
// ====================
// 1️⃣ Obtener ventas (con filtro)
// ====================
router.get("/", async (req, res) => {
  try {
    const { only, estado } = req.query;

    let ventasQuery = `
      SELECT v.id_venta, v.fecha, v.total, v.observaciones, e.nombre AS estado
      FROM venta v
      JOIN estado e ON v.id_estado = e.id_estado
    `;

    const params = [];
    if (only === "activas") {
      ventasQuery += ` WHERE e.nombre <> 'ANULADO' `;
    } else if (only === "anuladas") {
      ventasQuery += ` WHERE e.nombre = 'ANULADO' `;
    } else if (estado) {
      ventasQuery += ` WHERE e.nombre = $1 `;
      params.push(estado); // ej. 'ANULADO'
    }

    ventasQuery += ` ORDER BY v.id_venta ASC;`;

    const { rows: ventas } = await pool.query(ventasQuery, params);

    if (ventas.length === 0) return res.json([]);

    // obtener detalles de esas ventas
    const ids = ventas.map(v => v.id_venta);
    const { rows: detalles } = await pool.query(
      `SELECT d.*, p.nombre, p.id_tipo_producto 
       FROM detalle_venta d 
       JOIN productos p ON d.id_producto = p.id_producto
       WHERE d.id_venta = ANY($1)`,
      [ids]
    );

    // agrupar detalles por venta
    const grouped = {};
    for (const d of detalles) {
      const tipo = d.id_tipo_producto === 1 ? "Caja" : "Producto";
      (grouped[d.id_venta] ||= []).push({
        id_detalle_venta: d.id_detalle_venta,
        id_producto: d.id_producto,
        tipo,
        producto: d.nombre,
        cantidad: Number(d.cantidad),
        medida: tipo === "Caja" ? "u" : "kg",
        precio: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      });
    }

    // combinar datos
    const result = ventas.map(v => {
      const items = grouped[v.id_venta] || [];
      const soloUnTipo = new Set(items.map(i => i.tipo)).size === 1;
      const tipoVenta = soloUnTipo ? items[0]?.tipo ?? "Producto" : "Mixta";
      const total = v.total ?? items.reduce((acc, i) => acc + i.subtotal, 0);
      return { ...v, tipo: tipoVenta, productos: items, total };
    });

    res.json(result);
  } catch (e) {
    console.error("Error al obtener ventas:", e);
    res.status(500).json({ error: e.message });
  }
});
// ====================
// MODIFICAR UNA VENTA
// ====================
router.put("/:id", async (req, res) => {

  const id = req.params.id || req.body.id_venta;
  const { productos } = req.body;

  console.log("🔹 ID final detectado:", id);

  if (!id) {
    return res.status(400).json({ error: "Falta id de venta" });
  }

  try {
    console.log("🧾 Actualizando venta:", id, productos);

    let total = 0;

    for (const p of productos) {
      if (!p.id_detalle_venta) {
        console.warn("⚠️ Falta id_detalle_venta:", p);
        continue;
      }

      const cantidad = Number(p.cantidad) || 0;
      const precio = Number(p.precio) || 0;
      const subtotal = cantidad * precio;
      total += subtotal;

      await pool.query(
        `UPDATE detalle_venta
         SET cantidad = $1, precio_unitario = $2, subtotal = $3
         WHERE id_detalle_venta = $4`,
        [cantidad, precio, subtotal, p.id_detalle_venta]
      );
    }

    await pool.query(
      `UPDATE venta SET total = $1 WHERE id_venta = $2`,
      [total, id]
    );

    console.log(`✅ Venta ${id} modificada correctamente`);
    res.json({ success: true, total });
  } catch (e) {
    console.error("❌ Error al modificar venta:", e);
    res.status(500).json({ error: e.message });
  }
});

// ====================
// 3️⃣ Anular una venta
// ====================
router.put("/:id/anular", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT id_estado FROM estado WHERE nombre = 'ANULADO' LIMIT 1`);
    if (!rows.length) return res.status(400).json({ error: "No existe estado ANULADO" });
    const idEstado = rows[0].id_estado;

    await pool.query(`UPDATE venta SET id_estado = $1 WHERE id_venta = $2`, [idEstado, id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error al anular venta:", e);
    res.status(500).json({ error: e.message });
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