CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===========================================
-- 2. TABLAS DE SEGURIDAD
-- ===========================================
CREATE TABLE IF NOT EXISTS roles (
  id_rol SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  dni TEXT UNIQUE,
  nombre TEXT NOT NULL,
  hash_contrasena TEXT, -- NULL si viene de Supabase Auth
  mail TEXT NOT NULL,
  id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  id_auth UUID UNIQUE, -- vinculación con Supabase Auth
  created_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_mail_lower_unique
  ON usuarios (LOWER(mail));
CREATE INDEX IF NOT EXISTS idx_usuarios_estado
  ON usuarios (estado);

-- Vincular a tabla interna de Supabase Auth (si existe)
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuarios_auth_users'
    ) THEN
      ALTER TABLE usuarios
      ADD CONSTRAINT fk_usuarios_auth_users
      FOREIGN KEY (id_auth)
      REFERENCES auth.users (id)
      ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- ===========================================
-- 3. CATÁLOGOS Y TABLAS AUXILIARES
-- ===========================================
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS tipo_producto (
  id_tipo_producto SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS medida (
  id_medida SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  simbolo TEXT NOT NULL,
  alto NUMERIC(10,2),
  ancho NUMERIC(10,2),
  profundidad NUMERIC(10,2),
  CONSTRAINT unique_medida_nombre_simbolo UNIQUE (nombre, simbolo)
);

CREATE TABLE IF NOT EXISTS estado (
  id_estado SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS tipo_movimiento (
  id_tipo_movimiento SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  signo CHAR(1),
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS tipo_transaccion (
  id_tipo_transaccion SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS politicas_seguridad (
  id_politica SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  valor TEXT
);

-- ===========================================
-- 4. PRODUCTOS Y STOCK
-- ===========================================
CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  id_categoria INT REFERENCES categoria(id_categoria) ON DELETE RESTRICT,
  id_tipo_producto INT REFERENCES tipo_producto(id_tipo_producto) ON DELETE RESTRICT,
  id_medida INT REFERENCES medida(id_medida) ON DELETE RESTRICT,
  precio_unitario NUMERIC(12,2) NOT NULL,
  estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stock (
  id_stock SERIAL PRIMARY KEY,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
  cantidad NUMERIC(14,3) NOT NULL,
  fecha_ultima_actualiza TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimientos_stock (
  id_movimiento SERIAL PRIMARY KEY,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
  id_tipo_movimiento INT NOT NULL REFERENCES tipo_movimiento(id_tipo_movimiento) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  fecha TIMESTAMP DEFAULT now(),
  unidad TEXT,
  observaciones TEXT
);

-- ===========================================
-- 5. PROVEEDORES
-- ===========================================
CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor SERIAL PRIMARY KEY,
  cuit TEXT UNIQUE,
  nombre TEXT NOT NULL,
  contacto TEXT,
  direccion TEXT
);

-- ===========================================
-- 6. COMPRAS
-- ===========================================
CREATE TABLE IF NOT EXISTS orden_compra (
  id_compra SERIAL PRIMARY KEY,
  id_proveedor INT REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT,
  id_tipo_transaccion INT REFERENCES tipo_transaccion(id_tipo_transaccion) ON DELETE RESTRICT,
  total NUMERIC(14,2) DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones TEXT,
  estado TEXT
);

CREATE TABLE IF NOT EXISTS detalle_compra (
  id_detalle SERIAL PRIMARY KEY,
  id_compra INT NOT NULL REFERENCES orden_compra(id_compra) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS remitos (
  id_remito SERIAL PRIMARY KEY,
  id_compra INT REFERENCES orden_compra(id_compra) ON DELETE CASCADE,
  fecha DATE DEFAULT CURRENT_DATE,
  proveedor TEXT,
  tipo_compra TEXT,
  producto TEXT,
  cantidad NUMERIC(14,3),
  importe NUMERIC(14,2),
  observaciones TEXT
);

-- ===========================================
-- 7. VENTAS
-- ===========================================
CREATE TABLE IF NOT EXISTS venta (
  id_venta SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle_venta SERIAL PRIMARY KEY,
  id_venta INT NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL
);

-- ===========================================
-- 8. AUDITORÍA
-- ===========================================
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuarios(id_usuario),
  fecha_hora TIMESTAMP DEFAULT now(),
  evento TEXT,
  modulo TEXT,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS log_auditoria (
  id_log SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuarios(id_usuario),
  fecha_hora TIMESTAMP DEFAULT now(),
  nivel TEXT,
  origen TEXT,
  mensaje TEXT
);

-- ===========================================
-- 9. DATOS BASE
-- ===========================================
INSERT INTO roles (nombre, descripcion)
VALUES 
('ADMIN', 'Administrador del sistema'),
('OPERADOR', 'Operador de ventas y stock')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuarios (dni, nombre, hash_contrasena, mail, id_rol, estado)
SELECT
  '20000000',
  'Administrador',
  crypt('admin123', gen_salt('bf', 10)),
  'admin@local.com',
  (SELECT id_rol FROM roles WHERE nombre = 'ADMIN'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE mail = 'admin@local.com');

INSERT INTO estado (nombre, descripcion)
VALUES 
('ACTIVO', 'Registro activo en el sistema'),
('INACTIVO', 'Registro deshabilitado'),
('ANULADO', 'Registro anulado'),
('COMPLETADO', 'Proceso finalizado')
ON CONFLICT (nombre) DO NOTHING;

-- ===========================================
-- FIN DEL SCRIPT
-- ===========================================