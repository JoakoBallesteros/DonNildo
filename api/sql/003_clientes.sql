CREATE TABLE IF NOT EXISTS clientes (
    id_cliente       SERIAL PRIMARY KEY,
    tipo_persona     TEXT NOT NULL DEFAULT 'JURIDICA', -- FISICA, JURIDICA
    tipo_documento   TEXT NOT NULL DEFAULT 'CUIT',     -- CUIT, DNI, CUIL
    numero_documento TEXT NOT NULL,
    razon_social     TEXT NOT NULL,
    nombre_fantasia  TEXT,
    condicion_iva    TEXT NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    email            TEXT,
    telefono         TEXT,
    direccion        TEXT,
    localidad        TEXT,
    provincia        TEXT,
    codigo_postal    TEXT,
    lista_precios_id INT,
    descuento_global NUMERIC(5,2) DEFAULT 0,
    tiene_cuenta_cte BOOLEAN DEFAULT FALSE,
    limite_credito   NUMERIC(14,2) DEFAULT 0,
    saldo_cuenta     NUMERIC(14,2) DEFAULT 0,
    observaciones    TEXT,
    estado           BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_doc ON clientes(tipo_documento, numero_documento);

-- Vincular ventas existentes
ALTER TABLE venta ADD COLUMN IF NOT EXISTS id_cliente INT REFERENCES clientes(id_cliente);

-- Movimientos de cuenta corriente
CREATE TABLE IF NOT EXISTS cuenta_corriente (
    id_movimiento   SERIAL PRIMARY KEY,
    id_cliente      INT NOT NULL REFERENCES clientes(id_cliente),
    tipo            TEXT NOT NULL, -- CARGO, PAGO, NOTA_CREDITO, AJUSTE
    monto           NUMERIC(14,2) NOT NULL,
    saldo_resultante NUMERIC(14,2) NOT NULL,
    referencia_id   INT,          
    referencia_tipo TEXT,         
    descripcion     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
