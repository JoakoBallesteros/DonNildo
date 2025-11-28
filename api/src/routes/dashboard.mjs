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
        pool.query(`
          SELECT
            COUNT(*)::int                     AS cantidad,
            COALESCE(SUM(v.total), 0)::numeric AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
        `),
        pool.query(`
          SELECT
            COUNT(*)::int                      AS cantidad,
            COALESCE(SUM(oc.total), 0)::numeric AS total
          FROM orden_compra oc
          WHERE oc.fecha >= date_trunc('month', current_date)
            AND (oc.estado IS NULL OR oc.estado <> 'ANULADA')
        `),
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
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE s.cantidad = 0)::int AS sin_stock,
            COUNT(*)::int                             AS productos_activos
          FROM stock s
          JOIN productos p ON p.id_producto = s.id_producto
          WHERE p.estado = TRUE
        `),
        pool.query(`
          SELECT
            to_char(v.fecha, 'DD')                   AS dia,
            COALESCE(SUM(v.total), 0)::numeric       AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
          GROUP BY 1
          ORDER BY 1
        `),
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

export default router;
