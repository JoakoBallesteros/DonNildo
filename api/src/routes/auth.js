import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
export const auth = Router()

// POST /v1/auth/login  { mail, password }
auth.post('/login', async (req, res) => {
  const { mail, password } = req.body || {}
  if (!mail || !password) return res.status(400).json({ error: 'MISSING_FIELDS' })

  const { rows } = await pool.query(`
    select u.id_usuario, u.hash_contrasena, u.estado, u.mail,
           r.id_rol, r.nombre as rol
    from usuarios u
    join roles r on r.id_rol = u.id_rol
    where lower(u.mail) = lower($1)
  `, [mail])

  const u = rows[0]
  if (!u || !(await bcrypt.compare(password, u.hash_contrasena)))
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
  if (u.estado !== 'ACTIVO')
    return res.status(401).json({ error: 'USER_DISABLED' })

  const token = jwt.sign(
    { uid: u.id_usuario, mail: u.mail, rol: u.rol, idRol: u.id_rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.json({ token, usuario: { id: u.id_usuario, mail: u.mail, rol: u.rol } })
})