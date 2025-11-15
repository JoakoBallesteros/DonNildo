// routes/stock.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

const router = Router();

/* ============================================================
 * GET /api/stock
 *  -> Lista general para la tabla de stock (usa la view v_stock_list)
 * ============================================================ */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM v_stock_list ORDER BY referencia"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* ============================================================
 * GET /api/stock/categorias
 *  -> Para el combo de categorías cuando filtro Cajas
 * ============================================================ */
router.get("/categorias", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_categoria, nombre FROM categoria ORDER BY nombre"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* ============================================================
 * GET /api/stock/unidades
 *  -> Para el combo 'Unidad' (u / kg)
 * ============================================================ */
router.get("/unidades", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT unidad_stock AS unidad
       FROM tipo_producto
       WHERE unidad_stock IS NOT NULL
       ORDER BY unidad_stock`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* ============================================================
 * GET /api/stock/materiales
 *  -> Lista de productos tipo "Material" (id_tipo_producto = 2)
 *     para el combo de pesaje
 * ============================================================ */
router.get("/materiales", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT id_producto, nombre
      FROM productos
      WHERE id_tipo_producto = 2
        AND estado = TRUE
      ORDER BY nombre
      `
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* ============================================================
 * POST /api/stock/productos
 *  Crea un nuevo producto (Caja o Material).
 *
 * Body esperado (lo manda ProductFormTabs):
 * {
 *   tipo: "Caja" | "Producto",
 *   referencia,
 *   categoria,        // se ignora para Caja, se usa para Material
 *   medidas: { l,a,h },
 *   unidad,           // "u" o "kg"
 *   cantidad,
 *   precio,
 *   notas
 * }
 * ============================================================ */
router.post("/productos", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      tipo,
      referencia,
      categoria,
      medidas = {},
      unidad,
      cantidad,
      precio,
      notas,
    } = req.body || {};

    if (!tipo || !referencia) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    const isCaja = tipo === "Caja";
    const idTipoProducto = isCaja ? 1 : 2; // 1 = Caja, 2 = Producto (material)

    await client.query("BEGIN");

    // ---------- MEDIDA (solo cajas) ----------
    let idMedida = null;
    let { l, a, h } = medidas;

    if (isCaja) {
      const L = Number(l || 0);
      const A = Number(a || 0);
      const H = Number(h || 0);

      if (!L || !A || !H) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Para Caja se necesitan largo, ancho y alto." });
      }

      // ¿ya existe una medida igual?
      let result = await client.query(
        `
        SELECT id_medida
        FROM medida
        WHERE alto = $1 AND ancho = $2 AND profundidad = $3
        LIMIT 1
        `,
        [L, A, H]
      );

      if (result.rows.length) {
        idMedida = result.rows[0].id_medida;
      } else {
        const nombreMedida = `${L}x${A}x${H} cm`;
        result = await client.query(
          `
          INSERT INTO medida (nombre, alto, ancho, profundidad)
          VALUES ($1, $2, $3, $4)
          RETURNING id_medida
          `,
          [nombreMedida, L, A, H]
        );
        idMedida = result.rows[0].id_medida;
      }
    }

    // ---------- CATEGORÍA ----------
    // Caja => se asigna Chica / Mediana / Grande según volumen
    // Material => se usa el texto enviado (p.ej. "Accesorios")
    let idCategoria = null;

    if (isCaja) {
      const L = Number(medidas.l || 0);
      const A = Number(medidas.a || 0);
      const H = Number(medidas.h || 0);

      const volumen = L * A * H;
      let nombreCategoria;

      if (volumen <= 3000) {
        nombreCategoria = "Chica";
      } else if (volumen <= 10000) {
        nombreCategoria = "Mediana";
      } else {
        nombreCategoria = "Grande";
      }

      const catResult = await client.query(
        `
        SELECT id_categoria
        FROM categoria
        WHERE nombre = $1
        LIMIT 1
        `,
        [nombreCategoria]
      );

      if (!catResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: `Categoría de caja '${nombreCategoria}' no configurada`,
        });
      }

      idCategoria = catResult.rows[0].id_categoria;
    } else {
      // Materiales: usamos la categoría enviada (p.ej. "Accesorios")
      const nombreCategoria = categoria || null;

      if (nombreCategoria) {
        let result = await client.query(
          `
          SELECT id_categoria
          FROM categoria
          WHERE nombre = $1
          LIMIT 1
          `,
          [nombreCategoria]
        );

        if (!result.rows.length) {
          // Por ahora permitimos crear nuevas categorías para materiales
          result = await client.query(
            `
            INSERT INTO categoria (nombre, descripcion)
            VALUES ($1, $2)
            RETURNING id_categoria
            `,
            [nombreCategoria, "Categoría generada automáticamente"]
          );
        }

        idCategoria = result.rows[0].id_categoria;
      }
    }

    // ---------- PRODUCTO ----------
    const precioNum = Number(precio || 0) || 0;
    const resultProd = await client.query(
      `
      INSERT INTO productos
        (nombre, descripcion, id_categoria, id_tipo_producto, id_medida, precio_unitario, estado)
      VALUES
        ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id_producto
      `,
      [
        referencia,
        notas || null,
        idCategoria,
        idTipoProducto,
        idMedida,
        precioNum,
      ]
    );

    const idProducto = resultProd.rows[0].id_producto;

    // ---------- STOCK INICIAL ----------
    const cantNum = Number(cantidad || 0) || 0;
    await client.query(
      `
      INSERT INTO stock (id_producto, cantidad)
      VALUES ($1, $2)
      `,
      [idProducto, cantNum]
    );

    await client.query("COMMIT");

    // Devolvemos la fila ya formateada desde la vista v_stock_list
    const { rows } = await client.query(
      `SELECT * FROM v_stock_list WHERE id_producto = $1`,
      [idProducto]
    );

    // 🔹 AUDITORÍA: CREAR_PRODUCTO
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "CREAR_PRODUCTO",
        "STOCK",
        `Producto ID ${idProducto} creado: "${referencia}" con stock inicial ${cantNum}.`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando creación de producto:",
        errAud.message
      );
    }

    return res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creando producto:", err);
    return res.status(500).json({ error: "Error al crear producto" });
  } finally {
    client.release();
  }
});

// PUT /api/stock/productos/:id
// Actualiza datos básicos del producto (nombre, medidas / stock / precio / notas)
router.put("/productos/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Traemos info básica del producto para saber si es Caja o Material
    const prodResult = await client.query(
      `SELECT id_tipo_producto, id_medida, id_categoria
       FROM productos
       WHERE id_producto = $1`,
      [id]
    );

    if (!prodResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const {
      id_tipo_producto,
      id_medida: currentMedida,
      id_categoria: currentCategoria,
    } = prodResult.rows[0];

    const isCaja = id_tipo_producto === 1; // 1 = Caja, 2 = Material

    const {
      referencia,
      notas,
      disponible,
      precio,
      unidad,
      medidas = {},
    } = req.body || {};

    // ===== Normalizamos cantidad y precio =====
    let cantidad = 0;
    let precioUnitario = 0;

    if (isCaja) {
      cantidad = parseInt(disponible ?? 0, 10) || 0; // enteros
    } else {
      cantidad = Number(disponible ?? 0) || 0; // decimales ok
    }

    precioUnitario = Number(precio ?? 0) || 0;

    // ===== Medidas y categoría (solo cajas) =====
    let idMedida = currentMedida;
    let idCategoria = currentCategoria;

    if (isCaja && medidas) {
      const L = Number(medidas.l || medidas.L || 0);
      const A = Number(medidas.a || medidas.A || 0);
      const H = Number(medidas.h || medidas.H || 0);

      if (!L || !A || !H) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Para Caja se necesitan largo, ancho y alto." });
      }

      // --- MEDIDA ---
      let mResult = await client.query(
        `SELECT id_medida
         FROM medida
         WHERE alto = $1 AND ancho = $2 AND profundidad = $3
         LIMIT 1`,
        [L, A, H]
      );

      if (mResult.rows.length) {
        idMedida = mResult.rows[0].id_medida;
      } else {
        const nombreMedida = `${L}x${A}x${H} cm`;
        mResult = await client.query(
          `INSERT INTO medida (nombre, alto, ancho, profundidad)
           VALUES ($1, $2, $3, $4)
           RETURNING id_medida`,
          [nombreMedida, L, A, H]
        );
        idMedida = mResult.rows[0].id_medida;
      }

      // --- CATEGORÍA (Chica / Mediana / Grande) ---
      const volumen = L * A * H;
      let nombreCategoria;

      if (volumen <= 3000) {
        nombreCategoria = "Chica";
      } else if (volumen <= 10000) {
        nombreCategoria = "Mediana";
      } else {
        nombreCategoria = "Grande";
      }

      const catResult = await client.query(
        `SELECT id_categoria
         FROM categoria
         WHERE nombre = $1
         LIMIT 1`,
        [nombreCategoria]
      );

      if (!catResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: `Categoría de caja '${nombreCategoria}' no configurada`,
        });
      }

      idCategoria = catResult.rows[0].id_categoria;
    }

    // ===== Actualizamos producto =====
    await client.query(
      `
      UPDATE productos
      SET
        nombre = COALESCE($1, nombre),
        descripcion = $2,
        precio_unitario = $3,
        id_medida = COALESCE($4, id_medida),
        id_categoria = COALESCE($5, id_categoria)
      WHERE id_producto = $6
      `,
      [
        referencia || null,
        notas || null,
        precioUnitario,
        idMedida,
        idCategoria,
        id,
      ]
    );

    // ===== Actualizamos stock =====
    await client.query(
      `UPDATE stock
       SET cantidad = $1
       WHERE id_producto = $2`,
      [cantidad, id]
    );

    await client.query("COMMIT");

    // Devolvemos la fila actualizada desde la vista v_stock_list
    const { rows } = await client.query(
      `SELECT * FROM v_stock_list WHERE id_producto = $1`,
      [id]
    );

    // 🔹 AUDITORÍA: MODIFICAR_PRODUCTO
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      const prod = rows[0];
      registrarAuditoria(
        idUsuario,
        "MODIFICAR_PRODUCTO",
        "STOCK",
        `Producto ID ${id} modificado: "${prod.referencia}" (stock ${prod.disponible}, precio ${prod.precio}).`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando modificación de producto:",
        errAud.message
      );
    }

    return res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error actualizando producto:", err);
    return res.status(500).json({ error: "Error al actualizar producto" });
  } finally {
    client.release();
  }
});

// DELETE /api/stock/productos/:id
// Baja lógica: marca el producto como inactivo
router.delete("/productos/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE productos SET estado = FALSE WHERE id_producto = $1",
      [id]
    );

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 🔹 AUDITORÍA: ELIMINAR_PRODUCTO
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "ELIMINAR_PRODUCTO",
        "STOCK",
        `Producto ID ${id} marcado como inactivo.`
      );
    } catch (errAud) {
      console.error(
        "⚠️ Error auditando eliminación de producto:",
        errAud.message
      );
    }

    return res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar producto:", err);
    return res.status(500).json({ error: "Error al eliminar producto" });
  } finally {
    client.release();
  }
});

/* ============================================================
 * POST /api/stock/pesaje
 *
 * Registra un pesaje de materiales:
 * Body:
 * {
 *   items: [
 *     { id_producto, cantidad, precio, observaciones }
 *   ]
 * }
 *
 * - Suma la cantidad a stock.cantidad
 * - Actualiza fecha_ultima_actualiza
 * - Deja registro en Auditoría
 * ============================================================ */
router.post("/pesaje", requireAuth, async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "No se recibieron ítems de pesaje.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalKg = 0;

    for (const item of items) {
      const idProducto = Number(item.id_producto || 0);
      const cant = Number(item.cantidad || 0);

      if (!idProducto || !cant || cant <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Hay ítems de pesaje con producto o cantidad inválidos.",
        });
      }

      totalKg += cant;

      // Sumamos al stock actual
      await client.query(
        `
        UPDATE stock
        SET cantidad = cantidad + $1,
            fecha_ultima_actualiza = now()
        WHERE id_producto = $2
        `,
        [cant, idProducto]
      );
    }

    await client.query("COMMIT");

    // 🔹 AUDITORÍA: REGISTRO_PESAJE
    try {
      const idUsuario = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        idUsuario,
        "REGISTRO_PESAJE",
        "STOCK",
        `Pesaje registrado con ${items.length} ítems, total ${totalKg} kg.`
      );
    } catch (errAud) {
      console.error("⚠️ Error auditando pesaje:", errAud.message);
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error registrando pesaje:", err);
    return res
      .status(500)
      .json({ error: "Error al registrar el pesaje en el servidor." });
  } finally {
    client.release();
  }
});

export default router;

