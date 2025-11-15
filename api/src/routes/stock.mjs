// routes/stock.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";

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
    // Caja => se calcula automáticamente en base a las medidas.
    // Material => se usa el texto enviado.
    let nombreCategoria = categoria || null;
    if (isCaja) {
      const L = Number(medidas.l || 0);
      const A = Number(medidas.a || 0);
      const H = Number(medidas.h || 0);
      nombreCategoria = `Caja ${L}x${A}x${H}`;
    }

    let idCategoria = null;
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

      if (result.rows.length) {
        idCategoria = result.rows[0].id_categoria;
      } else {
        result = await client.query(
          `
          INSERT INTO categoria (nombre, descripcion)
          VALUES ($1, $2)
          RETURNING id_categoria
          `,
          [
            nombreCategoria,
            isCaja ? "Categoría generada por dimensiones de caja" : null,
          ]
        );
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
      [referencia, notas || null, idCategoria, idTipoProducto, idMedida, precioNum]
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

    return res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creando producto:", err);
    return res.status(500).json({ error: "Error al crear producto" });
  } finally {
    client.release();
  }
});

export default router;



