// api/src/routes/auth.mjs
import { Router } from 'express'
import { supaAsUser } from '../lib/supabaseUserClient.mjs'
import { requireAuth } from '../middlewares/requireAuth.mjs'

const router = Router()

// --- LOGIN (podés mantener tu proxy actual o moverlo al front) ---
router.post('/login', async (req, res) => {
  // Si querés seguir proxyando login en backend, tu código actual con supa.auth.signInWithPassword está OK.
  // Alternativa recomendada: hacer login en el FRONT con supabase-js y que la API reciba solo el Bearer.
  /* ... tu código actual ... */
})

router.get('/whoami', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user })
})

// --- LOGOUT (el front hace supabase.auth.signOut(); acá solo confirmás) ---
router.post('/logout', requireAuth, (_req, res) => {
  return res.json({ ok: true })
})

// --- ME (ya usa el requireAuth nuevo) ---
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user })
})

// --- RESET PASSWORD (sin cambios) ---
router.post('/password/reset', async (req, res) => {
  /* ... tu código actual ... */
})

// --- NUEVO: touch-session opcional (RLS, sin service_role) ---
router.post('/touch-session', requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken) // el token del usuario actual
  const { error } = await s
    .from('usuarios')
    .update({ session_started_at: new Date().toISOString() })
    .eq('id_auth', req.user.id) // req.user.id = auth.uid()
  if (error) return res.status(400).json({ error: { message: error.message } })
  res.json({ ok: true })
})

export default router

 