export function allowRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const rol = req.user?.rol
    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'INSUFFICIENT_ROLE' })
    }
    next()
  }
}