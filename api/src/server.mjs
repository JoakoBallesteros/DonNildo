import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();
import { pool } from "./db.mjs";
import { requireAuth } from "./middlewares/requireAuth.mjs";
// import { allowRoles } from './middlewares/allowRoles.mjs' // ← ya no se usa si migrás a RLS
import authRoutes from "./routes/auth.mjs";
import usuariosRoutes from "./routes/usuarios.mjs";
import rolesRoutes from "./routes/roles.mjs";
import comprasRoutes from "./routes/compras.mjs";

import ventasRoutes from "./routes/ventas.mjs";
import stockRoutes from "./routes/stock.mjs";
import { supaAsUser } from "./lib/supabaseUserClient.mjs";
import { webcrypto } from "node:crypto";
import adminUsers from "./routes/adminUsers.mjs";
import accountRouter from "./routes/account.mjs";
import auditoriaRoutes from "./routes/auditoria.mjs";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// Poner aca todos los origenes para permitir en dev
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CORS_ORIGIN,
  "https://5173.brs.devtunnels.ms", // puerto forwardeado
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // origin puede ser undefined en tools tipo Postman → lo dejamos pasar
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS bloqueado por origen no permitido: " + origin)
      );
    },
    credentials: true,
  })
);
// Rutas

// --- versión con /api/v1 (lo que espera el front) ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/usuarios", usuariosRoutes);
app.use("/api/v1/roles", rolesRoutes);
app.use("/api/v1/admin/users", adminUsers);
app.use("/api/v1/account", accountRouter);

// Estas ya tenían /api, solo les agrego /v1 si querés versionar todo igual:
app.use("/api/v1/compras", comprasRoutes);
app.use("/api/v1/ventas", ventasRoutes);
app.use("/api/v1/stock", stockRoutes);
app.use("/api/v1/auditoria", auditoriaRoutes);

// --- opcional: mantener las rutas viejas por compatibilidad (no estorban) ---
app.use("/v1/auth", authRoutes);
app.use("/v1/usuarios", usuariosRoutes);
app.use("/v1/roles", rolesRoutes);
app.use("/v1/admin/users", adminUsers);
app.use("/v1/account", accountRouter);

app.use("/api/compras", comprasRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/auditoria", auditoriaRoutes);

// ------ Health ------
// lo que ve el front: /api/v1/health
app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, mode: "supabase" });
});



app.get("/v1/health/db", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    res.json({ ok: rows[0]?.ok === 1, mode: "supabase" });
  } catch (e) {
    console.error("DB health error:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ------ Endpoints protegidos ------

// lo que usaría el front si alguna vez pegás a /api/v1/me
app.get("/api/v1/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// versión vieja
app.get("/v1/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// productos
app.get("/api/v1/productos", requireAuth, async (req, res) => {
  const s = supaAsUser(req.accessToken);
  const { data, error } = await s
    .from("productos")
    .select("*")
    .order("id_producto", { ascending: false });

  if (error) return res.status(400).json({ error: { message: error.message } });
  res.set("Cache-Control", "no-store");
  res.json({ productos: data });
});



const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log("API on :" + PORT);
});