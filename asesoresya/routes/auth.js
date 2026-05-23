const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const token = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /auth/login-asesor ──
router.post('/login-asesor', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const { rows } = await pool.query('SELECT * FROM asesores WHERE email=$1 AND estado=$2', [email.toLowerCase(), 'activo']);
    if (!rows.length) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const asesor = rows[0];
    const ok = await bcrypt.compare(password, asesor.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const t = token({ id: asesor.id, email: asesor.email, nombre: asesor.nombre, rol: 'asesor' });
    res.json({
      token: t,
      asesor: { id: asesor.id, nombre: asesor.nombre, email: asesor.email, rol: asesor.rol, especialidad: asesor.especialidad, foto_url: asesor.foto_url }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── POST /auth/login-cliente ──
router.post('/login-cliente', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE email=$1 AND estado=$2', [email.toLowerCase(), 'activo']);
    if (!rows.length) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const cliente = rows[0];
    if (!cliente.password_hash) return res.status(401).json({ error: 'Esta cuenta no tiene contraseña. Registrate.' });
    const ok = await bcrypt.compare(password, cliente.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const t = token({ id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: 'cliente' });
    res.json({ token: t, cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── POST /auth/registro-cliente ──
router.post('/registro-cliente', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  try {
    const existe = await pool.query('SELECT id FROM clientes WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length) return res.status(409).json({ error: 'Este email ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [nombre, email.toLowerCase(), hash]
    );
    const t = token({ id: rows[0].id, email: rows[0].email, nombre: rows[0].nombre, rol: 'cliente' });
    res.status(201).json({ token: t, cliente: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── POST /auth/login-admin ──
router.post('/login-admin', (req, res) => {
  const { email, password, codigo } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD &&
    codigo === process.env.ADMIN_CODE
  ) {
    const t = token({ email, rol: 'admin' });
    res.json({ token: t });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

module.exports = router;
