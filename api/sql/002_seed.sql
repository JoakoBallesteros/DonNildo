-- ==========================================================
-- 002_seed.sql
-- Datos iniciales base del sistema Don Nildo
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
