require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const requestLogger = require('./middleware/requestLogger');
const { limiter, loginLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── SEGURIDAD ──
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ── MIDDLEWARE ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLogger);
app.use(limiter);

// ── RUTAS DE API ──
app.use('/api/auth', loginLimiter, require('./routes/auth'));
app.use('/api/asesores', require('./routes/asesores'));
app.use('/api/sesiones', require('./routes/sesiones'));
app.use('/api/resenas', require('./routes/resenas'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/misc', require('./routes/misc'));

// ── HEALTH CHECK ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ── SERVIR PÁGINAS HTML ──
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/asesor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel-asesor.html')));
app.get('/mi-panel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel-cliente.html')));
app.get('/terminos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terminos.html')));
app.get('/privacidad', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacidad.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));

// ── 404 ──
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── ERROR HANDLER GLOBAL ──
app.use(errorHandler);

// ── INICIAR SERVIDOR ──
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log('🚀 AsesoresYa Backend v2.0.0');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log(`📍 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email: ${process.env.EMAIL_FROM ? '✅' : '❌'} ${process.env.RESEND_API_KEY ? 'Resend' : 'No configurado'}`);
  console.log(`🗄️  Base de datos: ${process.env.DATABASE_URL ? '✅ Conectada' : '❌ Falta'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ Falta'}`);
  console.log('═════════════════════════════════════════════════════════════════\n');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada sin manejar:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

module.exports = app;
