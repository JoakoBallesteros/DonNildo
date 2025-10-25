// api/src/routes/usuarios.mjs
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";

const router = Router();

// LISTAR (con búsqueda y paginado opcional)
router.get('/', requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken)
    const { data, error } = await s
      .from('usuarios')
      .select('id_usuario,dni,nombre,mail,estado,id_rol,roles(id_rol,nombre)')
      .order('id_usuario', { ascending: false })

    if (error) {
      console.error('[usuarios] select error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
      })
      return res.status(400).json({ error: { message: error.message } })
    }

    res.set('Cache-Control', 'no-store')
    res.json({ usuarios: data })
  } catch (e) {
    console.error('[usuarios] unexpected:', e)
    res.status(500).json({ error: { message: 'INTERNAL' } })
  }
})

// OBTENER UNO
router.get("/:id", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const id = Number(req.params.id);

  const { data, error } = await s
    .from("usuarios")
    .select(
      "id_usuario,dni,nombre,mail,estado,id_rol,id_auth,roles(id_rol,nombre)"
    )
    .eq("id_usuario", id)
    .single();

  if (error) {
    // 406 (no rows) o policy → tratamos como 404 para no filtrar existencia
    if (error.status === 406 || error.code === "PGRST116") {
      return res.status(404).json({ error: { message: "No encontrado" } });
    }
    const status = error?.status === 403 ? 403 : 400;
    return res.status(status).json({ error: { message: error.message } });
  }

  res.json(data);
});

// CREAR (solo ADMIN por RLS)
router.post("/", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const { dni, nombre, mail, id_rol, estado = "ACTIVO" } = req.body || {};
  if (!nombre || !mail || !id_rol)
    return res.status(400).json({ error: { message: "Faltan datos" } });

  const { data, error } = await s
    .from("usuarios")
    .insert({ dni, nombre, mail, id_rol, estado })
    .select()
    .single();

  if (error) {
    const status = error?.status === 403 ? 403 : 400;
    return res.status(status).json({ error: { message: error.message } });
  }
  res.status(201).json(data);
});

// UPDATE (admin/supervisor; dueño su fila según policies)
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

// SOFT-DELETE (solo ADMIN por RLS)
router.delete("/:id", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const id = Number(req.params.id);

  const { error } = await s
    .from("usuarios")
    .update({ estado: "INACTIVO" })
    .eq("id_usuario", id);

  if (error) {
    const status = error?.status === 403 ? 403 : 400;
    return res.status(status).json({ error: { message: error.message } });
  }
  res.json({ ok: true });
});

export default router;
