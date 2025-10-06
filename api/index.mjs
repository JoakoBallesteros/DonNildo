import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const app = express()

// Middlewares básicos
app.use(cors())
app.use(express.json())

// Config DB (prioriza DATABASE_URL si existe, útil en Railway/Render)
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.PGHOST ,
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD
      }
)

// Probar conexión al iniciar
;(async () => {
  try {
    const { rows } = await pool.query('SELECT NOW() as now')
    console.log(`✅ DB OK - ${rows[0].now}`)
  } catch (err) {
    console.error('❌ Error conectando a la DB:', err.message)
  }
})()

// Healthcheck
app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 as ok')
    res.json({ status: 'ok', db: rows[0].ok === 1 })
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message })
  }
})

// Ejemplo simple: versión
app.get('/api/version', (req, res) => {
  res.json({ name: 'dn-api', version: '1.0.0', env: process.env.NODE_ENV || 'development' })
})

// Ejemplo query a la DB (ajusta a tu esquema real)
app.get('/api/ping-db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as now')
    res.json({ ok: true, now: rows[0].now })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Manejo 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = Number(process.env.PORT || 5000)
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`)
})

// Apagado gracioso
process.on('SIGINT', async () => {
  console.log('\nCerrando pool de Postgres...')
  await pool.end().catch(() => {})
  process.exit(0)
})
