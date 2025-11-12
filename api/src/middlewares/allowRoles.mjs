// ==========================================
// Middleware: allowRoles
// ==========================================
// Verifica el rol real del usuario en la tabla "usuarios"
// y solo permite continuar si está dentro de los roles permitidos.
// Requiere que `requireAuth` haya seteado req.user.id y req.accessToken.
// ==========================================

import { supaAsUser } from "../lib/supabaseUserClient.mjs";

export function allowRoles(rolesPermitidos = []) {
  return async (req, res, next) => {
    try {
      // Verificamos usuario autenticado
      if (!req.user?.id || !req.accessToken) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }

      // Consultamos su rol real desde la base de datos
      const s = supaAsUser(req.accessToken);
      const { data: me, error } = await s
        .from("usuarios")
        .select("id_usuario, id_rol, roles(nombre)")
        .eq("id_auth", req.user.id)
        .single();

      if (error || !me) {
        console.error("[allowRoles] error:", error);
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      const myRole = me.roles?.nombre;
      if (!rolesPermitidos.includes(myRole)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      // Autorizado 🚀
      next();
    } catch (err) {
      console.error("[allowRoles] unexpected:", err);
      res.status(500).json({ error: "INTERNAL" });
    }
  };
}
