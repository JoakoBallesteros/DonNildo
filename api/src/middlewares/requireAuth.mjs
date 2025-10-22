import { supa } from '../lib/supabaseClient.mjs'
import { pool } from '../db.mjs'

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'NO_TOKEN' })

  try {
    if (!supa) return res.status(500).json({ error: 'SUPABASE_CLIENT_NOT_CONFIGURED' })
    const { data, error } = await supa.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'INVALID_TOKEN' })

    const idAuth = data.user.id
    const email = (data.user.email || '').toLowerCase()

    // Buscá o auto-provisioná el usuario app (roles, etc.)
    const { rows } = await pool.query(
      `SELECT u.*, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.id_auth = $1 OR LOWER(u.mail) = LOWER($2)
        LIMIT 1`,
      [idAuth, email]
    )
    let u = rows[0]

    if (!u) {
      const { rows: rolRows } = await pool.query(
        `SELECT id_rol FROM roles WHERE nombre='OPERADOR' LIMIT 1`
      )
      const idRol = rolRows[0]?.id_rol
      const ins = await pool.query(
        `INSERT INTO usuarios (dni, nombre, hash_contrasena, mail, id_rol, estado, id_auth)
         VALUES (NULL, $1, '', $2, $3, 'ACTIVO', $4)
         RETURNING id_usuario`,
        [email?.split('@')[0] || 'Usuario', email, idRol, idAuth]
      )
      const { rows: just } = await pool.query(
        `SELECT u.*, r.nombre AS rol
           FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
          WHERE u.id_usuario = $1`,
        [ins.rows[0].id_usuario]
      )
      u = just[0]
    }

    if (u.estado !== 'ACTIVO') return res.status(401).json({ error: 'USER_DISABLED' })

    req.user = { id: u.id_usuario, mail: u.mail, rol: u.rol, idRol: u.id_rol, idAuth }
    next()
  } catch (e) {
    console.error('requireAuth error:', e)
    res.status(401).json({ error: 'INVALID_OR_EXPIRED' })
  }
}