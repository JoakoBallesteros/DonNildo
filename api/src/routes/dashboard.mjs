// api/src/routes/dashboard.mjs
import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

router.use(requireAuth);

// Solo ADMIN puede ver el dashboard
router.get(
  "/resumen",
  allowRoles(["ADMIN"]),
  async (req, res, next) => {
    try {
      const client = await pool.connect();
      try {
        // 1) Ventas del mes (tabla: venta)
        const { rows: [ventasMes] } = await client.query(`
          SELECT
            COUNT(*)::int                     AS cantidad,
            COALESCE(SUM(v.total), 0)::numeric AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
        `);

        // 2) Compras del mes (tabla: orden_compra)
        const { rows: [comprasMes] } = await client.query(`
          SELECT
            COUNT(*)::int                      AS cantidad,
            COALESCE(SUM(oc.total), 0)::numeric AS total
          FROM orden_compra oc
          WHERE oc.fecha >= date_trunc('month', current_date)
            AND (oc.estado IS NULL OR oc.estado <> 'ANULADA')
        `);

        // 3) Pesajes del mes (entradas de materiales)
        const { rows: [pesajesMes] } = await client.query(`
          SELECT
            COUNT(*)::int                        AS movimientos,
            COALESCE(SUM(ms.cantidad), 0)::numeric AS kilos_totales
          FROM movimientos_stock ms
          JOIN tipo_movimiento tm
            ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
          JOIN productos p
            ON p.id_producto = ms.id_producto
          WHERE tm.nombre = 'ENTRADA'
            AND p.id_tipo_producto = 2             -- 2 = Material
            AND ms.fecha >= date_trunc('month', current_date)
        `);

        // 4) Stock crítico
        const { rows: [stockCritico] } = await client.query(`
          SELECT
            COUNT(*) FILTER (WHERE s.cantidad = 0)::int AS sin_stock,
            COUNT(*)::int                             AS productos_activos
          FROM stock s
          JOIN productos p ON p.id_producto = s.id_producto
          WHERE p.estado = TRUE
        `);

        // 5) Serie: ventas por día del mes
        const { rows: ventasPorDia } = await client.query(`
          SELECT
            to_char(v.fecha, 'DD')                   AS dia,
            COALESCE(SUM(v.total), 0)::numeric       AS total
          FROM venta v
          LEFT JOIN estado e ON e.id_estado = v.id_estado
          WHERE v.fecha >= date_trunc('month', current_date)
            AND (e.nombre = 'COMPLETADO' OR e.nombre IS NULL)
          GROUP BY 1
          ORDER BY 1
        `);

        // 6) Serie: kilos por material en el mes
        const { rows: kilosPorMaterial } = await client.query(`
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
        `);

        res.json({
          ventasMes,
          comprasMes,
          pesajesMes,
          stockCritico,
          ventasPorDia,
          kilosPorMaterial,
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error en /api/dashboard/resumen:", err);
      next(err);
    }
  }
);

export default router;
