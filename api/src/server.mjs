import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()
import { pool } from './db.mjs'
import { requireAuth } from './middlewares/requireAuth.mjs'
// import { allowRoles } from './middlewares/allowRoles.mjs' // ← ya no se usa si migrás a RLS
import authRoutes from './routes/auth.mjs'
import usuariosRoutes from './routes/usuarios.mjs'
import rolesRoutes from './routes/roles.mjs'
import ventasRoutes from "./routes/ventas.mjs";
import { supaAsUser } from './lib/supabaseUserClient.mjs'
import { webcrypto } from 'node:crypto'
import adminUsers from "./routes/adminUsers.mjs";
import accountRouter from "./routes/account.mjs";
import auditoriaRoutes from "./routes/auditoria.mjs";
if (!globalThis.crypto) globalThis.crypto = webcrypto



const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))
const allowedOrigins = [
  process.env.CORS_ORIGIN, 
  "http://localhost:5173", 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS bloqueado por origen no permitido"));
  },
  credentials: true
}));
// Rutas
app.use('/v1/auth', authRoutes)
app.use('/v1/usuarios', usuariosRoutes)
app.use('/v1/roles', rolesRoutes)
app.use("/api/ventas", ventasRoutes);

app.use("/v1/admin/users", adminUsers);
app.use("/v1/account", accountRouter);
app.use("/api/auditoria", auditoriaRoutes);

console.log('MODE: supabase-only')
console.log(
  'DB URL:',
  (process.env.DATABASE_URL || '').replace(/\/\/([^:]+):([^@]+)@/, (_m, u) => `//${u}:***@`)
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

// Productos bajo RLS real (sin pool, sin allowRoles)
app.get('/v1/productos', requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { data, error } = await s
    .from('productos')
    .select('*')
    .order('id_producto', { ascending: false })

  if (error) return res.status(400).json({ error: { message: error.message } })
  res.set('Cache-Control', 'no-store')
  res.json({ productos: data })
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => console.log('API on :' + PORT))


