const router = require('express').Router();
const pool   = require('../db/pool');
const { authCliente, authAdmin } = require('../middleware/auth');

// ── POST /resenas — Cliente deja reseña ──
router.post('/', authCliente, async (req, res) => {
  const { sesion_id, estrellas, comentario } = req.body;
  if (!sesion_id || !estrellas) return res.status(400).json({ error: 'Faltan datos' });
  if (estrellas < 1 || estrellas > 5) return res.status(400).json({ error: 'Estrellas entre 1 y 5' });
  try {
    // Verificar que la sesión sea del cliente y esté realizada
    const sesQ = await pool.query(
      'SELECT * FROM sesiones WHERE id=$1 AND cliente_id=$2 AND estado=$3',
      [sesion_id, req.user.id, 'realizada']
    );
    if (!sesQ.rows.length) return res.status(403).json({ error: 'No podés reseñar esta sesión' });
    const ses = sesQ.rows[0];

    // Verificar que no haya reseñado ya
    const existeQ = await pool.query('SELECT id FROM resenas WHERE sesion_id=$1', [sesion_id]);
    if (existeQ.rows.length) return res.status(409).json({ error: 'Ya dejaste una reseña para esta sesión' });

    const { rows } = await pool.query(
      'INSERT INTO resenas (sesion_id,cliente_id,asesor_id,estrellas,comentario) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [sesion_id, req.user.id, ses.asesor_id, estrellas, comentario || '']
    );
    res.status(201).json({ ok: true, resena: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar reseña' });
  }
});

// ── GET /resenas/asesor/:id — Reseñas públicas de un asesor ──
router.get('/asesor/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, c.nombre as cliente_nombre
      FROM resenas r
      JOIN clientes c ON r.cliente_id = c.id
      WHERE r.asesor_id=$1 AND r.estado='publicada'
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── GET /resenas/mis-resenas — Reseñas del cliente ──
router.get('/mis-resenas', authCliente, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, a.nombre as asesor_nombre
      FROM resenas r
      JOIN asesores a ON r.asesor_id = a.id
      WHERE r.cliente_id=$1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── GET /resenas/admin/pendientes — Admin modera reseñas ──
router.get('/admin/pendientes', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, c.nombre as cliente_nombre, a.nombre as asesor_nombre
      FROM resenas r
      JOIN clientes c ON r.cliente_id=c.id
      JOIN asesores a ON r.asesor_id=a.id
      WHERE r.estado='pendiente'
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── PUT /resenas/admin/:id — Admin aprueba o rechaza ──
router.put('/admin/:id', authAdmin, async (req, res) => {
  const { estado } = req.body; // publicada o rechazada
  try {
    await pool.query('UPDATE resenas SET estado=$1 WHERE id=$2', [estado, req.params.id]);

    // Si se publica, actualizar rating del asesor
    if (estado === 'publicada') {
      const resQ = await pool.query('SELECT asesor_id FROM resenas WHERE id=$1', [req.params.id]);
      const asesor_id = resQ.rows[0]?.asesor_id;
      if (asesor_id) {
        await pool.query(`
          UPDATE asesores SET
            rating = (SELECT AVG(estrellas) FROM resenas WHERE asesor_id=$1 AND estado='publicada'),
            total_resenas = (SELECT COUNT(*) FROM resenas WHERE asesor_id=$1 AND estado='publicada')
          WHERE id=$1
        `, [asesor_id]);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
