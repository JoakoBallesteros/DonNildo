import { Router } from 'express';
import { supa } from '../lib/supabaseClient.mjs';
import { requireAuth } from '../middlewares/requireAuth.mjs';
import { attachRole } from '../middlewares/attachRole.mjs';
import { allowRoles } from '../middlewares/allowRoles.mjs';

const router = Router();

// Si querés que cualquiera logueado vea roles:
router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supa
    .from('roles')
    .select('id_rol,nombre,descripcion')
    .order('nombre', { ascending: true });

  if (error) return res.status(400).json({ error: { message: error.message } });
  res.json({ roles: data || [] });
});

// O si querés restringirlo a ADMIN/SUPERVISOR:
// router.get('/', requireAuth, attachRole, allowRoles('ADMIN','SUPERVISOR'), async (_req, res) => { ... });

export default router;