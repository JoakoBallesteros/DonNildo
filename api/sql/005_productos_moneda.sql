-- ==========================================================
-- 005_productos_moneda.sql
-- Añadir moneda a la tabla de productos
-- ==========================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'ARS';

-- Actualizar productos existentes a ARS por defecto (ya lo hace el DEFAULT, pero por las dudas)
UPDATE productos SET moneda = 'ARS' WHERE moneda IS NULL;
