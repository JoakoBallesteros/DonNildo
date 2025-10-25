import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.mjs'
import { supaAsUser } from '../lib/supabaseUserClient.mjs'

const router = Router()

// Listado de roles bajo RLS (lectura para authenticated; cambios solo ADMIN via policies)
router.get('/', requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken)
  const { data, error } = await s
    .from('roles')
    .select('*')
    .order('id_rol', { ascending: true })

  if (error) return res.status(400).json({ error: { message: error.message } })
  res.set('Cache-Control', 'no-store')
  res.json({ roles: data })
})

export default router