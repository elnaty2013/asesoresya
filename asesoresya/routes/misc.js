const router = require('express').Router();
const pool   = require('../db/pool');
const { authCliente, authAdmin } = require('../middleware/auth');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `AsesoresYa <${process.env.EMAIL_FROM || 'asesoresya@gmail.com'}>`;
const URL    = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── POST /misc/reporte — Error de plataforma ──
router.post('/reporte', async (req, res) => {
  const { email, tipo, descripcion } = req.body;
  if (!descripcion || descripcion.trim().length < 10) {
    return res.status(400).json({ error: 'Descripción requerida (mínimo 10 caracteres)' });
  }
  try {
    await pool.query(
      'INSERT INTO reportes (email,tipo,descripcion) VALUES ($1,$2,$3)',
      [email || 'anonimo', tipo || 'otro', descripcion]
    );
    // Notificar al admin
    await resend.emails.send({
      from: FROM, to: 'asesoresya@gmail.com',
      subject: `🚨 Nuevo reporte: ${tipo}`,
      html: `<p><strong>Email:</strong> ${email}</p><p><strong>Tipo:</strong> ${tipo}</p><p><strong>Descripción:</strong> ${descripcion}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar reporte' });
  }
});

// ── POST /misc/denuncia ──
router.post('/denuncia', async (req, res) => {
  const { denunciante_email, denunciante_tipo, denunciado_nombre, denunciado_email, denunciado_tipo, motivo, descripcion } = req.body;

  // Validación estricta antes de tocar la DB o Resend
  if (!denunciado_nombre || !motivo || !descripcion) {
    return res.status(400).json({ error: 'Campos obligatorios vacíos: denunciado_nombre, motivo, descripcion' });
  }
  if (descripcion.length < 20) {
    return res.status(400).json({ error: 'La descripción debe tener al menos 20 caracteres' });
  }

  try {
    await pool.query(
      'INSERT INTO denuncias (denunciante_email,denunciante_tipo,denunciado_nombre,denunciado_email,denunciado_tipo,motivo,descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [denunciante_email, denunciante_tipo, denunciado_nombre, denunciado_email, denunciado_tipo, motivo, descripcion]
    );
    await resend.emails.send({
      from: FROM, to: 'asesoresya@gmail.com',
      subject: `⚠️ Nueva denuncia contra ${denunciado_tipo}: ${denunciado_nombre}`,
      html: `<p><strong>Denunciante:</strong> ${denunciante_email} (${denunciante_tipo})</p><p><strong>Denunciado:</strong> ${denunciado_nombre} - ${denunciado_email} (${denunciado_tipo})</p><p><strong>Motivo:</strong> ${motivo}</p><p><strong>Descripción:</strong> ${descripcion}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar denuncia' });
  }
});

// ── POST /misc/notif-mantenimiento ──
router.post('/notif-mantenimiento', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido' });
  try {
    await pool.query(
      'INSERT INTO notif_mantenimiento (email) VALUES ($1) ON CONFLICT DO NOTHING',
      [email.toLowerCase()]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// ── GET /misc/alias — Devuelve el alias de MP para mostrar en el frontend ──
router.get('/alias', (req, res) => {
  res.json({ alias: process.env.MP_ALIAS || 'asesoresya' });
});

module.exports = router;
