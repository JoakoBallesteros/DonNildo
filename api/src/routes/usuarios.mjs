// api/src/routes/usuarios.mjs
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { supaAdmin } from "../lib/supaAdmin.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs"; // si lo usás para verificar roles

const router = Router();

// ===============================
// LISTAR
// ===============================
router.get("/", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { data, error } = await s
      .from("usuarios")
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, roles(id_rol, nombre)"
      )
      .order("id_usuario", { ascending: false });

    if (error) {
      console.error("[usuarios] select error:", error);
      return res.status(400).json({ error: { message: error.message } });
    }

    res.set("Cache-Control", "no-store");
    res.json({ usuarios: data });
  } catch (e) {
    console.error("[usuarios] unexpected:", e);
    res.status(500).json({ error: { message: "INTERNAL" } });
  }
});

// ===============================
// OBTENER UNO
// ===============================
router.get("/:id", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const id = Number(req.params.id);

  const { data, error } = await s
    .from("usuarios")
    .select(
      "id_usuario, dni, nombre, mail, estado, id_rol, id_auth, roles(id_rol, nombre)"
    )
    .eq("id_usuario", id)
    .single();

  if (error) {
    if (error.status === 406 || error.code === "PGRST116") {
      return res.status(404).json({ error: { message: "No encontrado" } });
    }
    const status = error?.status === 403 ? 403 : 400;
    return res.status(status).json({ error: { message: error.message } });
  }

  res.json(data);
});

// ===============================
// CREAR (ADMIN) - flujo completo
// ===============================
router.post("/", requireAuth, /* allowRoles(["ADMIN"]), */ async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { dni, nombre, mail, id_rol, estado = "ACTIVO" } = req.body || {};

    if (!nombre || !mail || !id_rol) {
      return res.status(400).json({ error: { message: "Faltan datos" } });
    }

    // 1️⃣ Crear el usuario en Supabase Auth
    const { data: created, error: e1 } = await supaAdmin.auth.admin.createUser({
      email: mail,
      email_confirm: true, // marcar como verificado
      password: Math.random().toString(36).slice(-10), // contraseña temporal aleatoria
      user_metadata: { dni, nombre },
    });
    if (e1) throw e1;

    // 2️⃣ Insertar en tabla usuarios con id_auth del usuario recién creado
    const { data, error: e2 } = await s
      .from("usuarios")
      .insert([{ dni, nombre, mail, id_rol, estado, id_auth: created.user.id }])
      .select()
      .single();
    if (e2) throw e2;

    res.status(201).json(data);
  } catch (err) {
    console.error("[usuarios] crear error:", err);
    res.status(400).json({ error: { message: err.message } });
  }
});

// ===============================
// UPDATE
// ===============================
router.put("/:id", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const id = Number(req.params.id);
  const { dni, nombre, mail, id_rol, estado } = req.body || {};

  const { data, error } = await s
    .from("usuarios")
    .update({ dni, nombre, mail, id_rol, estado })
    .eq("id_usuario", id)
    .select()
    .single();

  if (error) {
    const status = error?.status === 403 ? 403 : 400;
    return res.status(status).json({ error: { message: error.message } });
  }
  res.json(data);
});

// ===============================
// SOFT-DELETE
// ===============================
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);

    // Actualiza el estado a INACTIVO
    const { data, error } = await s
      .from("usuarios")
      .update({ estado: "INACTIVO" })
      .eq("id_usuario", id)
      .select()
      .single();

    if (error) {
      console.error("[usuarios] delete error:", error);
      const status = error?.status === 403 ? 403 : 400;
      return res.status(status).json({ error: { message: error.message } });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error("[usuarios] unexpected delete error:", err);
    res.status(500).json({ error: { message: "INTERNAL" } });
  }
});

export default router;
