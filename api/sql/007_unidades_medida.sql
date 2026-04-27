-- ==========================================================
-- 007_unidades_medida.sql
-- Elimina el hardcoding de unidades y establece unidad_stock como fuente de verdad
-- ==========================================================

-- 1. Asegurar que la columna existe y tiene un valor por defecto
ALTER TABLE tipo_producto ADD COLUMN IF NOT EXISTS unidad_stock TEXT DEFAULT 'u';

-- 2. Asegurar que los tipos clásicos tienen su unidad correcta (si ya existen)
UPDATE tipo_producto SET unidad_stock = 'u' WHERE id_tipo_producto = 1;
UPDATE tipo_producto SET unidad_stock = 'kg' WHERE id_tipo_producto = 2;

-- 3. Actualizar la vista de stock principal para no usar hardcoding
DROP VIEW IF EXISTS v_stock_list;

CREATE OR REPLACE VIEW v_stock_list AS
 SELECT p.id_producto,
    p.nombre AS referencia,
    p.id_tipo_producto,
    tp.nombre AS tipo_producto_nombre,
    p.precio_unitario AS precio,
    p.moneda,
    s.cantidad AS disponible,
    s.fecha_ultima_actualiza AS ultimo_mov,
    COALESCE(tp.unidad_stock, 'u') AS unidad_stock,
    p.id_categoria,
    c.nombre AS categoria,
    p.id_medida,
    m.nombre AS medida_nombre,
    m.alto,
    m.ancho,
    m.profundidad,
    p.descripcion AS notas
   FROM productos p
     LEFT JOIN stock s ON s.id_producto = p.id_producto
     LEFT JOIN tipo_producto tp ON tp.id_tipo_producto = p.id_tipo_producto
     LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
     LEFT JOIN medida m ON m.id_medida = p.id_medida
  WHERE p.estado = true;
