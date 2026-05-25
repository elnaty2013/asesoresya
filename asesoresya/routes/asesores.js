const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('../db/pool');
const { authAdmin, authAsesor, authCliente } = require('../middleware/auth');
const emails = require('../emails/templates');

// ════════════════════════════════════
// ASESORES PÚBLICOS
// ════════════════════════════════════

// ── GET /asesores — Lista asesores activos (con filtros) ──
router.get('/', async (req, res) => {
  const { especialidad, modalidad } = req.query;
  let query = 'SELECT id,nombre,rol,especialidad,precio,modalidades,bio,tags,rating,total_sesiones,foto_url,zoom_link,zoom_id,direccion,dias_disponibles,hora_desde,hora_hasta FROM asesores WHERE estado=$1';
  const params = ['activo'];
  if (especialidad) { query += ` AND especialidad=$${params.length+1}`; params.push(especialidad); }
  if (modalidad) { query += ` AND $${params.length+1}=ANY(modalidades)`; params.push(modalidad); }
  query += ' ORDER BY rating DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asesores' });
  }
});

// ── PUT /asesores/mi-perfil — ANTES de /:id para evitar conflicto ──
router.put('/mi-perfil', authAsesor, async (req, res) => {
  const { bio, zoom_link, zoom_id, direccion, dias_disponibles, hora_desde, hora_hasta } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE asesores SET bio=$1,zoom_link=$2,zoom_id=$3,direccion=$4,dias_disponibles=$5,hora_desde=$6,hora_hasta=$7
      WHERE id=$8 RETURNING id,nombre,email,rol,especialidad,precio,bio,zoom_link,zoom_id,direccion,dias_disponibles,hora_desde,hora_hasta
    `, [bio,zoom_link,zoom_id,direccion,dias_disponibles,hora_desde,hora_hasta,req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// ── GET /asesores/:id — Perfil público de un asesor ──
router.get('/:id', async (req, res) => {
  try {
    const asesorQ = await pool.query(
      'SELECT id,nombre,rol,especialidad,precio,modalidades,bio,tags,rating,total_sesiones,total_resenas,foto_url,zoom_link,zoom_id,direccion,dias_disponibles,hora_desde,hora_hasta FROM asesores WHERE id=$1 AND estado=$2',
      [req.params.id, 'activo']
    );
    if (!asesorQ.rows.length) return res.status(404).json({ error: 'Asesor no encontrado' });

    const resenasQ = await pool.query(
      'SELECT r.*,c.nombre as cliente_nombre FROM resenas r JOIN clientes c ON r.cliente_id=c.id WHERE r.asesor_id=$1 AND r.estado=$2 ORDER BY r.created_at DESC LIMIT 10',
      [req.params.id, 'publicada']
    );
    res.json({ asesor: asesorQ.rows[0], resenas: resenasQ.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ════════════════════════════════════
// POSTULACIONES
// ════════════════════════════════════

// ── POST /asesores/postulacion — Nuevo postulante ──
router.post('/postulacion', async (req, res) => {
  const { nombre, email, telefono, zona, especialidad, modalidad, precio_pedido, anios_experiencia, experiencia } = req.body;
  if (!nombre || !email || !especialidad || !precio_pedido) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO postulaciones (nombre,email,telefono,zona,especialidad,modalidad,precio_pedido,anios_experiencia,experiencia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [nombre,email,telefono,zona,especialidad,modalidad,precio_pedido,anios_experiencia,experiencia]);
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar postulación' });
  }
});

// ════════════════════════════════════
// ADMIN — GESTIÓN DE ASESORES
// ════════════════════════════════════

// ── GET /asesores/admin/todos — Admin ve todos ──
router.get('/admin/todos', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM asesores ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── PUT /asesores/admin/:id/estado — Admin suspende o reactiva ──
router.put('/admin/:id/estado', authAdmin, async (req, res) => {
  const { estado } = req.body; // activo, suspendido
  try {
    await pool.query('UPDATE asesores SET estado=$1 WHERE id=$2', [estado, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── GET /asesores/admin/postulaciones — Admin ve postulaciones ──
router.get('/admin/postulaciones', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM postulaciones ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── PUT /asesores/admin/postulaciones/:id/entrevista — Programar entrevista ──
router.put('/admin/postulaciones/:id/entrevista', authAdmin, async (req, res) => {
  const { fecha, hora, modalidad, zoom, direccion } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE postulaciones SET estado='entrevista_programada',entrevista_fecha=$1,entrevista_hora=$2,
      entrevista_modalidad=$3,entrevista_zoom=$4,entrevista_direccion=$5 WHERE id=$6 RETURNING *
    `, [fecha,hora,modalidad,zoom,direccion,req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Postulación no encontrada' });
    const p = rows[0];
    await emails.emailEntrevista({ nombre: p.nombre, email: p.email }, { fecha, hora, modalidad, zoom, direccion });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── PUT /asesores/admin/postulaciones/:id/aprobar ──
router.put('/admin/postulaciones/:id/aprobar', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM postulaciones WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
    const p = rows[0];
    const password = 'Asesor' + Math.random().toString(36).slice(-6).toUpperCase() + '!';
    const hash = await bcrypt.hash(password, 10);
    const precioFinal = p.precio_ofrecido || p.precio_pedido;
    const { rows: asesorRows } = await pool.query(`
      INSERT INTO asesores (nombre,email,password_hash,rol,especialidad,precio,modalidades,estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'activo')
      ON CONFLICT (email) DO UPDATE SET estado='activo', precio=$6
      RETURNING id, nombre, email, rol, especialidad, precio
    `, [p.nombre, p.email, hash, p.especialidad, p.especialidad, precioFinal, `{${p.modalidad || 'videollamada'}}`]);

    await pool.query('UPDATE postulaciones SET estado=$1, precio_final=$2 WHERE id=$3', ['aprobado', precioFinal, req.params.id]);
    // Pasamos password (texto plano) al email ANTES de que se pierda de memoria
    await emails.emailAsesorAprobado({ ...asesorRows[0] }, password);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar' });
  }
});

// ── PUT /asesores/admin/postulaciones/:id/rechazar ──
router.put('/admin/postulaciones/:id/rechazar', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE postulaciones SET estado=$1 WHERE id=$2 RETURNING *', ['rechazado', req.params.id]);
    await emails.emailAsesorRechazado(rows[0]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── PUT /asesores/admin/postulaciones/:id/contraoferta ──
router.put('/admin/postulaciones/:id/contraoferta', authAdmin, async (req, res) => {
  const { precio_ofrecido, argumento } = req.body;
  try {
    await pool.query('UPDATE postulaciones SET precio_ofrecido=$1,nota_admin=$2 WHERE id=$3', [precio_ofrecido, argumento, req.params.id]);
    res.json({ ok: true, mensaje: 'Contraoferta guardada. Cuando apruebes, se usará el precio ofrecido.' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── POST /asesores/admin/agregar — Admin agrega asesor directo ──
router.post('/admin/agregar', authAdmin, async (req, res) => {
  const { nombre, email, rol, especialidad, precio, modalidades, zoom_link, zoom_id, direccion, bio, tags } = req.body;
  const password = 'Asesor' + Math.random().toString(36).slice(-6).toUpperCase() + '!';
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(`
      INSERT INTO asesores (nombre,email,password_hash,rol,especialidad,precio,modalidades,zoom_link,zoom_id,direccion,bio,tags,estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'activo')
      RETURNING id, nombre, email, rol, especialidad, precio
    `, [nombre,email,hash,rol,especialidad,precio,modalidades||['videollamada'],zoom_link,zoom_id,direccion,bio,tags||[]]);
    // password se pasa en texto plano al email antes de perderse
    await emails.emailAsesorAprobado({ ...rows[0] }, password);
    res.status(201).json({ ok: true, asesor: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar asesor' });
  }
});

module.exports = router;
