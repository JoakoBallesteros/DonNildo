CREATE TABLE IF NOT EXISTS listas_precios (
    id_lista SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    porcentaje_variacion NUMERIC(5,2) DEFAULT 0, -- ej: 10.00 para 10% recargo, -5.00 para 5% descuento
    moneda TEXT DEFAULT 'ARS', -- ARS o USD
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lista Base predeterminada (1)
INSERT INTO listas_precios (nombre, descripcion, porcentaje_variacion, moneda)
SELECT 'Lista Base', 'Precio de lista sin modificaciones', 0, 'ARS'
WHERE NOT EXISTS (SELECT 1 FROM listas_precios WHERE nombre = 'Lista Base');

-- Añadir FK a clientes si no está definida
ALTER TABLE clientes
  DROP CONSTRAINT IF EXISTS fk_clientes_lista_precios;
  
ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_lista_precios 
  FOREIGN KEY (lista_precios_id) REFERENCES listas_precios(id_lista) ON DELETE SET NULL;
