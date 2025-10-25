import { jwtVerify, createRemoteJWKSet, decodeJwt, decodeProtectedHeader } from 'jose'
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) globalThis.crypto = webcrypto

const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
if (!base) throw new Error('[requireAuth] SUPABASE_URL no configurada')

const jwksUrl = new URL(`${base}/auth/v1/.well-known/jwks.json`)
const jwks = createRemoteJWKSet(jwksUrl)

// clave para HS256
const HS_SECRET = (process.env.SUPABASE_JWT_SECRET || '').trim()
const HS_KEY = HS_SECRET ? new TextEncoder().encode(HS_SECRET) : null

export async function requireAuth(req, res, next) {
  try {
    if (req.method === 'OPTIONS') return res.sendStatus(200)

    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'NO_TOKEN' })

    // logs de diagnóstico (puedes quitar después)
    const decoded = decodeJwt(token)
    const header = decodeProtectedHeader(token)
    console.log('[AUTH] alg:', header.alg, 'iss:', decoded.iss, 'sub:', decoded.sub)
    console.log('[AUTH] jwks url:', jwksUrl.toString())

    let payload
    if (header.alg && header.alg.startsWith('HS')) {
      // Supabase firmando con HS256 (JWT secret del proyecto)
      if (!HS_KEY) {
        console.error('[AUTH] Falta SUPABASE_JWT_SECRET para validar HS256')
        return res.status(401).json({ error: 'INVALID_TOKEN' })
      }
      payload = (await jwtVerify(token, HS_KEY, {
        issuer: `${base}/auth/v1`,
        algorithms: ['HS256'],
        clockTolerance: 5 * 60,
      })).payload
    } else {
      // RS* (GoTrue con JWKS)
      payload = (await jwtVerify(token, jwks, {
        issuer: `${base}/auth/v1`,
        clockTolerance: 5 * 60,
      })).payload
    }

    req.user = { id: payload.sub, claims: payload }
    req.accessToken = token
    next()
  } catch (e) {
    console.error('[AUTH] verify error:', e?.code || e?.name || e, e?.message)
    return res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}
