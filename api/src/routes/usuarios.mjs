// api/src/routes/usuarios.mjs
// ==========================================
// Rutas: /api/v1/usuarios  y /v1/usuarios
// Maneja usuarios de aplicación (tabla 'usuarios').
// Solo ADMIN puede crear, modificar o "eliminar" (baja lógica).
// - GET: por defecto NO muestra eliminados (deleted_at IS NULL)
// - DELETE: baja lógica + (default) bloquear en Supabase Auth
//           opcional purge duro de Auth con ?purgeAuth=1
// ==========================================

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { supaAdmin } from "../lib/supaAdmin.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

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
const INVITE_REDIRECT_PATH = process.env.INVITE_REDIRECT_PATH || "/reset";
const inviteRedirectTo = `${FRONT_BASE}${INVITE_REDIRECT_PATH}`;

// -------------------- LISTAR (solo ADMIN) --------------------
// Por defecto: NO muestra eliminados (deleted_at != null)
// Si querés verlos: /usuarios?includeDeleted=1
router.get("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const includeDeleted = String(req.query.includeDeleted || "0") === "1";

    let q = s
      .from("usuarios")
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, id_auth, deleted_at, roles(id_rol, nombre)"
      )
      .order("id_usuario", { ascending: false });

    if (!includeDeleted) q = q.is("deleted_at", null);

    let { data, error } = await q;

    // Fallback si todavía no existe deleted_at (por si estás a mitad de migración)
    if (error && String(error.message || "").includes("deleted_at")) {
      const q2 = s
        .from("usuarios")
        .select(
          "id_usuario, dni, nombre, mail, estado, id_rol, id_auth, roles(id_rol, nombre)"
        )
        .order("id_usuario", { ascending: false });

      ({ data, error } = await q2);
    }

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
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, id_auth, deleted_at, roles(id_rol, nombre)"
      )
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
// - Si ya existe un usuario "eliminado" con ese mail -> lo revive (update)
// - Si no existe -> crea nuevo (invite + insert)
// Esto evita duplicados y te deja prolijo para producción.
router.post("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { dni, nombre, mail, id_rol, estado = "ACTIVO" } = req.body || {};

    if (!nombre || !mail || !id_rol) {
      return res.status(400).json({ error: { message: "Faltan datos" } });
    }

    const email = String(mail).trim().toLowerCase();

    // 0) ¿Existe usuario eliminado con ese mail? -> revivirlo
    // (si aún no tenés deleted_at, esto puede fallar y seguimos al flujo normal)
    let revived = null;
    try {
      const { data: old, error: oldErr } = await s
        .from("usuarios")
        .select("id_usuario, mail, deleted_at")
        .eq("mail", email)
        .maybeSingle();

      if (!oldErr && old?.id_usuario && old.deleted_at) {
        // Invite nuevo para obtener id_auth nuevo
        const { data: invited, error: e1 } =
          await supaAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: inviteRedirectTo,
            data: { dni, nombre, id_rol },
          });
        if (e1) throw e1;

        const patch = {
          dni: dni ?? null,
          nombre,
          id_rol,
          estado,
          id_auth: invited?.user?.id ?? null,
          deleted_at: null,
          deleted_by: null,
        };

        const { data: upd, error: e2 } = await s
          .from("usuarios")
          .update(patch)
          .eq("id_usuario", old.id_usuario)
          .select()
          .single();
        if (e2) throw e2;

        revived = upd;
      }
    } catch {
      // ignore, seguimos con create normal
    }

    if (revived) {
      try {
        const adminId = await getUserIdFromToken(req.accessToken);
        registrarAuditoria(
          adminId,
          "CREAR_USUARIO",
          "SEGURIDAD",
          `Usuario reactivado: ${revived.nombre} (${revived.mail}) rol=${revived.id_rol} redirectTo=${inviteRedirectTo}`
        );
      } catch {}
      return res.status(201).json(revived);
    }

    // 1) Invite Supabase Auth
    const { data: invited, error: e1 } =
      await supaAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirectTo,
        data: { dni, nombre, id_rol },
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
    if (mail !== undefined)
      patch.mail = mail ? String(mail).trim().toLowerCase() : null;
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
// ✅ Baja lógica (tabla) + (default) bloquear usuario en Supabase Auth.
// Opcional: purge duro de Auth con ?purgeAuth=1 (solo para test/debug).
router.delete("/:id", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);
    const purgeAuth = String(req.query.purgeAuth || "0") === "1";

    // Evitar borrarse a sí mismo
    const { data: me, error: meErr } = await s
      .from("usuarios")
      .select("id_usuario, roles(nombre)")
      .eq("id_auth", req.user.id)
      .maybeSingle();

    if (meErr) throw meErr;
    if (me?.roles?.nombre === "ADMIN" && me.id_usuario === id) {
      return res
        .status(400)
        .json({ error: { message: "No podés eliminar tu propio usuario." } });
    }

    // Traer el usuario para saber id_auth
    const { data: target, error: tErr } = await s
      .from("usuarios")
      .select("id_usuario, id_auth, mail")
      .eq("id_usuario", id)
      .single();
    if (tErr) throw tErr;

    let adminId = null;
    try {
      adminId = await getUserIdFromToken(req.accessToken);
    } catch {
      adminId = null;
    }

    // 1) Baja lógica en tabla (no tocamos mail ni id_auth en prod)
    const patch1 = {
      estado: "INACTIVO",
      deleted_at: new Date().toISOString(),
      deleted_by: adminId,
    };

    let upd = await s
      .from("usuarios")
      .update(patch1)
      .eq("id_usuario", id)
      .select()
      .maybeSingle();

    // Fallback si todavía no existen deleted_at/deleted_by
    if (upd?.error && String(upd.error.message || "").includes("deleted_")) {
      const patch2 = { estado: "INACTIVO" };
      upd = await s
        .from("usuarios")
        .update(patch2)
        .eq("id_usuario", id)
        .select()
        .maybeSingle();
    }

    if (upd?.error) throw upd.error;

    // 2) Auth: bloquear (recomendado) o purgar (solo debug)
    if (target?.id_auth) {
      if (purgeAuth) {
        const { error: delAuthErr } = await supaAdmin.auth.admin.deleteUser(
          target.id_auth
        );
        if (delAuthErr)
          console.warn("[usuarios] warning delete auth user:", delAuthErr.message);
      } else {
        // Bloquea el acceso (sin perder trazabilidad)
        const { error: banErr } = await supaAdmin.auth.admin.updateUserById(
          target.id_auth,
          { ban_duration: "87600h" } // ~10 años, “perma-ban” práctico
        );
        if (banErr)
          console.warn("[usuarios] warning ban auth user:", banErr.message);
      }
    }

    // Auditoría
    try {
      if (adminId) {
        registrarAuditoria(
          adminId,
          "ELIMINAR_USUARIO",
          "SEGURIDAD",
          `Usuario ID ${id} baja lógica. Auth=${purgeAuth ? "PURGE" : "BAN"}`
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
