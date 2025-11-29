// api/src/routes/dashboard.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

router.use(requireAuth);

router.get(
  "/resumen",
  allowRoles(["ADMIN"]),
  async (req, res, next) => {
    try {
      const [
        { rows: [ventasMes] },
        { rows: [comprasMes] },
        { rows: [pesajesMes] },
        { rows: [stockCritico] },
        { rows: ventasPorDia },
        { rows: kilosPorMaterial },
      ] = await Promise.all([

        // ==============================
        // VENTAS DEL MES
        // ==============================
        pool.query(`
          SELECT
            COUNT(*)::int                       AS cantidad,
            COALESCE(SUM(v.total), 0)::numeric  AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
        `),

        // ==============================
        // COMPRAS DEL MES  (CORREGIDO)
        // ==============================
        pool.query(`
          SELECT
            COUNT(*)::int                      AS cantidad,
            COALESCE(SUM(oc.total), 0)::numeric AS total
          FROM orden_compra oc
          LEFT JOIN estado e ON e.id_estado = oc.id_estado
          WHERE oc.fecha >= date_trunc('month', current_date)
            AND (e.nombre IS NULL OR e.nombre <> 'ANULADA')
        `),

        // ==============================
        // PESAJE DEL MES
        // ==============================
        pool.query(`
          SELECT
            COUNT(*)::int                        AS movimientos,
            COALESCE(SUM(ms.cantidad), 0)::numeric AS kilos_totales
          FROM movimientos_stock ms
          JOIN tipo_movimiento tm
            ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
          JOIN productos p
            ON p.id_producto = ms.id_producto
          WHERE tm.nombre = 'ENTRADA'
            AND p.id_tipo_producto = 2
            AND ms.fecha >= date_trunc('month', current_date)
        `),

        // ==============================
        // STOCK CRÍTICO
        // ==============================
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE s.cantidad = 0)::int AS sin_stock,
            COUNT(*)::int                               AS productos_activos
          FROM stock s
          JOIN productos p ON p.id_producto = s.id_producto
          WHERE p.estado = TRUE
        `),

        // ==============================
        // VENTAS POR DÍA
        // ==============================
        pool.query(`
          SELECT
            to_char(v.fecha, 'DD')             AS dia,
            COALESCE(SUM(v.total), 0)::numeric AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
          GROUP BY 1
          ORDER BY 1
        `),

        // ==============================
        // KILOS POR MATERIAL
        // ==============================
        pool.query(`
          SELECT
            p.nombre                               AS material,
            COALESCE(SUM(ms.cantidad), 0)::numeric AS kilos
          FROM movimientos_stock ms
          JOIN tipo_movimiento tm
            ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
          JOIN productos p
            ON p.id_producto = ms.id_producto
          WHERE tm.nombre = 'ENTRADA'
            AND p.id_tipo_producto = 2
            AND ms.fecha >= date_trunc('month', current_date)
          GROUP BY p.nombre
          ORDER BY p.nombre
        `),

      ]);

      res.json({
        ventasMes,
        comprasMes,
        pesajesMes,
        stockCritico,
        ventasPorDia,
        kilosPorMaterial,
      });
    } catch (err) {
      console.error("Error en /api/dashboard/resumen:", err);
      next(err);
    }
  }
);


//REPORTES GRAFICOS// ============================================
// GET /api/dashboard/categoria
// ============================================
router.get(
  "/categoria",
  requireAuth,
  allowRoles(["ADMIN"]),
  async (req, res) => {
    try {
      const periodo = req.query.periodo || "meses";
      const origen  = req.query.origen  || "ventas";

      let rangoSQL = "";
      let labelSQL = "";

      if (periodo === "dias") {
        rangoSQL = "current_date - interval '7 days'";
        labelSQL = "to_char(x.fecha, 'DD Mon')";
      } else if (periodo === "semanas") {
        rangoSQL = "current_date - interval '8 weeks'";
        labelSQL = "to_char(x.fecha, 'IW')";
      } else {
        rangoSQL = "current_date - interval '6 months'";
        labelSQL = "to_char(x.fecha, 'Mon')";
      }

      const tabla       = origen === "compras" ? "orden_compra" : "venta";
      const detalle     = origen === "compras" ? "detalle_compra" : "detalle_venta";
      const idDocumento = origen === "compras" ? "id_compra" : "id_venta";

      const query = `
        SELECT 
          ${labelSQL} AS label,
          SUM(CASE WHEN p.id_tipo_producto = 1 THEN d.subtotal ELSE 0 END)::numeric AS cajas,
          SUM(CASE WHEN p.id_tipo_producto = 2 THEN d.subtotal ELSE 0 END)::numeric AS materiales
        FROM ${tabla} x
        JOIN ${detalle} d ON d.${idDocumento} = x.${idDocumento}
        JOIN productos p ON p.id_producto = d.id_producto
        LEFT JOIN estado e ON e.id_estado = x.id_estado
        WHERE x.fecha >= ${rangoSQL}
          AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
        GROUP BY label
        ORDER BY MIN(x.fecha);
      `;

      const { rows } = await pool.query(query);
      res.json(rows);

    } catch (error) {
      console.error("ERROR categoria:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
router.get(
  "/stock-material",
  requireAuth,
  allowRoles(["ADMIN", "COMPRAS", "VENTAS"]),
  async (req, res) => {
    try {
      const query = `
        WITH total AS (
          SELECT SUM(s.cantidad) AS total
          FROM stock s
          JOIN productos p ON p.id_producto = s.id_producto
          WHERE p.id_tipo_producto = 2
        )
        SELECT 
          p.nombre AS material,
          SUM(s.cantidad)::numeric AS cantidad,
          ROUND( (SUM(s.cantidad) / (SELECT total FROM total)) * 100 , 2 ) AS porcentaje
        FROM stock s
        JOIN productos p ON p.id_producto = s.id_producto
        WHERE p.id_tipo_producto = 2
        GROUP BY p.nombre
        ORDER BY cantidad DESC;
      `;

      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("ERROR stock-material:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

//mas vendidos
router.get(
  "/top-productos",
  requireAuth,
  allowRoles(["ADMIN", "VENTAS"]),
  async (req, res) => {
    try {
      const query = `
        SELECT 
          p.nombre AS producto,
          SUM(dv.cantidad)::numeric AS total_cantidad
        FROM detalle_venta dv
        JOIN productos p ON p.id_producto = dv.id_producto
        JOIN venta v ON v.id_venta = dv.id_venta
        JOIN estado e ON e.id_estado = v.id_estado
        WHERE e.nombre = 'COMPLETADO'
        GROUP BY p.nombre
        ORDER BY total_cantidad DESC
        LIMIT 5;
      `;

      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("ERROR top productos:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

//Kilos
router.get(
  "/pesajes-mes",
  requireAuth,
  allowRoles(["ADMIN", "COMPRAS", "VENTAS"]),
  async (req, res) => {
    try {
      const query = `
        SELECT 
          p.nombre AS material,
          COALESCE(SUM(ms.cantidad), 0)::numeric AS kilos
        FROM movimientos_stock ms
        JOIN tipo_movimiento tm 
          ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
        JOIN productos p 
          ON p.id_producto = ms.id_producto
        WHERE tm.nombre = 'ENTRADA'
          AND p.id_tipo_producto = 2
          AND ms.fecha >= date_trunc('month', CURRENT_DATE)
        GROUP BY p.nombre
        ORDER BY kilos DESC;
      `;

      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("ERROR pesajes-mes:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
