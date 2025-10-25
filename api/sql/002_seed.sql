-- ==========================================================
-- 002_seed.sql
-- Datos iniciales base del sistema Don Nildo
-- ==========================================================
--Prueba de interfaz Registrar Ventas
-- ==============================
-- 1️⃣ PRODUCTOS DE PRUEBA
-- ==============================
INSERT INTO productos (nombre, id_categoria, id_tipo_producto, id_medida, precio_unitario, estado)
SELECT
  'Caja Pritty 20x20x10',
  (SELECT id_categoria FROM categoria WHERE nombre='Cajas'),
  (SELECT id_tipo_producto FROM tipo_producto WHERE nombre='Producto terminado'),
  (SELECT id_medida FROM medida WHERE nombre='Unidad'),
  250.00,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Caja Pritty 20x20x10');

INSERT INTO productos (nombre, id_categoria, id_tipo_producto, id_medida, precio_unitario, estado)
SELECT
  'Plástico Stretch 500m',
  (SELECT id_categoria FROM categoria WHERE nombre='Accesorios'),
  (SELECT id_tipo_producto FROM tipo_producto WHERE nombre='Producto terminado'),
  (SELECT id_medida FROM medida WHERE nombre='Kilogramo'),
  1800.00,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Plástico Stretch 500m');

-- ==============================
-- 2️⃣ VENTA DE PRUEBA MIXTA
-- ==============================
INSERT INTO venta (fecha, id_estado, total, observaciones)
SELECT
  CURRENT_DATE,
  (SELECT id_estado FROM estado WHERE nombre='COMPLETADO'),
  2050.00,
  'MIXTA'
WHERE NOT EXISTS (SELECT 1 FROM venta WHERE total=2050.00);

-- ==============================
-- 3️⃣ DETALLES DE LA VENTA
-- ==============================
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
SELECT
  (SELECT id_venta FROM venta WHERE total=2050.00),
  (SELECT id_producto FROM productos WHERE nombre='Caja Pritty 20x20x10'),
  10,  -- 10 unidades
  250.00,
  2500.00
WHERE NOT EXISTS (SELECT 1 FROM detalle_venta WHERE subtotal=2500.00);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
SELECT
  (SELECT id_venta FROM venta WHERE total=2050.00),
  (SELECT id_producto FROM productos WHERE nombre='Plástico Stretch 500m'),
  5,   -- 5 kg
  1800.00,
  9000.00
WHERE NOT EXISTS (SELECT 1 FROM detalle_venta WHERE subtotal=9000.00);

-- ==========================================================
-- FIN DEL SEED DE PRUEBA DE VENTAS
-- ==========================================================



-- ==============================
-- 1. ROLES Y USUARIO ADMIN
-- ==============================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO roles (nombre, descripcion)
VALUES
  ('ADMIN', 'Administrador del sistema'),
  ('OPERADOR', 'Operador de ventas y stock')
ON CONFLICT (nombre) DO NOTHING;

-- admin@local.com / admin123
INSERT INTO usuarios (dni, nombre, hash_contrasena, mail, id_rol, estado)
SELECT
  '20000000',
  'Administrador',
  crypt('admin123', gen_salt('bf', 10)),
  'admin@local.com',
  (SELECT id_rol FROM roles WHERE nombre='ADMIN'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE mail='admin@local.com');

-- ==============================
-- 2. ESTADOS
-- ==============================
INSERT INTO estado (nombre, descripcion)
VALUES
  ('ACTIVO', 'Registro activo en el sistema'),
  ('INACTIVO', 'Registro deshabilitado'),
  ('PENDIENTE', 'Pendiente de aprobación o entrega'),
  ('COMPLETADO', 'Proceso finalizado correctamente'),
  ('ANULADO', 'Registro cancelado o anulado')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 3. MEDIDAS
-- ==============================
INSERT INTO medida (nombre, simbolo)
VALUES
  ('Unidad', 'u'),
  ('Kilogramo', 'kg'),
  ('Litro', 'L'),
  ('Metro', 'm')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 4. CATEGORÍAS
-- ==============================
INSERT INTO categoria (nombre, descripcion)
VALUES
  ('Cajas', 'Envases y cajas biodegradables'),
  ('Papeles', 'Productos de papel kraft y derivados'),
  ('Bolsas', 'Bolsas y envoltorios ecológicos'),
  ('Accesorios', 'Complementos de embalaje y rotulación')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 5. TIPOS DE PRODUCTO
-- ==============================
INSERT INTO tipo_producto (nombre, descripcion)
VALUES
  ('Producto terminado', 'Producto final listo para la venta'),
  ('Materia prima', 'Insumo utilizado en la producción'),
  ('Componente', 'Elemento intermedio del proceso productivo')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 6. TIPOS DE MOVIMIENTO DE STOCK
-- ==============================
INSERT INTO tipo_movimiento (nombre, descripcion)
VALUES
  ('ENTRADA', 'Ingreso de stock por compra o devolución'),
  ('SALIDA', 'Salida de stock por venta o merma'),
  ('AJUSTE', 'Corrección manual de stock por control de inventario')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 7. TIPO DE TRANSACCIÓN (AUDITORÍA)
-- ==============================
INSERT INTO tipo_transaccion (nombre, descripcion)
VALUES
  ('INSERT', 'Inserción de nuevo registro'),
  ('UPDATE', 'Modificación de registro existente'),
  ('DELETE', 'Eliminación de registro existente')
ON CONFLICT (nombre) DO NOTHING;

-- ==========================================================
-- FIN DEL SEED
-- ==========================================================
