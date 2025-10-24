// routes/auth.mjs
import { Router } from 'express'
import { supa } from '../lib/supabaseClient.mjs'
import { requireAuth } from '../middlewares/requireAuth.mjs'
import { authErrorToPublic, badRequest, missingCredentials, serverError } from '../utils/mensajesError.mjs'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    if (!supa) return res.status(500).json({ error: serverError() })

    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: missingCredentials() })
    }

    const { data, error } = await supa.auth.signInWithPassword({ email, password })
    if (error) {
      const pub = authErrorToPublic(error)
      // 401 para credenciales inválidas / cuenta no confirmada
      const status = pub.code === 'INVALID_CREDENTIALS' ? 401
                   : pub.code === 'EMAIL_NOT_CONFIRMED' ? 401
                   : 400
      return res.status(status).json({ error: pub })
    }

    return res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        metadata: data.user.user_metadata,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: serverError() })
  }
})

router.post('/logout', requireAuth, (_req, res) => {
  return res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user })
})

// Password reset: siempre respondemos 200 para evitar "enumeración de cuentas"
router.post('/password/reset', async (req, res) => {
  try {
    if (!supa) return res.status(200).json({ ok: true }); // ocultamos detalles

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: badRequest('Ingresá tu correo.') });

    // ✅ Si viene RESET_REDIRECT_URL, úsala tal cual.
    // Si no, armamos base desde CORS_ORIGIN y le agregamos /auth/reset.
    let redirectTo = process.env.RESET_REDIRECT_URL;
    if (!redirectTo) {
      const base = (process.env.CORS_ORIGIN || '').replace(/\/$/, '');
      if (!base) return res.status(200).json({ ok: true }); // sin base, no rompemos UX
      redirectTo = `${base}/auth/reset`;
    }

    await supa.auth.resetPasswordForEmail(email, { redirectTo });

    return res.json({
      ok: true,
      message: 'Si el correo es válido, te enviamos un enlace para restablecer tu contraseña.',
    });
  } catch (_e) {
    return res.json({
      ok: true,
      message: 'Si el correo es válido, te enviamos un enlace para restablecer tu contraseña.',
    });
  }
});

export default router

 