// api/src/utils/auditoriaService.mjs
import { pool } from '../db.mjs';
import { decodeJwt } from 'jose';

// Función para registrar un evento. Se recomienda llamarla sin esperar (asíncrona) 
// para no ralentizar la respuesta principal de la API.
export async function registrarAuditoria(userId, evento, modulo, descripcion) {
    try {
        // Obtenemos el id_usuario INT a partir del UUID de Supabase (userId)
        // Esto asume que el id_usuario INT está en req.id_usuario o se puede buscar:
        let idUsuarioApp = userId; 
        
        // Si userId viene como UUID (desde req.user.id), necesitamos buscar el id_usuario INT.
        // Por ahora, asumimos que el id_usuario INT ya está disponible o es pasado.
        // Si no lo está, se puede buscar en la tabla 'usuarios' usando id_auth (UUID).

        // Usaremos la RPC para mayor seguridad.
        await pool.query(
            `SELECT registrar_auditoria($1, $2, $3, $4)`,
            [idUsuarioApp, evento, modulo, descripcion]
        );
    } catch (e) {
        // La auditoría no debe romper el flujo de la aplicación
        console.error(`⚠️ Error al registrar auditoría (${modulo}):`, e.message);
    }
}

// Obtiene el ID de usuario interno (INT) desde el token (UUID)
// NOTA: Esto solo funciona si requireAuth ya se ejecutó y req.accessToken existe.
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