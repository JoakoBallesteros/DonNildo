import { supa } from '../lib/supabaseClient.mjs'

const ABSOLUTE_SESSION_DAYS = 7

export async function requireAuth(req, res, next) {
  try {
    if (req.method === 'OPTIONS') return res.sendStatus(200)

    const m = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)
    const token = m?.[1] || null
    if (!token) return res.status(401).json({ error: 'NO_TOKEN' })

    // Validar token de Supabase
    const { data, error } = await supa.auth.getUser(token)
    if (error || !data?.user) {
      console.error('getUser error:', error?.message || error, { path: req.path })
      return res.status(401).json({ error: 'INVALID_TOKEN' })
    }

    const u = data.user
    req.user = {
      idAuth: u.id,
      email: (u.email || '').toLowerCase(),
      metadata: u.user_metadata || {},
      provider: 'supabase',
    }
    req.accessToken = token

    // Obtener/crear inicio del ciclo de sesión (service_role → bypass RLS)
    const { data: row, error: e1 } = await supa
      .from('usuarios')
      .select('session_started_at')
      .eq('id_auth', u.id)
      .single()

    if (e1) {
      console.error('session_started_at select error:', e1)
      return res.status(500).json({ error: 'SESSION_CHECK_FAILED' })
    }

    if (!row?.session_started_at) {
      const { error: e2 } = await supa
        .from('usuarios')
        .update({ session_started_at: new Date().toISOString() })
        .eq('id_auth', u.id)
      if (e2) {
        console.error('session_started_at init error:', e2)
        return res.status(500).json({ error: 'SESSION_INIT_FAILED' })
      }
    } else {
      const started = new Date(row.session_started_at).getTime()
      const maxAgeMs = ABSOLUTE_SESSION_DAYS * 24 * 60 * 60 * 1000
      if (Date.now() - started > maxAgeMs) {
        return res.status(401).json({ error: 'SESSION_EXPIRED' })
      }
    }

    return next()
  } catch (e) {
    console.error('requireAuth error:', e)
    return res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}