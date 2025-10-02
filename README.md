Flujo de trabajo:

1. Configurar Entorno (Byte)
2. Front:
   1. Login
   2. Menu
   3. Compras:
        1. Lista compra
        2. Registrar compra
        3. Modificar compra
        4. Remito
           
   4. Ventas:
        1. Lista venta
        2. Registrar venta
        3. Modificar venta
  
   5. Stock:
        1. Consulta Stock
        2. Registro Pesaje
        3. ABM Productos
        4. ABM Cajas

   6. Users:
        1. Lista Usuarios
        2. ABM Usuarios
        3. Gestion Roles
           
   7. Proveedores:
        1. Lista Proveedores
        2. ABM Proveedores

   8. Reportes:
        1. Lista Reportes
           
   9. Auditoria:
        1. Lista Auditoria
     

Conexion con Docker y pg
Esquema tabla usuarios y roles
Cargar esquema y seed (roles/usuarios)


Paso 3 — API (Express) mínima para /v1/auth/login
- npm init -y
npm i express cors morgan dotenv jsonwebtoken bcryptjs pg
npm i -D nodemon

3.2 .env (API)
