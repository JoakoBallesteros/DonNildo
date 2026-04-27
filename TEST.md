Guía de Simulación (Fase 4 y 5 combinadas)
Paso 1: Crear una Lista de Precios de prueba

Andá a Ventas > Listas de Precios.
Tocá en + Nueva Lista.
Ponele de nombre: TEST-MAYORISTA.
Moneda dejala en ARS y ponele un Porcentaje de Variación de 10 (para simular un recargo del +10%).
Paso 2: Crear un Cliente de prueba

Andá a Ventas > Clientes.
Tocá en + Nuevo Cliente.
Ponele de nombre: Cliente de Prueba. Documento: 11111111.
En el campo "Lista de Precios Asignada", elegí la que creaste recién (TEST-MAYORISTA (+10%)).
Guardalo.
Paso 3: Crear un Producto de prueba en Dólares

Andá a Stock.
Tocá en + Nuevo producto.
Pestaña Material (o Caja, el que prefieras).
Nombre: Producto TEST USD.
En Precio Unitario, ponele 10. Y al lado, en Moneda, elegí Dólares (USD).
En Cantidad inicial, ponele 100 (así tenemos stock para vender).
Guardalo.
Paso 4: ¡La Magia! Registrar la Venta

Andá a Ventas > Nueva Venta.
Seleccioná al Cliente: Elegí Cliente de Prueba.
Agregá el producto: Buscá Producto TEST USD.
Fijate lo que pasa acá: El sistema automáticamente va a agarrar tus $10 USD, los va a multiplicar por la cotización oficial del día (ej: si está a $1000, te da $10.000 ARS). Luego, como el cliente tiene la lista TEST-MAYORISTA (+10%), el precio unitario del producto debería aparecer automáticamente en $11.000 ARS.
Poné cantidad 1, agregalo a la tabla y dale a Guardar Venta.
Paso 5: Limpiar la basura (Rollback)

Andá al Historial de Ventas. Vas a ver tu venta ahí. Tocá el botón de Anular. Esto va a devolver el producto al stock automáticamente.
Andá a Stock, buscá Producto TEST USD, tocale "Eliminar". (Esto lo oculta del sistema).
Andá a Clientes, buscá Cliente de Prueba, tocale "Eliminar".
Andá a Listas de Precios, buscá TEST-MAYORISTA y eliminala.