import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.mjs'
import { attachRole } from '../middlewares/attachRole.mjs'
import { allowRoles } from '../middlewares/allowRoles.mjs'
import { supaAsUser } from '../lib/supabaseUserClient.mjs'   // <-- NUEVO

const router = Router()

// LISTAR
router.get('/', requireAuth, attachRole, allowRoles('ADMIN','SUPERVISOR'), async (req, res) => {
  const s = supaAsUser(req.accessToken)   // <-- NO uses `supa` (service_role)
  const { data, error } = await s
    .from('usuarios')
    .select('id_usuario,dni,nombre,mail,estado,id_rol,roles(id_rol,nombre)')
    .order('id_usuario', { ascending: false })


  if (error) {
  console.error('usuarios list error:', {
    message: error.message,
    name: error.name,
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status,
  })
  return res.status(400).json({ error: { message: error.message } })
}
  const usuarios = (data || []).map(u => ({ ...u, rol_nombre: u.roles?.nombre ?? null }))
  res.set('Cache-Control', 'no-store')
  res.json({ usuarios })
})

// OBTENER UNO
router.get('/:id', requireAuth, attachRole, allowRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { data, error } = await s
    .from('usuarios')
    .select('id_usuario,dni,nombre,mail,estado,id_rol,id_auth,roles(id_rol,nombre)')
    .eq('id_usuario', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ error: { message: 'No encontrado' } })
  res.json(data)
})

// CREAR
router.post('/', requireAuth, attachRole, allowRoles('ADMIN'), async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { dni, nombre, mail, id_rol, estado = 'ACTIVO' } = req.body || {}
  if (!nombre || !mail || !id_rol) return res.status(400).json({ error: { message: 'Faltan datos' } })

  const { data, error } = await s.from('usuarios').insert({ dni, nombre, mail, id_rol, estado }).select().single()
  if (error) return res.status(400).json({ error: { message: error.message } })
  res.status(201).json(data)
})

// UPDATE
router.put('/:id', requireAuth, attachRole, allowRoles('ADMIN', 'SUPERVISOR'), async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { dni, nombre, mail, id_rol, estado } = req.body || {}

  const { data, error } = await s
    .from('usuarios')
    .update({ dni, nombre, mail, id_rol, estado })
    .eq('id_usuario', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: { message: error.message } })
  res.json(data)
})

// SOFT-DELETE
router.delete('/:id', requireAuth, attachRole, allowRoles('ADMIN'), async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { error } = await s.from('usuarios').update({ estado: 'INACTIVO' }).eq('id_usuario', req.params.id)
  if (error) return res.status(400).json({ error: { message: error.message } })
  res.json({ ok: true })
})

export default router