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
     

reciclados/
├─ infra/
│  └─ docker-compose.yml
│
├─ web/                      # React + Tailwind (JavaScript)
│  ├─ index.html
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ tailwind.config.js
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.jsx
│     ├─ index.css
│     ├─ styles/
│     │  └─ components.css   # tus clases @apply (btn, card, input, etc.)
│     ├─ api.js              # axios/fetch wrapper + setToken()
│     ├─ layouts/
│     │  ├─ AuthLayout.jsx   # layout de login (con <Outlet/>)
│     │  └─ AppLayout.jsx    # layout de app (navbar+sidebar+<Outlet/>)
│     ├─ pages/
│     │  ├─ LoginPage.jsx
│     │  ├─ HomePage.jsx
│     │  └─ ProvidersPage.jsx
│     ├─ components/
│     │  ├─ Button.jsx
│     │  ├─ TextInput.jsx
│     │  ├─ Select.jsx
│     │  ├─ Checkbox.jsx
│     │  ├─ Card.jsx
│     │  ├─ Modal.jsx
│     │  ├─ SectionHeader.jsx
│     │  ├─ SidebarLink.jsx
│     │  └─ DataTable.jsx
│     └─ assets/
│        └─ logo.svg         # opcional
│
├─ api/                      # Node.js + Express + pg (JavaScript)
│  ├─ package.json
│  ├─ .env.example           # PORT, JWT_SECRET, DATABASE_URL
│  ├─ src/
│  │  ├─ server.js           # app.use(...), rutas y arranque
│  │  ├─ db.js               # pg Pool (con env)
│  │  ├─ routes/
│  │  │  ├─ auth.js          # POST /v1/auth/login
│  │  │  └─ providers.js     # CRUD /v1/providers
│  │  ├─ middleware/
│  │  │  └─ auth.js          # requireAuth (si lo separan)
│  │  └─ utils/
│  │     └─ responses.js     # opcional: helpers de respuesta
│  └─ sql/
│     ├─ 001_init.sql        # tablas users, suppliers, etc.
│     └─ 002_seed.sql        # usuario admin, datos mínimos
│
├─ .gitignore
└─ README.md                 # cómo correr infra/web/api
