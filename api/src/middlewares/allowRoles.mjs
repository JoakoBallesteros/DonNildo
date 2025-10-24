// api/src/middlewares/allowRoles.mjs
export function allowRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ error: 'FORBIDDEN' })
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
    next()
  }
}