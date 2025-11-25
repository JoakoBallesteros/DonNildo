# Don Nildo

Sistema de gestión de **stock, compras, ventas y pesajes** pensado para empresas de reciclado / logística.  
El repo está armado como **monorepo** con dos paquetes:

- `api/` → Backend en **Node + Express**, usando **PostgreSQL en Supabase**.
- `web/` → Frontend en **React + Vite + Tailwind CSS v4**, autenticado contra **Supabase Auth** y hablando con la API.

---

## 🔧 Stack Tecnológico

### Monorepo (raíz)

- `npm workspaces` (`api`, `web`)
- Scripts para levantar API y Web en paralelo con `concurrently` y `wait-on`.

### Backend – `/api`

- Node.js + **Express**
- **Supabase Postgres** como única base de datos
- Cliente `pg` para acceder a la DB
- Integración con **Supabase**:
  - URL del proyecto
  - claves `anon`, `service_role`
  - verificación de JWT emitidos por Supabase (`SUPABASE_JWT_SECRET`)
- Módulos principales:
  - Ventas (alta, modificación, anulación, movimientos de stock)
  - Compras
  - Stock (productos, materiales, pesajes)
  - Auditoría de acciones (usuarios, operaciones, módulo afectado, descripción)

### Frontend – `/web`

- **React 19**, **React Router 7**
- **Vite** + **Tailwind CSS v4**
- Íconos: `lucide-react`
- Cliente HTTP: `axios`
- Cliente **Supabase JS v2** para:
  - Autenticación de usuarios (login, logout, recovery)
  - Obtención del JWT para llamar a la API
- Proxy de desarrollo Vite:
  - `/api` → `http://localhost:4000`
  - `/v1`  → `http://localhost:4000`

---

## 📁 Estructura de Carpetas (resumen)

```txt
DonNildo/
├─ api/                # Backend Express
│  ├─ src/
│  │  ├─ routes/       # Rutas /v1, /api/stock, /api/ventas, etc.
│  │  ├─ middlewares/  # requireAuth, allowRoles, etc.
│  │  ├─ utils/        # auditoría, helpers Supabase, etc.
│  │  └─ server.mjs    # Punto de entrada de la API
│  ├─ package.json
│  └─ .env.example
│
├─ web/                # Frontend React
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/
│  │  └─ lib/          # apiClient, supabaseClient, helpers
│  ├─ vite.config.mts  # Config Vite + proxy /api y /v1
│  ├─ package.json
│  └─ .env.example
│
├─ package.json        # Workspaces, scripts raíz
└─ README.md
```

---

## 🧩 Variables de Entorno

El proyecto usa **dos archivos `.env`** (uno en `api/` y otro en `web/`).  
La idea es copiar los `.env.example` y completarlos.

### 1️⃣ Backend – `api/.env`

Ejemplo:

```env
# Servidor API
PORT=4000
JWT_SECRET=super-secreto
CORS_ORIGIN=http://localhost:5173

# DB (Supabase - pooler 5432/6543)
DATABASE_URL=postgresql://usuario:password@host:puerto/dbname

# Supabase (RLS real por usuario)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Solo servidor (no exponer en el front)
SUPABASE_SERVICE_ROLE=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL a donde vuelve el usuario cuando hace "reset password"
RESET_REDIRECT_URL=http://localhost:5173/auth/reset
```

**Notas:**

- `DATABASE_URL` debe apuntar al **Postgres de Supabase** (podés usar el pooler).
- `SUPABASE_JWT_SECRET` es el secret que usa Supabase para firmar los tokens JWT.
- `CORS_ORIGIN` debe coincidir con la URL del front en dev (`http://localhost:5173`).

---

### 2️⃣ Frontend – `web/.env`

```env
# Modo de autenticación del front
VITE_AUTH_MODE=supabase

# Proyecto Supabase (mismo que usa la API)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx

# URL base de la API vista desde el navegador
# En desarrollo se usa el proxy de Vite, por eso va "/api"
VITE_API_URL=/api
```

**Notas:**

- Estas variables deben empezar con `VITE_` para que Vite las exponga al código.
- En producción `VITE_API_URL` se cambiará a la URL pública donde viva la API  
  (por ejemplo `https://api.midominio.com`).

---

## 💻 Desarrollo local

### 0. Requisitos

- Node.js **20+** (recomendado)
- Cuenta Supabase con un proyecto creado y la base importada
- Tener configuradas las variables de entorno anteriores

---

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/JoakoBallesteros/DonNildo.git
cd DonNildo

# Instala dependencias de raíz + workspaces (api y web)
npm install
```

> Si por alguna razón no se instalan los workspaces, también se puede correr:
> `npm install` dentro de `api/` y dentro de `web/`.

---

### 2. Configurar `.env`

- Copiar `api/.env.example` → `api/.env` y completar con datos reales de Supabase.
- Copiar `web/.env.example` → `web/.env` y completar con:
  - URL del proyecto Supabase
  - `anon key`
  - `VITE_API_URL=/api` (en dev).

---

### 3. Levantar backend y frontend juntos

Desde la raíz del repo:

```bash
# Levanta API en 4000 y, cuando responde /v1/health, levanta el front
npm run dev
```

Scripts disponibles:

- `npm run dev:api` → sólo API (`api/` en modo dev)
- `npm run dev:web` → sólo web (`web/` en modo dev)
- `npm run dev` → ambos en paralelo (modo recomendado)

URLs por defecto:

- Frontend → http://localhost:5173
- API      → http://localhost:4000

---

## 🚀 Guía de Deploy (pre-deploy)

> Esto es un **tutorial paso a paso** genérico.  
> Después se ajusta a la plataforma concreta (Railway, Render, VPS, etc.).

### Paso 1 – Preparar Supabase

1. Crear el proyecto en Supabase.
2. Importar el esquema SQL del proyecto (tablas, vistas, funciones, triggers).
3. Verificar que:
   - La tabla `usuarios` y las RLS estén bien configuradas.
   - Existen los tipos base: `tipo_transaccion`, `tipo_movimiento`, estados, etc.
4. Copiar:
   - `SUPABASE_URL`
   - `anon key` (para front y API)
   - `service_role key` y `JWT secret` (solo backend).

### Paso 2 – Configurar variables de entorno en el servidor

En la plataforma donde deployás:

- Crear variables para **backend** (las del archivo `api/.env`).
- Crear variables para **frontend** (las del archivo `web/.env`, suelen ir como “Environment variables” del build).

En producción:

- `VITE_API_URL` debe apuntar a la URL pública de la API  
  (por ejemplo `https://api.donnildo.com` o `/api` si hay reverse proxy).
- `RESET_REDIRECT_URL` debe ser la URL real del front:  
  `https://app.donnildo.com/auth/reset`.

### Paso 3 – Build del frontend

En el servidor (o en tu máquina si subís el build estático):

```bash
cd web
npm install
npm run build   # genera /dist
```

El contenido de `dist/` se sirve con:

- Un hosting estático (Netlify, Vercel, Cloudflare Pages, etc.), o
- Nginx/Apache apuntando a esa carpeta.

### Paso 4 – Deploy del backend

En el servidor de Node (Railway, Render, VPS, etc.):

```bash
cd api
npm install
npm run start   # NODE_ENV=production
```

Asegurate de exponer el puerto donde corre la API (`PORT`, por defecto 4000) mediante:

- El panel de la plataforma (Railway/Render)
- O la config de Nginx/traefik (si es un VPS).

### Paso 5 – Conectar front y back

1. Ver en qué URL queda publicada la API. Ejemplo:
   - `https://dn-api.onrender.com`
2. Ajustar `VITE_API_URL` en las variables de entorno del front:
   - Ej: `VITE_API_URL=https://dn-api.onrender.com`
3. Volver a hacer build del front si cambiaste las variables y redeploy.

### Paso 6 – Probar el flujo completo

1. Entrar al front en producción.
2. Crear usuario / loguearse con Supabase.
3. Probar:
   - Registrar compra.
   - Registrar venta.
   - Registrar pesaje.
4. Confirmar que el stock y los movimientos se ven bien en Supabase.

---

## ✅ Checklist rápido antes de marcar “listo”

- [ ] La API responde `200 OK` en `/v1/health`.
- [ ] Hay conexión correcta a Supabase (`DATABASE_URL` apunta al proyecto correcto).
- [ ] Los usuarios pueden:
  - [ ] Registrarse / iniciar sesión.
  - [ ] Recuperar contraseña (el link de reset vuelve a `RESET_REDIRECT_URL` correcta).
- [ ] Las **ventas**:
  - [ ] Se guardan en `venta` y `detalle_venta`.
  - [ ] Descuentan stock y registran `movimientos_stock` tipo SALIDA.
- [ ] Las **compras**:
  - [ ] Se guardan en `orden_compra` y `detalle_compra`.
  - [ ] Suman stock y registran `movimientos_stock` tipo ENTRADA.
- [ ] Los **pesajes**:
  - [ ] Insertan movimientos y ajustan stock de materiales.
- [ ] La lista de stock muestra datos coherentes con la tabla `v_stock_list`.
- [ ] `npm run build -w web` termina sin errores.

---

## 🧑‍💻 Equipo y Licencia

- **Equipo:** Equipo BCT  
- **Autoría:** Desarrollo conjunto para fines académicos / internos.  
- **Licencia:** Uso restringido; no se concede una licencia open-source explícita.  
  Para usos externos o comerciales, coordinar previamente con el **Equipo BCT**.
