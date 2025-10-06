# DonNildo Monorepo

Monorepo con **API (Node + Express + Postgres)**, **Web (React + Vite)** y **Docker** para levantar la base de datos y pgAdmin.

## Requisitos

- **Node.js 22.x** (recomendado).  

- **Docker + Docker Compose**
- Git

> Si usás Windows, normalizá fin de línea a **LF**:
> crea `.gitattributes` con `* text=auto eol=lf` y ejecutá `git add --renormalize .`.

---

## Estructura

```
infra/
  docker-compose.yml     # DB + pgAdmin
api/
  index.js               # API ESM (Express)
  package.json
  .env.example
  sql/
    001_init.sql
    002_seed.sql
web/
  package.json           # React + Vite
  src/
package.json             # raíz (workspaces + scripts)
```

---

## Variables de entorno

- Los archivos `.env` **no** se versionan. Usá las plantillas `*.env.example`.

# --- Servidor API ---
PORT=5000
NODE_ENV=development

# --- Postgres (solo desarrollo local) ---
PGHOST=localhost
PGPORT=5432
PGDATABASE=reciclados
PGUSER=reciclados
PGPASSWORD=<CAMBIAR_POR_TU_PASSWORD_LOCAL>

# Alternativa para despliegues (Railway/Render): usar UNA sola URL
# DATABASE_URL=postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DBNAME>
# En producción, habilitar SSL y NO poner credenciales reales en el repo.
```

### Web (`web/.env`)
Agregá lo que necesite tu front (por ejemplo, URL de la API):
```ini
VITE_API_URL=http://localhost:5000
```



## Instalación (una vez)

En la **raíz** del repo:

```bash
npm i
```

Esto instala `concurrently` en la raíz y respeta los **workspaces** (`api` y `web`).

---

## Base de Datos con Docker

Compose en `infra/docker-compose.yml`:

- **Postgres 16** (DB: `reciclados` / user: `reciclados` / pass: `reciclados`)
- **pgAdmin** en `http://localhost:5050` (user: `admin@local.com` / pass: `admin`)
- Ejecuta automáticamente **`api/sql/*.sql`** la **primera vez** que se crea el volumen.

Comandos desde la **raíz**:

```bash
# Levantar DB + pgAdmin (en segundo plano)
npm run up

# Ver logs
docker compose -f infra/docker-compose.yml logs -f db

# Bajar contenedores
npm run down

# Recrear DB desde cero (vuelve a correr todos los .sql)
npm run reseed
```

**pgAdmin → Add New Server**
- Host: `db`
- User: `reciclados`
- Password: `reciclados`
- Database: `reciclados`

**Ejecutar un .sql puntual (sin borrar datos)**
```bash
docker exec -i dn_db psql -U reciclados -d reciclados -f /docker-entrypoint-initdb.d/002_seed.sql
```

---

## Correr en desarrollo

Desde la **raíz**:

```bash
# 1) DB arriba
npm run up

# 2) API + Web en paralelo
npm run dev
```

- **API**: `http://localhost:5000`
  - Health: `GET /health`
  - Ping DB: `GET /api/ping-db`
- **Web** (Vite): `http://localhost:5173`

Comandos separados:
```bash
npm run dev:api
npm run dev:web
```

---

## Scripts (raíz)

```json
{
  "scripts": {
    "up": "docker compose -f infra/docker-compose.yml up -d",
    "down": "docker compose -f infra/docker-compose.yml down",
    "reseed": "docker compose -f infra/docker-compose.yml down -v && docker compose -f infra/docker-compose.yml up -d",
    "dev:api": "npm run dev -w api",
    "dev:web": "npm run dev -w web",
    "dev": "concurrently -n API,WEB \"npm run dev:api\" \"npm run dev:web\""
  }
}
```

---

## Estilo de código

- **API** en **ESM** (`"type": "module"`).
- Front con **Vite + React**.
- (Opcional) Agregar ESLint/Prettier/Husky.

---

## Flujo de trabajo con Git (resumen)

Configuración recomendable (una sola vez):
```bash
git config --global pull.rebase true
git config --global rebase.autoStash true
git config --global init.defaultBranch main
```

Día a día:
```bash
# actualizar y crear rama
git fetch origin
git switch main
git pull
git switch -c feat/mi-feature

# trabajar, commitear en pasos chicos
git add -A
git commit -m "feat: algo"

# sincronizar con main
git fetch origin
git rebase origin/main   # (o git pull --rebase)

# publicar y PR
git push -u origin feat/mi-feature
```

Cerrar PR:
```bash
git switch main
git pull
git branch -d feat/mi-feature
git push origin --delete feat/mi-feature   # opcional
```

---

## Troubleshooting

- **Puerto 5432 ocupado** → cambia a `5433:5432` en `infra/docker-compose.yml` y:
  ```bash
  npm run down
  npm run up
  ```
- **Web no encuentra API** → verificá `VITE_API_URL`.
- **DB no toma los .sql** → los scripts de `api/sql` solo corren **la primera vez** (cuando el volumen es nuevo). Para forzar:
  ```bash
  npm run reseed
  ```

---

## Deploy (pista rápida)

- **API**: soporta `DATABASE_URL` (Railway/Render). Habilitar SSL en prod.
- **Web**: `npm run build` en `web/` y servís `dist/` (Netlify/Vercel/Cloudflare Pages).

---

## Licencia

Privado / uso interno del equipo.
