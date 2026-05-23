require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── RUTAS ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/asesores', require('./routes/asesores'));
app.use('/api/sesiones', require('./routes/sesiones'));
app.use('/api/resenas',  require('./routes/resenas'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/misc',     require('./routes/misc'));

// ── SERVIR HTML ──
app.get('/',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/asesor',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel-asesor.html')));
app.get('/mi-panel',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel-cliente.html')));
app.get('/terminos',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'terminos.html')));
app.get('/faq',        (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));

// ── 404 ──
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── INICIAR ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AsesoresYa corriendo en puerto ${PORT}`);
  console.log(`📧 Resend: ${process.env.RESEND_API_KEY ? '✅ configurado' : '❌ falta'}`);
  console.log(`🗄️  DB: ${process.env.DATABASE_URL ? '✅ configurada' : '❌ falta'}`);
});

module.exports = app;
