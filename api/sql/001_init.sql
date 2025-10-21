-- ==========================================================
--  SCRIPT DE CREACIÓN DE BASE DE DATOS DON NILDO
--  Modelo físico generado desde D.E.R. (PostgreSQL)
--  Autor: Sofía Kosciani
--  Fecha: 2025-10-21
-- ==========================================================

-- ===========================================
-- 1. EXTENSIONES
-- ===========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===========================================
-- 2. TABLAS DE SEGURIDAD
-- ===========================================

CREATE TABLE roles (
  id_rol SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  dni TEXT UNIQUE,
  nombre TEXT NOT NULL,
  hash_contrasena TEXT NOT NULL,
  mail TEXT NOT NULL UNIQUE,
  id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_usuarios_mail ON usuarios(mail);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- ===========================================
-- 3. CATÁLOGOS Y TABLAS AUXILIARES
-- ===========================================

CREATE TABLE categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE tipo_producto (
  id_tipo_producto SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE medida (
  id_medida SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  simbolo TEXT NOT NULL
);

CREATE TABLE estado (
  id_estado SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- ===========================================
-- 4. PRODUCTOS Y STOCK
-- ===========================================

CREATE TABLE productos (
  id_producto SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  id_categoria INT REFERENCES categoria(id_categoria) ON DELETE RESTRICT,
  id_tipo_producto INT REFERENCES tipo_producto(id_tipo_producto) ON DELETE RESTRICT,
  id_medida INT REFERENCES medida(id_medida) ON DELETE RESTRICT,
  precio_unitario NUMERIC(12,2) NOT NULL,
  stock_actual NUMERIC(14,3) DEFAULT 0,
  estado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tipo_movimiento (
  id_tipo_movimiento SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE movimientos_stock (
  id_movimiento SERIAL PRIMARY KEY,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
  id_tipo_movimiento INT NOT NULL REFERENCES tipo_movimiento(id_tipo_movimiento) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  fecha TIMESTAMP DEFAULT now(),
  observacion TEXT
);

-- ===========================================
-- 5. CLIENTES Y PROVEEDORES
-- ===========================================

CREATE TABLE cliente (
  id_cliente SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  mail TEXT
);

CREATE TABLE proveedor (
  id_proveedor SERIAL PRIMARY KEY,
  razon_social TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  mail TEXT,
  cuit TEXT
);

-- ===========================================
-- 6. VENTAS
-- ===========================================

CREATE TABLE venta (
  id_venta SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  id_cliente INT REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
  id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observaciones TEXT
);

CREATE TABLE detalle_venta (
  id_detalle_venta SERIAL PRIMARY KEY,
  id_venta INT NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  descuento NUMERIC(5,2) DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL
);

-- ===========================================
-- 7. COMPRAS
-- ===========================================

CREATE TABLE orden_compra (
  id_orden_compra SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  id_proveedor INT REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT,
  id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  id_estado INT REFERENCES estado(id_estado) ON DELETE RESTRICT,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observaciones TEXT
);

CREATE TABLE detalle_compra (
  id_detalle_compra SERIAL PRIMARY KEY,
  id_orden_compra INT NOT NULL REFERENCES orden_compra(id_orden_compra) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
  cantidad NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL
);

CREATE TABLE remito (
  id_remito SERIAL PRIMARY KEY,
  id_orden_compra INT NOT NULL REFERENCES orden_compra(id_orden_compra) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  numero TEXT,
  observaciones TEXT
);

-- ===========================================
-- 8. AUDITORÍA
-- ===========================================

CREATE TABLE tipo_transaccion (
  id_tipo_transaccion SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE log_auditoria (
  id_log SERIAL PRIMARY KEY,
  tabla_afectada TEXT NOT NULL,
  id_registro_afectado INT,
  tipo_operacion TEXT NOT NULL, -- INSERT / UPDATE / DELETE
  usuario TEXT,
  fecha TIMESTAMP DEFAULT now(),
  datos_viejos JSONB,
  datos_nuevos JSONB
);

-- ===========================================
-- 9. FUNCIÓN Y TRIGGER DE AUDITORÍA
-- ===========================================

CREATE OR REPLACE FUNCTION fn_log_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO log_auditoria(tabla_afectada, id_registro_afectado, tipo_operacion, usuario, datos_viejos)
    VALUES (TG_TABLE_NAME, OLD.id_venta, TG_OP, current_user, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO log_auditoria(tabla_afectada, id_registro_afectado, tipo_operacion, usuario, datos_viejos, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id_venta, TG_OP, current_user, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO log_auditoria(tabla_afectada, id_registro_afectado, tipo_operacion, usuario, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id_venta, TG_OP, current_user, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA TABLAS CLAVE
CREATE TRIGGER tr_audit_venta
AFTER INSERT OR UPDATE OR DELETE ON venta
FOR EACH ROW EXECUTE FUNCTION fn_log_auditoria();

CREATE TRIGGER tr_audit_producto
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_log_auditoria();

CREATE TRIGGER tr_audit_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_log_auditoria();

-- ===========================================
-- 10. DATOS BASE (ADMIN)
-- ===========================================

INSERT INTO roles (nombre, descripcion)
VALUES ('ADMIN', 'Administrador del sistema'),
       ('OPERADOR', 'Operador de ventas y stock')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuarios (dni, nombre, hash_contrasena, mail, id_rol, estado)
SELECT
  '20000000',
  'Administrador',
  crypt('admin123', gen_salt('bf', 10)),
  'admin@local.com',
  (SELECT id_rol FROM roles WHERE nombre='ADMIN'),
  'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE mail='admin@local.com');

-- ===========================================
-- FIN DEL SCRIPT
-- ===========================================
