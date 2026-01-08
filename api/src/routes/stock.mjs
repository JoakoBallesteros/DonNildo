// api/src/routes/stock.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

const router = Router();

// Todas las rutas de este módulo requieren usuario autenticado
router.use(requireAuth);

/* ============================================================
 * GET /api/stock
 *  -> Lista general para la tabla de stock (usa la view v_stock_list)
 *  Roles: ADMIN, OPERADOR, STOCK, COMPRAS, VENTAS
 * ============================================================ */
router.get(
  "/",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS", "VENTAS"]),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM v_stock_list ORDER BY referencia"
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
 * GET /api/stock/categorias
 *  -> Para el combo de categorías cuando filtro Cajas
 *  Roles: todos los que pueden ver stock
 * ============================================================ */
router.get(
  "/categorias",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS", "VENTAS"]),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        "SELECT id_categoria, nombre FROM categoria ORDER BY nombre"
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
 * GET /api/stock/unidades
 *  -> Para el combo 'Unidad' (u / kg)
 *  Roles: todos los que pueden ver stock
 * ============================================================ */
router.get(
  "/unidades",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS", "VENTAS"]),
  async (req, res, next) => {
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
  }
);

// ============================
// GET /api/stock/materiales
//  -> Para combo de pesaje (solo materiales activos)
//  Roles: ADMIN, OPERADOR, STOCK (son los que operan pesajes)
// ============================
router.get(
  "/materiales",
  allowRoles(["ADMIN", "OPERADOR", "STOCK"]),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `
        SELECT
          p.id_producto,
          p.nombre,
          p.precio_unitario,
          COALESCE(tp.unidad_stock, 'kg') AS unidad_stock
        FROM productos p
        JOIN tipo_producto tp ON tp.id_tipo_producto = p.id_tipo_producto
        WHERE p.id_tipo_producto = 2           -- 2 = Material
          AND p.estado = TRUE
        ORDER BY p.nombre
        `
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
 * POST /api/stock/productos
 *  Crea un nuevo producto (Caja o Material).
 *  Roles: ADMIN, OPERADOR, STOCK, COMPRAS
 * ============================================================ */
router.post(
  "/productos",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS"]),
  async (req, res) => {
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
      const idTipoProducto = isCaja ? 1 : 2; // 1 = Caja, 2 = Material

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

      // ---------- STOCK INICIAL (AJUSTE MANUAL) ----------
      const cantNum = Number(cantidad ?? 0) || 0;

      await client.query(
        `
        SELECT id_producto_ret, cantidad_anterior, cantidad_nueva, diferencia, unidad_ret
        FROM ajustar_stock_manual($1, $2, $3)
        `,
        [idProducto, cantNum, "Stock inicial al crear producto"]
      );

      await client.query("COMMIT");

      const { rows } = await client.query(
        `SELECT * FROM v_stock_list WHERE id_producto = $1`,
        [idProducto]
      );

      // AUDITORÍA: CREAR_PRODUCTO
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
  }
);

// PUT /api/stock/productos/:id
// Actualiza datos básicos del producto (nombre, medidas / stock / precio / notas)
// Roles: ADMIN, OPERADOR, STOCK, COMPRAS
router.put(
  "/productos/:id",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS"]),
  async (req, res) => {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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

      const isCaja = id_tipo_producto === 1;

      const {
        referencia,
        notas,
        disponible,
        precio,
        unidad,
        medidas = {},
      } = req.body || {};

      let cantidad = 0;
      let precioUnitario = 0;

      if (isCaja) {
        cantidad = parseInt(disponible ?? 0, 10) || 0;
      } else {
        cantidad = Number(disponible ?? 0) || 0;
      }

      precioUnitario = Number(precio ?? 0) || 0;

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

      //  AJUSTE MANUAL DE STOCK en vez de UPDATE directo
      await client.query(
        `
        SELECT id_producto_ret, cantidad_anterior, cantidad_nueva, diferencia, unidad_ret
        FROM ajustar_stock_manual($1, $2, $3)
        `,
        [id, cantidad, "Edición manual desde módulo STOCK"]
      );

      await client.query("COMMIT");

      const { rows } = await client.query(
        `SELECT * FROM v_stock_list WHERE id_producto = $1`,
        [id]
      );

      // AUDITORÍA: MODIFICAR_PRODUCTO
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
  }
);

// DELETE /api/stock/productos/:id
// Baja lógica: marca el producto como inactivo
// Roles: ADMIN, OPERADOR, STOCK, COMPRAS
router.delete(
  "/productos/:id",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS"]),
  async (req, res) => {
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

      // AUDITORÍA: ELIMINAR_PRODUCTO
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
  }
);

// ============================
// POST /api/stock/pesaje
//  -> Registra un pesaje masivo
//  Roles: ADMIN, OPERADOR, STOCK
// ============================
router.post(
  "/pesaje",
  allowRoles(["ADMIN", "OPERADOR", "STOCK"]),
  async (req, res) => {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No hay ítems de pesaje." });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const detalles = [];

      for (const raw of items) {
        const idProducto = Number(raw.id_producto || raw.idProducto);
        const cantidad = Number(raw.cantidad);

        const precioKgRaw = raw.precio_kg ?? raw.precioKg ?? raw.precio ?? null;

        const precioKg =
          precioKgRaw !== null &&
          precioKgRaw !== undefined &&
          precioKgRaw !== ""
            ? Number(precioKgRaw)
            : null;

        const subtotal = precioKg !== null ? cantidad * precioKg : null;

        if (!idProducto || !cantidad || cantidad <= 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Datos de producto/cantidad inválidos en el pesaje.",
          });
        }

        const prodRes = await client.query(
          `
          SELECT p.nombre, tp.unidad_stock
          FROM productos p
          JOIN tipo_producto tp ON tp.id_tipo_producto = p.id_tipo_producto
          WHERE p.id_producto = $1
            AND p.estado = TRUE
            AND p.id_tipo_producto = 2 
          `,
          [idProducto]
        );

        if (!prodRes.rows.length) {
          await client.query("ROLLBACK");
          return res.status(404).json({
            error: `Producto ID ${idProducto} no encontrado, inactivo o no es un material válido para pesaje.`,
          });
        }

        const { nombre, unidad_stock } = prodRes.rows[0];
        const unidad = unidad_stock || "kg";

        const stockRes = await client.query(
          `SELECT id_stock, cantidad
           FROM stock
           WHERE id_producto = $1
           FOR UPDATE`,
          [idProducto]
        );

        if (stockRes.rows.length) {
          const actual = Number(stockRes.rows[0].cantidad || 0);
          const nuevaCantidad = actual + cantidad;

          await client.query(
            `UPDATE stock
             SET cantidad = $1,
                 fecha_ultima_actualiza = now()
             WHERE id_producto = $2`,
            [nuevaCantidad, idProducto]
          );
        } else {
          await client.query(
            `INSERT INTO stock (id_producto, cantidad, fecha_ultima_actualiza)
             VALUES ($1, $2, now())`,
            [idProducto, cantidad]
          );
        }

        const obs =
          raw.observaciones && raw.observaciones.trim()
            ? raw.observaciones.trim()
            : null;

        await client.query(
          `
          INSERT INTO movimientos_stock
            (id_producto, id_tipo_movimiento, cantidad, unidad, precio_kg, subtotal, observaciones)
          VALUES
            ($1, 1, $2, $3, $4, $5, $6)
          `,
          [idProducto, cantidad, unidad, precioKg, subtotal, obs]
        );

        detalles.push({
          idProducto,
          nombre,
          cantidad,
          unidad,
          precioKg,
          subtotal,
        });
      }

      await client.query("COMMIT");

      // AUDITORÍA PESAJE_STOCK
      try {
        const idUsuario = await getUserIdFromToken(req.accessToken);
        const resumen = detalles
          .map((d) => {
            const base = `${d.nombre} (${d.cantidad.toLocaleString("es-AR")} ${
              d.unidad
            })`;
            if (d.precioKg != null) {
              return `${base} a $${
                d.precioKg
              }/kg (subt: $${d.subtotal?.toLocaleString("es-AR")})`;
            }
            return base;
          })
          .join("; ");

        registrarAuditoria(
          idUsuario,
          "PESAJE_STOCK",
          "STOCK",
          `Pesaje registrado: ${resumen}.`
        );
      } catch (errAud) {
        console.error("⚠️ Error auditando pesaje:", errAud.message);
      }

      return res.status(201).json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error registrando pesaje:", err);
      return res.status(500).json({ error: "Error al registrar el pesaje." });
    } finally {
      client.release();
    }
  }
);

// ============================
// GET /api/stock/pesajes
//  -> Historial de pesajes (vista v_pesajes)
//  Roles: ADMIN, OPERADOR, STOCK
// ============================
router.get(
  "/pesajes",
  allowRoles(["ADMIN", "OPERADOR", "STOCK", "COMPRAS", "VENTAS"]),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(`
      SELECT
        id_movimiento,
        fecha,
        id_producto,
        producto,
        tipo_mov,
        cantidad,
        unidad,
        precio_kg,
        subtotal,
        observaciones
      FROM v_mov_materiales
      ORDER BY fecha DESC, id_movimiento DESC
      LIMIT 500
    `);

      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
 * POST /api/stock/actualizar-precios-masivo
 * -> Actualiza precios masivamente por porcentaje
 * Roles: ADMIN, COMPRAS
 * ============================================================ */
router.post(
  "/actualizar-precios-masivo",
  allowRoles(["ADMIN", "COMPRAS"]),
  async (req, res) => {
    const { tipo, porcentaje } = req.body;

    // 1. Validaciones
    if (!tipo || porcentaje === undefined || isNaN(porcentaje)) {
      return res.status(400).json({ 
        error: "Faltan datos obligatorios o el porcentaje no es válido." 
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 2. Llamada a la función SQL
      // Nota: Asume que creaste la función 'ajustar_precios_productos' que recibe (text, numeric)
      const result = await client.query(
        "SELECT ajustar_precios_productos($1, $2) as afectados",
        [tipo, porcentaje]
      );

      await client.query("COMMIT");

      const cantidadAfectada = result.rows[0]?.afectados || 0;

      // 3. Auditoría
      try {
        const idUsuario = await getUserIdFromToken(req.accessToken);
        const accion = Number(porcentaje) > 0 ? "Aumento" : "Descuento";
        
        registrarAuditoria(
          idUsuario,
          "ACTUALIZAR_PRECIOS_MASIVO",
          "STOCK",
          `${accion} del ${porcentaje}% aplicado a '${tipo}'. Productos afectados: ${cantidadAfectada}.`
        );
      } catch (errAud) {
        console.error("⚠️ Error auditando actualización masiva:", errAud.message);
      }

      res.status(200).json({ 
        success: true, 
        message: `Se actualizaron ${cantidadAfectada} productos correctamente.` 
      });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error en actualización masiva:", err);
      res.status(500).json({ error: "Error interno al actualizar precios." });
    } finally {
      client.release();
    }
  }
);

export default router;
