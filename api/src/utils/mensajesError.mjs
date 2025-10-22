export function authErrorToPublic(err) {
  const raw = (err?.message || '').toLowerCase()

  // Detectamos por code o por texto (Supabase v2 suele dar "Invalid login credentials", "Email not confirmed", etc.)
  if (err?.code === 'invalid_credentials' || raw.includes('invalid login')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos.' }
  }
  if (err?.code === 'email_not_confirmed' || raw.includes('email not confirmed')) {
    return { code: 'EMAIL_NOT_CONFIRMED', message: 'Debés confirmar tu correo antes de ingresar.' }
  }
  if (err?.status === 429 || raw.includes('too many')) {
    return { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Probá nuevamente en unos minutos.' }
  }
  if (raw.includes('over quota') || raw.includes('rate limit')) {
    return { code: 'SERVICE_TEMPORARILY_UNAVAILABLE', message: 'El servicio está saturado. Intentalo más tarde.' }
  }

  // Fallback
  return { code: 'AUTH_GENERIC_ERROR', message: 'No pudimos iniciar sesión. Intentalo otra vez.' }
}

export function badRequest(msg = 'Revisá los datos ingresados.') {
  return { code: 'BAD_REQUEST', message: msg }
}

export function missingCredentials() {
  return { code: 'MISSING_CREDENTIALS', message: 'Ingresá tu correo y contraseña.' }
}

export function serverError() {
  return { code: 'SERVER_ERROR', message: 'Ocurrió un error inesperado. Probá de nuevo más tarde.' }
}