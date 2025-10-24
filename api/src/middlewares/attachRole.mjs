// api/src/middlewares/attachRole.mjs
import { supa } from '../lib/supabaseClient.mjs'

export async function attachRole(req, res, next) {
  try {
    const { data, error } = await supa
      .from('usuarios')
      .select('id_rol, roles(nombre)')
      .eq('id_auth', req.user.idAuth)
      .single()

    if (error) return res.status(401).json({ error: 'USER_NOT_PROVISIONED' })

    req.user.role = data?.roles?.nombre || null
    req.user.idRol = data?.id_rol || null
    next()
  } catch (e) {
    next(e)
  }
}