// api/src/routes/usuarios.mjs
// ==========================================
// Rutas: /api/v1/usuarios  y /v1/usuarios
// Maneja usuarios de aplicación (tabla 'usuarios').
// Solo ADMIN puede crear, modificar o "eliminar" (baja lógica).
// ==========================================

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { supaAdmin } from "../lib/supaAdmin.mjs";
import { registrarAuditoria, getUserIdFromToken } from "../utils/auditoriaService.mjs";

const router = Router();

// -------------------- Helpers --------------------
function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

// FRONT base (tu WEB)
const FRONT_BASE =
  normalizeBaseUrl(process.env.APP_BASE_URL) ||
  normalizeBaseUrl(process.env.SITE_URL) ||
  normalizeBaseUrl(process.env.APP_URL) ||
  "http://localhost:5173";

// Ruta pública donde seteás contraseña
// Recomendado: /reset (pública). Si querés /auth/reset, cambialo acá.
const INVITE_REDIRECT_PATH = process.env.INVITE_REDIRECT_PATH || "/reset";
const inviteRedirectTo = `${FRONT_BASE}${INVITE_REDIRECT_PATH}`;

// -------------------- LISTAR (solo ADMIN) --------------------
router.get("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);

    const { data, error } = await s
      .from("usuarios")
      .select("id_usuario, dni, nombre, mail, estado, id_rol, id_auth, roles(id_rol, nombre)")
      .order("id_usuario", { ascending: false });

    if (error) throw error;

    res.set("Cache-Control", "no-store");
    res.json({ usuarios: data });
  } catch (e) {
    console.error("[usuarios] list error:", e);
    res.status(500).json({ error: { message: e.message } });
  }
});

// -------------------- OBTENER UNO (ADMIN o el propio) --------------------
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);

    const { data: me, error: meErr } = await s
      .from("usuarios")
      .select("id_usuario, roles(nombre)")
      .eq("id_auth", req.user.id)
      .maybeSingle();

    if (meErr) throw meErr;
    if (!me) return res.status(403).json({ error: "FORBIDDEN" });

    if (me.roles?.nombre !== "ADMIN" && me.id_usuario !== id) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const { data, error } = await s
      .from("usuarios")
      .select("id_usuario, dni, nombre, mail, estado, id_rol, id_auth, roles(id_rol, nombre)")
      .eq("id_usuario", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("[usuarios] get error:", e);
    res.status(400).json({ error: { message: e.message } });
  }
});

// -------------------- CREAR (solo ADMIN) --------------------
// Envía invitación para establecer contraseña + inserta en tabla 'usuarios'
router.post("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { dni, nombre, mail, id_rol, estado = "ACTIVO" } = req.body || {};

    if (!nombre || !mail || !id_rol) {
      return res.status(400).json({ error: { message: "Faltan datos" } });
    }

    const email = String(mail).trim().toLowerCase();

    // 1) Invite Supabase Auth
    const { data: invited, error: e1 } = await supaAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirectTo,
      data: { dni, nombre, id_rol }, // metadata por si usás triggers
    });
    if (e1) throw e1;

    // 2) Insert en tabla usuarios
    const payload = {
      dni: dni ?? null,
      nombre,
      mail: email,
      id_rol,
      estado,
      id_auth: invited?.user?.id,
    };

    const { data, error: e2 } = await s
      .from("usuarios")
      .insert([payload])
      .select()
      .single();
    if (e2) throw e2;

    // 3) Auditoría
    try {
      const adminId = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        adminId,
        "CREAR_USUARIO",
        "SEGURIDAD",
        `Usuario creado: ${data.nombre} (${data.mail}) rol=${data.id_rol} redirectTo=${inviteRedirectTo}`
      );
    } catch (logErr) {
      console.warn("[usuarios] auditoría create falló:", logErr.message);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("[usuarios] crear error:", err);
    res.status(400).json({ error: { message: err.message } });
  }
});

// -------------------- UPDATE (solo ADMIN) --------------------
router.put("/:id", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);
    const { dni, nombre, mail, id_rol, estado } = req.body || {};

    const patch = {};
    if (dni !== undefined) patch.dni = dni;
    if (nombre !== undefined) patch.nombre = nombre;
    if (mail !== undefined) patch.mail = mail ? String(mail).trim().toLowerCase() : null;
    if (id_rol !== undefined) patch.id_rol = id_rol;
    if (estado !== undefined) patch.estado = estado;

    const { data, error } = await s
      .from("usuarios")
      .update(patch)
      .eq("id_usuario", id)
      .select()
      .single();

    if (error) throw error;

    // Auditoría
    try {
      const adminId = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        adminId,
        "MODIFICAR_USUARIO",
        "SEGURIDAD",
        `Usuario ID ${id} modificado: ${data.nombre} (${data.mail}), estado=${data.estado}, rol=${data.id_rol}`
      );
    } catch (logErr) {
      console.warn("[usuarios] auditoría update falló:", logErr.message);
    }

    res.json(data);
  } catch (e) {
    console.error("[usuarios] update error:", e);
    res.status(400).json({ error: { message: e.message } });
  }
});

// -------------------- DELETE (solo ADMIN) --------------------
// ✅ Baja lógica: NO borra fila (evita FK con auditoria)
router.delete("/:id", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);

    // Evitar borrarse a sí mismo (opcional, pero te salva)
    const { data: me, error: meErr } = await s
      .from("usuarios")
      .select("id_usuario, roles(nombre)")
      .eq("id_auth", req.user.id)
      .maybeSingle();

    if (meErr) throw meErr;
    if (me?.roles?.nombre === "ADMIN" && me.id_usuario === id) {
      return res.status(400).json({ error: { message: "No podés eliminar tu propio usuario." } });
    }

    let adminId = null;
    try {
      adminId = await getUserIdFromToken(req.accessToken);
    } catch {
      adminId = null;
    }

    // Intento 1: con deleted_at/deleted_by (si existen)
    const patch1 = {
      estado: "INACTIVO",
      deleted_at: new Date().toISOString(),
      deleted_by: adminId,
      nombre: "[ELIMINADO]",
      dni: null,
    };

    let upd = await s.from("usuarios").update(patch1).eq("id_usuario", id).select().maybeSingle();

    // Fallback: si todavía no creaste columnas deleted_at/deleted_by
    if (upd?.error && String(upd.error.message || "").includes("deleted_")) {
      const patch2 = {
        estado: "INACTIVO",
        nombre: "[ELIMINADO]",
        dni: null,
      };
      upd = await s.from("usuarios").update(patch2).eq("id_usuario", id).select().maybeSingle();
    }

    if (upd?.error) throw upd.error;

    // Auditoría
    try {
      if (adminId) {
        registrarAuditoria(
          adminId,
          "ELIMINAR_USUARIO",
          "SEGURIDAD",
          `Usuario ID ${id} eliminado (baja lógica).`
        );
      }
    } catch (logErr) {
      console.warn("[usuarios] auditoría delete falló:", logErr.message);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[usuarios] delete error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;
