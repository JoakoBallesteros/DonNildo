import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { pool } from './db.mjs'
import { requireAuth } from './middlewares/requireAuth.mjs'
import { allowRoles } from './middlewares/allowRoles.mjs'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

console.log('MODE: supabase-only')
console.log(
  'DB URL:',
  (process.env.DATABASE_URL || '').replace(/\/\/([^:]+):([^@]+)@/, (_m,u)=>`//${u}:***@`)
)

// ------ Health ------
app.get('/v1/health', (_req, res) => {
  res.json({ ok: true, mode: 'supabase' })
})
app.get('/v1/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok')
    res.json({ ok: rows[0]?.ok === 1, mode: 'supabase' })
  } catch (e) {
    console.error('DB health error:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ------ Endpoints protegidos ------
app.get('/v1/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get('/v1/productos', requireAuth, allowRoles('ADMIN', 'OPERADOR'), async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM productos ORDER BY id_producto DESC')
  res.json(rows)
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => console.log('API on :' + PORT))


