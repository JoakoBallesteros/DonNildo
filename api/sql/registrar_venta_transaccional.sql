CREATE OR REPLACE FUNCTION registrar_venta_transaccional(
    p_productos    JSONB,
    p_observaciones TEXT
)
RETURNS TABLE (
    id_venta_ret INT,
    total_ret    NUMERIC,
    estado_ret   TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_estado_completado INT;
    v_id_tipo_mov_salida   INT;
    v_id_venta             INT;
    v_total                NUMERIC := 0;

    v_item         JSONB;
    v_id_producto  INT;
    v_cantidad     NUMERIC;
    v_stock_disp   NUMERIC;
    v_unidad       TEXT;
BEGIN
    -- 1) IDs de catálogo
    SELECT id_estado
    INTO v_id_estado_completado
    FROM estado
    WHERE nombre = 'COMPLETADO';

    SELECT id_tipo_movimiento
    INTO v_id_tipo_mov_salida
    FROM tipo_movimiento
    WHERE nombre = 'SALIDA';

    IF v_id_estado_completado IS NULL
       OR v_id_tipo_mov_salida IS NULL
    THEN
        RAISE EXCEPTION
          'Faltan datos de configuración (estado COMPLETADO o tipo movimiento SALIDA).';
    END IF;

    -- 2) Total de la venta (usa el subtotal que ya viene del front)
    SELECT SUM((v->>'subtotal')::numeric)
    INTO v_total
    FROM jsonb_array_elements(p_productos) AS v;

    -- 3) Cabecera de venta
    INSERT INTO venta (fecha, id_estado, total, observaciones)
    VALUES (CURRENT_DATE, v_id_estado_completado, v_total, p_observaciones)
    RETURNING id_venta INTO v_id_venta;

    -- 4) Iterar items
    FOR v_item IN
        SELECT jsonb_array_elements(p_productos)
    LOOP
        v_id_producto := (v_item->>'id_producto')::int;
        v_cantidad    := (v_item->>'cantidad')::numeric;

        -- Verificar stock
        SELECT COALESCE(cantidad, 0)
        INTO v_stock_disp
        FROM stock
        WHERE id_producto = v_id_producto;

        IF v_stock_disp < v_cantidad THEN
            RAISE EXCEPTION
              'STOCK_INSUFICIENTE: Producto ID % requiere % unidades, disponible %.',
              v_id_producto, v_cantidad, v_stock_disp;
        END IF;

        -- Detalle de venta
        INSERT INTO detalle_venta (
            id_venta,
            id_producto,
            cantidad,
            precio_unitario,
            subtotal
        )
        VALUES (
            v_id_venta,
            v_id_producto,
            v_cantidad,
            (v_item->>'precio')::numeric,
            (v_item->>'subtotal')::numeric
        );

        -- Unidad del producto (u / kg)
        SELECT COALESCE(tp.unidad_stock, 'u')
        INTO v_unidad
        FROM productos p
        LEFT JOIN tipo_producto tp
               ON tp.id_tipo_producto = p.id_tipo_producto
        WHERE p.id_producto = v_id_producto;

        -- Actualizar stock (SALIDA)
        UPDATE stock
        SET cantidad = cantidad - v_cantidad,
            fecha_ultima_actualiza = NOW()
        WHERE id_producto = v_id_producto;

        -- Movimiento de stock (SALIDA) con unidad, precio y subtotal
        INSERT INTO movimientos_stock (
            id_producto,
            id_tipo_movimiento,
            cantidad,
            unidad,
            precio_kg,
            subtotal,
            observaciones
        )
        VALUES (
            v_id_producto,
            v_id_tipo_mov_salida,
            v_cantidad,
            v_unidad,
            (v_item->>'precio')::numeric,
            (v_item->>'subtotal')::numeric,
            'Venta N°' || v_id_venta
        );
    END LOOP;

    -- 5) Valores de retorno
    RETURN QUERY
    SELECT v_id_venta   AS id_venta_ret,
           v_total      AS total_ret,
           'COMPLETADO' AS estado_ret;
END;
$$;
