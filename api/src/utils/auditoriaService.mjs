// api/src/utils/auditoriaService.mjs
import { pool } from "../db.mjs";
import { decodeJwt } from "jose";

// Registra un evento en la tabla auditoria usando la RPC registrar_auditoria
export async function registrarAuditoria(userId, evento, modulo, descripcion) {
  try {
    // por ahora asumimos que userId ya es el id_usuario (INT)
    // si viene como null, la función igual lo guarda sin usuario
    await pool.query(
      `SELECT registrar_auditoria($1, $2, $3, $4)`,
      [userId, evento, modulo, descripcion]
    );
  } catch (e) {
    // La auditoría nunca debe romper el flujo de la app
    console.error(`⚠️ Error al registrar auditoría (${modulo}):`, e.message);
  }
}

// Obtiene el id_usuario INT a partir del accessToken (UUID en sub)
export async function getUserIdFromToken(accessToken) {
  if (!accessToken) return null;

  const decoded = decodeJwt(accessToken);
  const idAuth = decoded.sub; // UUID de Supabase Auth

  const { rows } = await pool.query(
    `SELECT id_usuario FROM usuarios WHERE id_auth = $1`,
    [idAuth]
  );

  return rows.length ? rows[0].id_usuario : null;
}
