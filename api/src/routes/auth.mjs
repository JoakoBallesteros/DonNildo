// api/src/routes/auth.mjs
import { Router } from 'express'
import { supaAsUser } from '../lib/supabaseUserClient.mjs'
import { requireAuth } from '../middlewares/requireAuth.mjs'

const router = Router()

// --- RESET PASSWORD (sin cambios) ---
router.post('/password/reset', async (req, res) => {
  /* ... tu código actual ... */
})

// --- NUEVO: touch-session opcional (RLS, sin service_role) ---
router.post('/touch-session', requireAuth, async (req, res) => {
  // 💡 Auditoría de LOGIN/SESIÓN: Se asume que esta ruta se llama después del login exitoso
  const userId = await getUserIdFromToken(req.accessToken);
  
  // Lanzamos la auditoría sin esperar la respuesta
  registrarAuditoria(userId, 'Login/Session', 'Seguridad', `Inicio/Refresco de sesión OK para usuario ID ${userId}`);
  const s = supaAsUser(req.accessToken) // el token del usuario actual
  const { error } = await s
    .from('usuarios')
    .update({ session_started_at: new Date().toISOString() })
    .eq('id_auth', req.user.id) // req.user.id = auth.uid()
  if (error) return res.status(400).json({ error: { message: error.message } })
  res.json({ ok: true })
})

export default router

 