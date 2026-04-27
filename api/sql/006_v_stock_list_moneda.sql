-- ==========================================================
-- 006_v_stock_list_moneda.sql
-- Actualiza la vista v_stock_list para incluir moneda
-- ==========================================================
DROP VIEW IF EXISTS v_stock_list;

CREATE OR REPLACE VIEW v_stock_list AS
 WITH tipo_unidad AS (
         SELECT tp.id_tipo_producto,
                CASE
                    WHEN (tp.unidad_stock IS NOT NULL) THEN tp.unidad_stock
                    WHEN (tp.id_tipo_producto = 1) THEN 'u'::text
                    WHEN (tp.id_tipo_producto = 2) THEN 'kg'::text
                    ELSE 'u'::text
                END AS unidad_stock
           FROM tipo_producto tp
        )
 SELECT p.id_producto,
    p.nombre AS referencia,
    p.id_tipo_producto,
    p.precio_unitario AS precio,
    p.moneda,
    s.cantidad AS disponible,
    s.fecha_ultima_actualiza AS ultimo_mov,
    tu.unidad_stock,
    p.id_categoria,
    c.nombre AS categoria,
    p.id_medida,
    m.nombre AS medida_nombre,
    m.alto,
    m.ancho,
    m.profundidad,
    p.descripcion AS notas
   FROM ((((productos p
     LEFT JOIN stock s ON ((s.id_producto = p.id_producto)))
     LEFT JOIN tipo_unidad tu ON ((tu.id_tipo_producto = p.id_tipo_producto)))
     LEFT JOIN categoria c ON ((c.id_categoria = p.id_categoria)))
     LEFT JOIN medida m ON ((m.id_medida = p.id_medida)))
  WHERE (p.estado = true);
