const router = require('express').Router();
const pool = require('../db/pool');
const { authCliente, authAsesor, authAdmin } = require('../middleware/auth');
const emails = require('../emails/templates');

// ── POST /sesiones — Cliente crea solicitud ──
router.post('/', authCliente, async (req, res) => {
  const { asesor_id, tipo, objetivo, modalidad, zona_cliente } = req.body;
  if (!asesor_id || !tipo || !objetivo || !modalidad) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  try {
    // Obtener datos del asesor
    const asesorQ = await pool.query('SELECT * FROM asesores WHERE id=$1 AND estado=$2', [asesor_id, 'activo']);
    if (!asesorQ.rows.length) return res.status(404).json({ error: 'Asesor no encontrado' });
    const asesor = asesorQ.rows[0];

    // Obtener datos del cliente
    const clienteQ = await pool.query('SELECT * FROM clientes WHERE id=$1', [req.user.id]);
    const cliente = clienteQ.rows[0];

    // Calcular en el SERVIDOR, nunca confiar en precios del cliente
    const honorario = Math.round(asesor.precio);
    const comision  = Math.round(asesor.precio * 0.30);
    const total     = honorario; // El cliente paga solo el honorario

    const { rows } = await pool.query(`
      INSERT INTO sesiones (cliente_id, asesor_id, tipo, objetivo, modalidad, zona_cliente, honorario, comision, total, estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'esperando_propuesta')
      RETURNING *
    `, [req.user.id, asesor_id, tipo, objetivo, modalidad, zona_cliente || '', honorario, comision, total]);

    const sesion = rows[0];

    // Emails automáticos
    await emails.emailNuevaSolicitud(asesor, sesion, cliente);
    await emails.emailSolicitudEnviada(cliente, sesion, asesor);

    res.status(201).json({ ok: true, sesion_id: sesion.id, mensaje: 'Solicitud enviada. El asesor recibirá una notificación.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
});

// ── GET /sesiones/mis-sesiones — Cliente ve sus sesiones ──
router.get('/mis-sesiones', authCliente, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, a.nombre as asesor_nombre, a.rol as asesor_rol, a.foto_url as asesor_foto
      FROM sesiones s
      JOIN asesores a ON s.asesor_id = a.id
      WHERE s.cliente_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// ── GET /sesiones/solicitudes — Asesor ve sus solicitudes ──
router.get('/solicitudes', authAsesor, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, c.nombre as cliente_nombre, c.email as cliente_email
      FROM sesiones s
      JOIN clientes c ON s.cliente_id = c.id
      WHERE s.asesor_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// ── PUT /sesiones/:id/propuesta — Asesor propone horario ──
router.put('/:id/propuesta', authAsesor, async (req, res) => {
  const { fecha, hora, zoom_link, zoom_id, direccion, nota_asesor } = req.body;
  if (!fecha || !hora) return res.status(400).json({ error: 'Fecha y hora requeridas' });

  // Validar que sea dentro de 2 semanas
  const fechaProp = new Date(fecha);
  const hoy = new Date();
  const maxFecha = new Date();
  maxFecha.setDate(hoy.getDate() + 14);
  if (fechaProp < hoy || fechaProp > maxFecha) {
    return res.status(400).json({ error: 'La fecha debe ser dentro de las próximas 2 semanas' });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE sesiones SET
        estado = 'propuesta_enviada',
        fecha_propuesta = $1, hora_propuesta = $2,
        zoom_link = $3, zoom_id = $4, direccion = $5, nota_asesor = $6,
        updated_at = NOW()
      WHERE id = $7 AND asesor_id = $8
      RETURNING *
    `, [fecha, hora, zoom_link || '', zoom_id || '', direccion || '', nota_asesor || '', req.params.id, req.user.id]);

    if (!rows.length) return res.status(404).json({ error: 'Sesión no encontrada' });
    const sesion = rows[0];

    // Obtener datos para email
    const clienteQ = await pool.query('SELECT * FROM clientes WHERE id=$1', [sesion.cliente_id]);
    const asesorQ  = await pool.query('SELECT * FROM asesores WHERE id=$1', [req.user.id]);
    await emails.emailPropuestaHorario(clienteQ.rows[0], sesion, asesorQ.rows[0]);

    res.json({ ok: true, sesion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar propuesta' });
  }
});

// ── PUT /sesiones/:id/rechazar — Asesor rechaza solicitud ──
router.put('/:id/rechazar', authAsesor, async (req, res) => {
  try {
    await pool.query(`
      UPDATE sesiones SET estado='cancelada', updated_at=NOW()
      WHERE id=$1 AND asesor_id=$2
    `, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al rechazar' });
  }
});

// ── PUT /sesiones/:id/confirmar-pago — Admin confirma transferencia ──
router.put('/:id/confirmar-pago', authAdmin, async (req, res) => {
  const { comprobante } = req.body;
  try {
    // Estado: esperando_propuesta → propuesta_enviada → pagada → realizada
    // El Zoom SOLO se entrega cuando estado = 'pagada'
    const { rows } = await pool.query(`
      UPDATE sesiones SET
        estado = 'pagada',
        pago_confirmado = TRUE,
        pago_confirmado_en = NOW(),
        pago_confirmado_por = 'admin',
        comprobante_mp = $1,
        updated_at = NOW()
      WHERE id = $2 AND estado = 'propuesta_enviada'
      RETURNING *
    `, [comprobante || '', req.params.id]);

    if (!rows.length) {
      return res.status(400).json({ error: 'La sesión no está en estado correcto para confirmar pago' });
    }

    if (!rows.length) return res.status(404).json({ error: 'Sesión no encontrada' });
    const sesion = rows[0];

    // Obtener datos para emails
    const clienteQ = await pool.query('SELECT * FROM clientes WHERE id=$1', [sesion.cliente_id]);
    const asesorQ  = await pool.query('SELECT * FROM asesores WHERE id=$1', [sesion.asesor_id]);

    // Emails: cliente recibe Zoom, asesor sabe que fue confirmado
    await emails.emailPagoConfirmado(clienteQ.rows[0], sesion, asesorQ.rows[0]);
    await emails.emailPagoAsesor(asesorQ.rows[0], sesion, clienteQ.rows[0]);

    res.json({ ok: true, sesion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

// ── PUT /sesiones/:id/marcar-realizada — Asesor marca sesión como realizada ──
router.put('/:id/marcar-realizada', authAsesor, async (req, res) => {
  try {
    await pool.query(`
      UPDATE sesiones SET estado='realizada', updated_at=NOW()
      WHERE id=$1 AND asesor_id=$2
    `, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar realizada' });
  }
});

// ── GET /sesiones/todas — Admin ve todas las sesiones ──
router.get('/todas', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
        c.nombre as cliente_nombre, c.email as cliente_email,
        a.nombre as asesor_nombre, a.email as asesor_email
      FROM sesiones s
      JOIN clientes c ON s.cliente_id = c.id
      JOIN asesores a ON s.asesor_id = a.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// ── GET /sesiones/pendientes-pago — Admin ve transferencias a confirmar ──
router.get('/pendientes-pago', authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
        c.nombre as cliente_nombre, c.email as cliente_email,
        a.nombre as asesor_nombre
      FROM sesiones s
      JOIN clientes c ON s.cliente_id = c.id
      JOIN asesores a ON s.asesor_id = a.id
      WHERE s.estado = 'propuesta_enviada'
      ORDER BY s.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
