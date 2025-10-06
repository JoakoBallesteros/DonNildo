import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.mjs'

export const auth = Router()

// POST /v1/auth/login  { mail, password }
auth.post('/login', async (req, res) => {
  const { mail, password } = req.body || {}
  if (!mail || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS' })
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT u.id_usuario, u.hash_contrasena, u.estado, u.mail,
             r.id_rol, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON r.id_rol = u.id_rol
      WHERE LOWER(u.mail) = LOWER($1)
      `,
      [mail]
    )

    const u = rows[0]

    // Credenciales inválidas
    if (!u || !(await bcrypt.compare(password, u.hash_contrasena))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    }

    // Usuario inactivo
    if (u.estado !== 'ACTIVO') {
      return res.status(401).json({ error: 'USER_DISABLED' })
    }

    // Generar token JWT
    const token = jwt.sign(
      { uid: u.id_usuario, mail: u.mail, rol: u.rol, idRol: u.id_rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: { id: u.id_usuario, mail: u.mail, rol: u.rol }
    })
  } catch (err) {
    console.error('Error en login:', err)
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})