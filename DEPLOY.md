# Guía de Deploy — Don Nildo (Equipo BCT)

Este documento resume cómo preparar y publicar el proyecto **Don Nildo** usando:
- **API Node/Express** (`/api`)
- **Frontend React + Vite** (`/web`)
- **Base de datos y autenticación** con **Supabase**

Está pensado como _pre‑deploy_ y como guía para publicar en proveedores típicos (Railway, Netlify, Render, Vercel).

---

## 1. Arquitectura del proyecto

- **Monorepo npm workspaces**
  - `package.json` raíz con `workspaces: ["api", "web"]`
- **Backend**
  - Carpeta: `api/`
  - Stack: Node.js + Express + `pg` (ESM)
  - Se conecta a **Supabase Postgres** mediante `DATABASE_URL`
  - Usa **Supabase** también para ciertas integraciones (por ejemplo, Auth / RPC)
- **Frontend**
  - Carpeta: `web/`
  - Stack: React + Vite + Tailwind 4
  - Se comunica con la API vía `/api` y `/v1` (en local) o mediante una `VITE_API_BASE_URL`/similar en producción
  - Usa `@supabase/supabase-js` para conectarse a Supabase desde el navegador
- **Base de datos**
  - Supabase (Postgres gestionado)
  - Funciones y vistas para:
    - Ventas / Compras transaccionales
    - Movimientos de stock
    - Pesajes
    - Auditoría

---

## 2. Checklist previa (antes del primer deploy)

### 2.1. Requisitos locales

- Node.js 20+ instalado
- npm (gestor por defecto)
- Cuenta en GitHub (o similar) con el repo subido
- Cuenta en **Supabase** con el proyecto creado

### 2.2. Datos necesarios de Supabase

Desde el panel de Supabase:

- **URL del proyecto** → suele ser algo como `https://xxxxx.supabase.co`
- **Anon key** → para el frontend
- **Service role key** → para el backend (no exponer en el navegador)
- **Connection string Postgres** (para `DATABASE_URL`), algo como:

  ```text
  postgres://usuario:password@host:5432/postgres?sslmode=require
  ```

### 2.3. Variables de entorno mínimas

> ⚠️ Los nombres concretos pueden variar según cómo esté escrito tu código.
> Acá se proponen nombres típicos; adaptalos si ya tenés otros en tu `.env`.

#### a) Backend (`api/.env`)

```env
NODE_ENV=production

# Conexión a Supabase Postgres
DATABASE_URL=postgres://usuario:password@host:5432/postgres?sslmode=require

# Auth / JWT
JWT_SECRET=poné_un_valor_seguro_y_largo

# Supabase (service role, sólo backend)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# CORS / orígenes permitidos
ALLOWED_ORIGINS=https://tu-frontend.com,http://localhost:5173

# URL pública del frontend en producción
APP_ORIGIN=https://tu-frontend.com
```

#### b) Frontend (`web/.env` o `.env.production`)

```env
# URL pública de la API (Railway, Render, etc.)
VITE_API_BASE_URL=https://tu-api.up.railway.app

# Supabase para el frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Otros
VITE_APP_NAME=Don Nildo
```

### 2.4. Verificación en local

Desde la raíz del repo:

```bash
npm install
npm run dev
```

- Verificar que:
  - La API responde en `http://localhost:4000/v1/health` (o ruta de health que tengas).
  - El frontend se ve en `http://localhost:5173` y puede:
    - Loguearse
    - Listar stock
    - Registrar ventas / compras / pesajes
  - Los movimientos de stock se reflejan bien en Supabase.

Si algo falla en local, corregilo antes de intentar publicar.

---

## 3. Estrategia de deploy recomendada

Una estrategia simple y robusta es:

- **Backend (API)** → [Railway](https://railway.app/) o [Render](https://render.com/)
- **Frontend (Vite React)** → [Netlify](https://www.netlify.com/) o [Vercel](https://vercel.com/)
- **Base de datos** → ya está en Supabase, no hace falta “deployarla”.

En este documento se detalla principalmente:

1. **Opción A (recomendada)**
   - API en **Railway**
   - Front en **Netlify**
2. **Opción B (alternativa)**
   - API en **Render**
   - Front en **Vercel**

---

## 4. Deploy de la API en Railway (Opción A)

### 4.1. Preparar el código para producción

Asegurate de que en `api/src/server.mjs` se use el puerto de entorno:

```js
const PORT = process.env.PORT || 4000;
// app.listen(PORT, ...)
```

Railway va a inyectar `PORT`; si no lo usás, la app no levantará correctamente.

### 4.2. Crear servicio en Railway

1. Iniciá sesión en [Railway](https://railway.app/).
2. Creá un nuevo proyecto → **Deploy from GitHub Repo** y seleccioná el repo de Don Nildo.
3. En la configuración del servicio:

   - **Root Directory**: `api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`  
     (usa `"start": "cross-env NODE_ENV=production node src/server.mjs"` del `package.json` de `api`)

4. En la sección **Variables** cargá las de `api/.env`:

   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS`
   - `APP_ORIGIN`
   - `NODE_ENV=production`

5. Guardá cambios y ejecutá un deploy desde el panel de Railway.

### 4.3. Verificar API en producción

- Railway te dará una URL pública, algo como:
  - `https://donnildo-api.up.railway.app`
- Probá en el navegador o con `curl`/Postman:

  ```bash
  curl https://donnildo-api.up.railway.app/v1/health
  ```

- Si responde OK, ya podés apuntar el frontend a esa URL.

---

## 5. Deploy del frontend en Netlify (Opción A)

### 5.1. Configuración básica (desde Git)

1. Iniciá sesión en [Netlify](https://app.netlify.com/).
2. **Add new site → Import from Git** y seleccioná el repo de Don Nildo.
3. Configuración de build:
   - **Base directory**: `web`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist`

4. En **Site settings → Environment variables**, añadí las de `web/.env`:

   - `VITE_API_BASE_URL=https://donnildo-api.up.railway.app`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   - `VITE_APP_NAME=Don Nildo`

5. Guardá y ejecutá el deploy.

### 5.2. Soporte para SPA (React Router)

Si usás React Router (que es lo habitual), Netlify necesita una regla de redirect
para que todo lo que no sea archivo real vuelva a `index.html`.

En la carpeta `web/`, creá un archivo `public/_redirects` con:

```txt
/*   /index.html   200
```

O bien un `netlify.toml` en `web/`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Volvé a hacer deploy si agregás estas reglas.

### 5.3. Verificación del frontend

- Abrí la URL que Netlify te asigna, por ejemplo:
  - `https://donnildo.netlify.app`
- Comprobá:
  - Que podés loguearte sin errores de CORS.
  - Que las listas de stock, ventas, compras se cargan.
  - Que al registrar una venta/compra/pesaje el movimiento aparece en Supabase.

---

## 6. Opción B: Render (API) + Vercel (Web)

### 6.1. API en Render (resumen)

1. Iniciá sesión en [Render](https://render.com/).
2. **New → Web Service** desde tu repo de GitHub.
3. Configuración:

   - **Root directory**: `api`
   - **Runtime**: Node
   - **Build command**: `npm install`
   - **Start command**: `npm start`

4. Añadí las mismas variables de entorno que en Railway (`DATABASE_URL`, `JWT_SECRET`, etc.).
5. Deploy y verificá la ruta `/v1/health` en la URL pública de Render.

### 6.2. Frontend en Vercel (resumen)

1. Iniciá sesión en [Vercel](https://vercel.com/).
2. **Add New → Project** y seleccioná el repo.
3. Configuración del proyecto:

   - **Framework**: Vite (u “Other” y luego ajustás a mano)
   - **Root directory**: `web`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`

4. En **Environment Variables**, añadí:

   - `VITE_API_BASE_URL=https://tu-api.onrender.com` (o el dominio que tengas)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`

5. Deploy y probá la app en la URL de Vercel.

---

## 7. Checklist de verificación post‑deploy

Usá esta checklist rápida cada vez que hagas un deploy:

- [ ] La API responde en `/v1/health` en producción.
- [ ] El frontend carga sin errores de JS en consola.
- [ ] Login / logout funcionan correctamente.
- [ ] Registro de **ventas**:
  - [ ] Se descuenta stock y se registra movimiento en `movimientos_stock`.
  - [ ] La venta aparece en la lista de ventas.
- [ ] Registro de **compras**:
  - [ ] Se incrementa stock y se registran movimientos de entrada.
  - [ ] La compra aparece en la lista de compras.
- [ ] **Pesajes**:
  - [ ] Se pueden registrar pesajes sin romper el stock.
  - [ ] Los registros figuran en el historial de pesajes.
- [ ] CORS OK (no hay errores de `Access-Control-Allow-Origin` en consola).
- [ ] URLs de reset / confirmación de email de Supabase apuntan al frontend correcto.

Si todo esto pasa, podés considerar el deploy como exitoso.

---

## 8. Notas finales

- Mantener los `.env` **fuera del repo** (no subir claves a GitHub).
- Documentar en el equipo (BCT) qué variables se usan y en qué proveedor.
- Cuando cambies algo crítico de la BD (nuevas funciones, vistas, triggers):
  - [ ] Probar primero en Supabase (SQL editor).
  - [ ] Luego verificar que la API y el frontend lo consumen bien.
- Si más adelante se migra a otra plataforma (Fly.io, Docker en VPS, etc.),
  esta guía sirve como base: la estructura de variables y los comandos de
  build/start serán muy similares.
