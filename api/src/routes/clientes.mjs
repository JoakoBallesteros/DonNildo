import { Router } from "express";
import { pool } from "../db.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs";

const router = Router();

// 👇 Todas las rutas de CLIENTES: solo ADMIN o VENTAS
router.use(requireAuth, allowRoles(["ADMIN", "VENTAS"]));

/* ============================
 * 0️⃣ Autocomplete rápido
 * GET /api/v1/clientes/search?q=
 * ============================ */
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const { rows } = await pool.query(
      `SELECT id_cliente, razon_social, tipo_documento, numero_documento, lista_precios_id 
       FROM clientes 
       WHERE estado = TRUE 
         AND (razon_social ILIKE $1 OR numero_documento ILIKE $1)
       ORDER BY razon_social
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ ok: true, clientes: rows });
  } catch (e) {
    console.error("Error en búsqueda de clientes:", e);
    res.status(500).json({ ok: false, message: "Error al buscar clientes." });
  }
});

/* ============================
 * 1️⃣ Listar clientes
 * GET /api/v1/clientes
 * ============================ */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM clientes ORDER BY razon_social`
    );
    res.json({ ok: true, clientes: rows });
  } catch (e) {
    console.error("Error al obtener clientes:", e);
    res.status(500).json({ ok: false, message: "Error al obtener clientes." });
  }
});

/* ============================
 * 2️⃣ Obtener cliente por ID
 * GET /api/v1/clientes/:id
 * ============================ */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE id_cliente = $1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "Cliente no encontrado." });
    }
    res.json({ ok: true, cliente: rows[0] });
  } catch (e) {
    console.error("Error al obtener cliente:", e);
    res.status(500).json({ ok: false, message: "Error al obtener el cliente." });
  }
});

/* ============================
 * 3️⃣ Crear cliente
 * POST /api/v1/clientes
 * ============================ */
router.post("/", async (req, res) => {
  const {
    tipo_persona,
    tipo_documento,
    numero_documento,
    razon_social,
    nombre_fantasia,
    condicion_iva,
    email,
    telefono,
    direccion,
    localidad,
    provincia,
    codigo_postal,
    lista_precios_id,
    descuento_global,
    tiene_cuenta_cte,
    limite_credito,
    observaciones
  } = req.body;

  if (!numero_documento || !razon_social) {
    return res.status(400).json({ ok: false, message: "Número de documento y razón social son obligatorios." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO clientes (
         tipo_persona, tipo_documento, numero_documento, razon_social, 
         nombre_fantasia, condicion_iva, email, telefono, direccion, 
         localidad, provincia, codigo_postal, lista_precios_id, 
         descuento_global, tiene_cuenta_cte, limite_credito, observaciones
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        tipo_persona || 'JURIDICA',
        tipo_documento || 'CUIT',
        numero_documento.trim(),
        razon_social.trim(),
        nombre_fantasia || null,
        condicion_iva || 'CONSUMIDOR_FINAL',
        email || null,
        telefono || null,
        direccion || null,
        localidad || null,
        provincia || null,
        codigo_postal || null,
        lista_precios_id || null,
        descuento_global || 0,
        tiene_cuenta_cte || false,
        limite_credito || 0,
        observaciones || null
      ]
    );

    res.status(201).json({ ok: true, cliente: rows[0] });
  } catch (e) {
    console.error("Error al crear cliente:", e);
    if (e.code === "23505") {
      return res.status(400).json({ ok: false, message: "El documento ya existe para otro cliente." });
    }
    res.status(500).json({ ok: false, message: "Error al crear el cliente." });
  }
});

/* ============================
 * 4️⃣ Actualizar cliente
 * PUT /api/v1/clientes/:id
 * ============================ */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

  const {
    tipo_persona, tipo_documento, numero_documento, razon_social,
    nombre_fantasia, condicion_iva, email, telefono, direccion,
    localidad, provincia, codigo_postal, lista_precios_id,
    descuento_global, tiene_cuenta_cte, limite_credito, observaciones, estado
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE clientes SET 
         tipo_persona = COALESCE($1, tipo_persona),
         tipo_documento = COALESCE($2, tipo_documento),
         numero_documento = COALESCE($3, numero_documento),
         razon_social = COALESCE($4, razon_social),
         nombre_fantasia = COALESCE($5, nombre_fantasia),
         condicion_iva = COALESCE($6, condicion_iva),
         email = COALESCE($7, email),
         telefono = COALESCE($8, telefono),
         direccion = COALESCE($9, direccion),
         localidad = COALESCE($10, localidad),
         provincia = COALESCE($11, provincia),
         codigo_postal = COALESCE($12, codigo_postal),
         lista_precios_id = COALESCE($13, lista_precios_id),
         descuento_global = COALESCE($14, descuento_global),
         tiene_cuenta_cte = COALESCE($15, tiene_cuenta_cte),
         limite_credito = COALESCE($16, limite_credito),
         observaciones = COALESCE($17, observaciones),
         estado = COALESCE($18, estado),
         updated_at = now()
       WHERE id_cliente = $19
       RETURNING *`,
      [
        tipo_persona, tipo_documento, numero_documento, razon_social,
        nombre_fantasia, condicion_iva, email, telefono, direccion,
        localidad, provincia, codigo_postal, lista_precios_id,
        descuento_global, tiene_cuenta_cte, limite_credito, observaciones, estado,
        id
      ]
    );

    if (!rows.length) return res.status(404).json({ ok: false, message: "Cliente no encontrado." });
    
    res.json({ ok: true, cliente: rows[0] });
  } catch (e) {
    console.error("Error al actualizar cliente:", e);
    if (e.code === "23505") {
      return res.status(400).json({ ok: false, message: "El documento ya existe para otro cliente." });
    }
    res.status(500).json({ ok: false, message: "Error al actualizar el cliente." });
  }
});

/* ============================
 * 5️⃣ Eliminar cliente (soft delete)
 * DELETE /api/v1/clientes/:id
 * ============================ */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

  try {
    const { rows } = await pool.query(
      `UPDATE clientes SET estado = FALSE, updated_at = now() 
       WHERE id_cliente = $1 RETURNING *`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Cliente no encontrado." });
    
    res.json({ ok: true, message: "Cliente desactivado." });
  } catch (e) {
    console.error("Error al eliminar cliente:", e);
    res.status(500).json({ ok: false, message: "Error al eliminar el cliente." });
  }
});

/* ============================
 * 6️⃣ Obtener movimientos de cuenta corriente
 * GET /api/v1/clientes/:id/cuenta
 * ============================ */
router.get("/:id/cuenta", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, message: "ID inválido." });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM cuenta_corriente 
       WHERE id_cliente = $1 
       ORDER BY created_at DESC`,
      [id]
    );
    res.json({ ok: true, movimientos: rows });
  } catch (e) {
    console.error("Error al obtener movimientos de cuenta:", e);
    res.status(500).json({ ok: false, message: "Error al obtener movimientos." });
  }
});

export default router;
