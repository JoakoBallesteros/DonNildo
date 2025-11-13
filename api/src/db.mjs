import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// Construcción segura del connection string
let cs = (process.env.DATABASE_URL || "").trim();
if (cs && !/sslmode=/i.test(cs)) {
  cs += (cs.includes("?") ? "&" : "?") + "sslmode=require";
}

export const pool = new Pool(
  cs
    ? {
        connectionString: cs,
        ssl: { rejectUnauthorized: false },
        max: 10, // 🔹 hasta 10 conexiones simultáneas
        idleTimeoutMillis: 30000, // 🔹 cierra inactivas después de 30s
        connectionTimeoutMillis: 10000, // 🔹 timeout al conectar
        keepAlive: true, // 🔹 mantiene viva la conexión
      }
    : {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      }
);

// 🔹 Manejo de errores global del pool
pool.on("error", (err) => {
  console.error("⚠️ Error inesperado en el cliente de PostgreSQL:", err);
});