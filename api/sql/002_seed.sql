-- ==========================================================
-- 002_seed.sql
-- Datos iniciales base del sistema Don Nildo
-- ==========================================================

-- ==============================
-- 1. EXTENSIONES Y ROLES
-- ==============================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO roles (nombre, descripcion)
VALUES
  ('ADMIN', 'Administrador del sistema'),
  ('OPERADOR', 'Operador de ventas y stock')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 2. USUARIO ADMIN
-- ==============================
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
-- 3. ESTADOS
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
-- 4. MEDIDAS
-- ==============================
INSERT INTO medida (nombre, simbolo)
VALUES
  ('Unidad', 'u'),
  ('Kilogramo', 'kg'),
  ('Litro', 'L'),
  ('Metro', 'm')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 5. CATEGORÍAS
-- ==============================
INSERT INTO categoria (nombre, descripcion)
VALUES
  ('Cajas', 'Envases y cajas biodegradables'),
  ('Papeles', 'Productos de papel kraft y derivados'),
  ('Bolsas', 'Bolsas y envoltorios ecológicos'),
  ('Accesorios', 'Complementos de embalaje y rotulación')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 6. TIPOS DE PRODUCTO
-- ==============================
INSERT INTO tipo_producto (nombre, descripcion)
VALUES
  ('Producto terminado', 'Producto final listo para la venta'),
  ('Materia prima', 'Insumo utilizado en la producción'),
  ('Componente', 'Elemento intermedio del proceso productivo')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 7. TIPOS DE MOVIMIENTO DE STOCK
-- ==============================
INSERT INTO tipo_movimiento (nombre, descripcion)
VALUES
  ('ENTRADA', 'Ingreso de stock por compra o devolución'),
  ('SALIDA', 'Salida de stock por venta o merma'),
  ('AJUSTE', 'Corrección manual de stock por control de inventario')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 8. TIPO DE TRANSACCIÓN (AUDITORÍA)
-- ==============================
INSERT INTO tipo_transaccion (nombre, descripcion)
VALUES
  ('INSERT', 'Inserción de nuevo registro'),
  ('UPDATE', 'Modificación de registro existente'),
  ('DELETE', 'Eliminación de registro existente')
ON CONFLICT (nombre) DO NOTHING;

-- ==============================
-- 9. PRODUCTOS DE PRUEBA
-- ==============================
INSERT INTO productos (nombre, descripcion, precio_unitario, stock_actual, id_categoria, id_medida, id_tipo_producto, estado)
SELECT
  'Caja biodegradable 250ml',
  'Caja fabricada con bagazo de caña de azúcar',
  180.50,
  100,
  (SELECT id_categoria FROM categoria WHERE nombre='Cajas'),
  (SELECT id_medida FROM medida WHERE nombre='Unidad'),
  (SELECT id_tipo_producto FROM tipo_producto WHERE nombre='Producto terminado'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Caja biodegradable 250ml');

INSERT INTO productos (nombre, descripcion, precio_unitario, stock_actual, id_categoria, id_medida, id_tipo_producto, estado)
SELECT
  'Bolsa ecológica mediana',
  'Bolsa reciclable de papel kraft',
  95.00,
  200,
  (SELECT id_categoria FROM categoria WHERE nombre='Bolsas'),
  (SELECT id_medida FROM medida WHERE nombre='Unidad'),
  (SELECT id_tipo_producto FROM tipo_producto WHERE nombre='Producto terminado'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Bolsa ecológica mediana');

INSERT INTO productos (nombre, descripcion, precio_unitario, stock_actual, id_categoria, id_medida, id_tipo_producto, estado)
SELECT
  'Papel envoltorio kraft',
  'Rollo de 50 metros de papel ecológico',
  1200.00,
  25,
  (SELECT id_categoria FROM categoria WHERE nombre='Papeles'),
  (SELECT id_medida FROM medida WHERE nombre='Metro'),
  (SELECT id_tipo_producto FROM tipo_producto WHERE nombre='Materia prima'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Papel envoltorio kraft');

-- ==============================
-- 10. CLIENTES DE PRUEBA
-- ==============================
INSERT INTO clientes (nombre, telefono, mail, direccion)
VALUES
  ('Comercio Verde', '3815555555', 'contacto@comercioverde.com', 'Av. Sustentable 123'),
  ('EcoStore', '3814444444', 'info@ecostore.com', 'Calle Reciclaje 456')
ON CONFLICT (mail) DO NOTHING;

-- ==============================
-- 11. VENTAS DE PRUEBA
-- ==============================
INSERT INTO ventas (id_cliente, id_usuario, fecha, total, estado)
SELECT
  (SELECT id_cliente FROM clientes WHERE nombre='Comercio Verde'),
  (SELECT id_usuario FROM usuarios WHERE mail='admin@local.com'),
  CURRENT_DATE,
  180.50,
  'COMPLETADO'
WHERE NOT EXISTS (SELECT 1 FROM ventas WHERE total=180.50);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
SELECT
  (SELECT id_venta FROM ventas LIMIT 1),
  (SELECT id_producto FROM productos WHERE nombre='Caja biodegradable 250ml'),
  1,
  180.50,
  180.50
WHERE NOT EXISTS (SELECT 1 FROM detalle_venta WHERE subtotal=180.50);

-- ==========================================================
-- FIN DEL SEED
-- ==========================================================
