const jwt = require('jsonwebtoken');

// ── Verificar token de asesor ──
function authAsesor(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'asesor') return res.status(403).json({ error: 'No autorizado' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ── Verificar token de admin ──
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ── Verificar token de cliente ──
function authCliente(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'cliente') return res.status(403).json({ error: 'No autorizado' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { authAsesor, authAdmin, authCliente };
