import { Router } from 'express'
import { supa } from '../lib/supabaseClient.mjs'
import { requireAuth } from '../middlewares/requireAuth.mjs'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'MISSING_CREDENTIALS' })

  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: 'INVALID_LOGIN', details: error.message })

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata,
    },
  })
})

router.post('/logout', requireAuth, (_req, res) => {
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router