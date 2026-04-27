import { pool } from './src/db.mjs';

async function run() {
  try {
    const res = await pool.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'modificar_venta_transaccional'");
    console.log(res.rows[0].pg_get_functiondef);
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}
run();
