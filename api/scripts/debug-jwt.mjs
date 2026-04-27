// debug-jwt.mjs  — ejecutar con: node scripts/debug-jwt.mjs <TOKEN>
import { createRemoteJWKSet, jwtVerify, decodeJwt, decodeProtectedHeader } from 'jose'
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) globalThis.crypto = webcrypto

const token = process.argv[2]
if (!token) {
  console.error('Uso: node scripts/debug-jwt.mjs <TOKEN_JWT>')
  process.exit(1)
}

const SUPABASE_URL = 'https://uyewmnpwpbexntzqpxff.supabase.co'
const jwksUrl = new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)

console.log('\n──── HEADER ────────────────────────────────')
const header = decodeProtectedHeader(token)
console.log(header)

console.log('\n──── PAYLOAD (sin verificar) ────────────────')
const raw = decodeJwt(token)
console.log({
  iss:  raw.iss,
  sub:  raw.sub,
  role: raw.role,
  exp:  new Date(raw.exp * 1000).toISOString(),
  iat:  new Date(raw.iat * 1000).toISOString(),
})

console.log('\n──── JWKS keys ──────────────────────────────')
const res  = await fetch(jwksUrl)
const jwksData = await res.json()
console.log(JSON.stringify(jwksData, null, 2))

console.log('\n──── VERIFICACIÓN ───────────────────────────')
const expectedIssuer = `${SUPABASE_URL}/auth/v1`
console.log('Issuer esperado:', expectedIssuer)
console.log('Issuer del token:', raw.iss)
console.log('Coinciden:', raw.iss === expectedIssuer)

const jwks = createRemoteJWKSet(jwksUrl)

try {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: expectedIssuer,
    clockTolerance: 5 * 60,
  })
  console.log('\n✅ Token VÁLIDO')
  console.log('sub:', payload.sub, '| role:', payload.role)
} catch (e) {
  console.error('\n❌ Token INVÁLIDO:', e.code, '-', e.message)

  // Intentar sin validar issuer para aislar el problema
  console.log('\n── Reintentando sin validar issuer...')
  try {
    const { payload } = await jwtVerify(token, jwks, { clockTolerance: 5 * 60 })
    console.log('✅ Válido SIN issuer check → el issuer del token no coincide')
    console.log('Issuer del token:', raw.iss)
  } catch (e2) {
    console.error('❌ También falla sin issuer:', e2.code, '-', e2.message)
    console.log('→ El problema es la firma en sí, no el issuer.')
    console.log('→ Posibles causas:')
    console.log('   1. El proyecto Supabase rotó sus claves recientemente')
    console.log('   2. El token proviene de un proyecto Supabase diferente')
    console.log('   3. El token está corrupto/truncado')
  }
}
