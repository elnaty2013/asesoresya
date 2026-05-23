-- ══════════════════════════════════════
-- ASESORESYA — BASE DE DATOS
-- Ejecutar en Railway → PostgreSQL → Query
-- ══════════════════════════════════════

-- EXTENSIÓN UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLA: CLIENTES ──
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  telefono VARCHAR(50),
  dni VARCHAR(20),
  zona VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: ASESORES ──
CREATE TABLE IF NOT EXISTS asesores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(100) NOT NULL,           -- "Abogada Civilista · 12 años"
  especialidad VARCHAR(100) NOT NULL,  -- legal, finanzas, coaching, etc
  precio INTEGER NOT NULL,             -- en pesos
  modalidades TEXT[] DEFAULT '{"videollamada"}', -- ["videollamada","presencial"]
  zoom_link VARCHAR(500),
  zoom_id VARCHAR(100),
  direccion VARCHAR(500),
  bio TEXT,
  foto_url VARCHAR(500),
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0,
  total_sesiones INTEGER DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, activo, suspendido
  dias_disponibles TEXT[] DEFAULT '{"lunes","martes","miercoles","jueves"}',
  hora_desde VARCHAR(5) DEFAULT '09:00',
  hora_hasta VARCHAR(5) DEFAULT '18:00',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: CLIENTES ──
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  telefono VARCHAR(50),
  zona VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'activo', -- activo, baneado
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: SESIONES ──
CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  asesor_id UUID REFERENCES asesores(id) ON DELETE CASCADE,
  tipo VARCHAR(100),           -- legal, finanzas, coaching, etc
  objetivo TEXT,               -- lo que quiere lograr el cliente
  modalidad VARCHAR(20),       -- videollamada, presencial
  zona_cliente VARCHAR(200),
  estado VARCHAR(30) DEFAULT 'esperando_propuesta',
  -- Estados: esperando_propuesta → propuesta_enviada → esperando_pago → pagada → realizada → cancelada
  fecha_propuesta DATE,
  hora_propuesta VARCHAR(5),
  zoom_link VARCHAR(500),
  zoom_id VARCHAR(100),
  direccion VARCHAR(500),
  nota_asesor TEXT,
  honorario INTEGER,           -- precio del asesor
  comision INTEGER,            -- 30% del honorario
  total INTEGER,               -- honorario + comision
  pago_confirmado BOOLEAN DEFAULT FALSE,
  pago_confirmado_en TIMESTAMP,
  pago_confirmado_por VARCHAR(100), -- "admin" o "automatico"
  comprobante_mp TEXT,         -- número de transacción MP
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: POSTULACIONES ──
CREATE TABLE IF NOT EXISTS postulaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telefono VARCHAR(50),
  zona VARCHAR(200),
  especialidad VARCHAR(100),
  modalidad VARCHAR(50),
  precio_pedido INTEGER,
  precio_ofrecido INTEGER,     -- contraoferta del admin
  precio_final INTEGER,        -- precio definitivo aprobado
  estado_precio VARCHAR(20) DEFAULT 'pendiente', -- pendiente, aceptado, rechazado
  anios_experiencia INTEGER,
  experiencia TEXT,
  cv_url VARCHAR(500),
  estado VARCHAR(30) DEFAULT 'pendiente',
  -- Estados: pendiente → entrevista_programada → aprobado → rechazado
  entrevista_fecha DATE,
  entrevista_hora VARCHAR(5),
  entrevista_modalidad VARCHAR(20),
  entrevista_zoom VARCHAR(500),
  entrevista_direccion VARCHAR(500),
  nota_admin TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: RESEÑAS ──
CREATE TABLE IF NOT EXISTS resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE UNIQUE, -- Una sola reseña por sesión
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  asesor_id UUID REFERENCES asesores(id) ON DELETE CASCADE,
  estrellas INTEGER CHECK (estrellas BETWEEN 1 AND 5),
  comentario TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, publicada, rechazada
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: DENUNCIAS ──
CREATE TABLE IF NOT EXISTS denuncias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  denunciante_email VARCHAR(200),
  denunciante_tipo VARCHAR(20),  -- cliente, asesor
  denunciado_nombre VARCHAR(200),
  denunciado_email VARCHAR(200),
  denunciado_tipo VARCHAR(20),   -- cliente, asesor
  motivo VARCHAR(200),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, investigando, resuelta
  resolucion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: REPORTES (errores de plataforma) ──
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(200),
  tipo VARCHAR(100),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'nuevo', -- nuevo, en_revision, resuelto
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLA: NOTIFICACIONES_MANTENIMIENTO ──
CREATE TABLE IF NOT EXISTS notif_mantenimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(200) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── ÍNDICES PARA PERFORMANCE ──
CREATE INDEX IF NOT EXISTS idx_sesiones_cliente ON sesiones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_asesor ON sesiones(asesor_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON sesiones(estado);
CREATE INDEX IF NOT EXISTS idx_resenas_asesor ON resenas(asesor_id);
CREATE INDEX IF NOT EXISTS idx_asesores_especialidad ON asesores(especialidad);
CREATE INDEX IF NOT EXISTS idx_asesores_estado ON asesores(estado);
-- Índice combinado para búsquedas con filtros (especialidad + estado)
CREATE INDEX IF NOT EXISTS idx_asesores_busqueda ON asesores(estado, especialidad);
-- Índice GIN para búsqueda por tags (array)
CREATE INDEX IF NOT EXISTS idx_asesores_tags ON asesores USING gin(tags);

-- ── FUNCIÓN: actualizar updated_at automáticamente ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sesiones_updated_at
  BEFORE UPDATE ON sesiones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════
-- DATOS DE PRUEBA (opcional)
-- ══════════════════════════════════════
-- Contraseña para todos los asesores de prueba: "1234"
-- Hash de "1234" con bcrypt rounds=10:
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO asesores (nombre, email, password_hash, rol, especialidad, precio, modalidades, zoom_link, zoom_id, direccion, bio, tags, estado) VALUES
('Dra. Laura Méndez', 'laura@asesoresya.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abogada Civilista · 12 años exp.', 'legal', 8500, '{"videollamada","presencial"}', 'https://zoom.us/j/92345678901', '923 4567 8901', 'Av. Córdoba 1250, CABA', 'Abogada civilista con 12 años de experiencia en derecho de familia, contratos y litigios civiles.', '{"contratos","familia","civil"}', 'activo'),
('Ing. Pablo Romero', 'pablo@asesoresya.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Asesor Financiero · CFA', 'finanzas', 9000, '{"videollamada","presencial"}', 'https://zoom.us/j/73456789012', '734 5678 9012', 'Microcentro, CABA', 'Asesor financiero certificado con especialización en inversiones y portfolio.', '{"inversiones","dolar","portfolio"}', 'activo'),
('Psic. Sofía Ramos', 'sofia@asesoresya.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Psicóloga Clínica · MN 54321', 'coaching', 5500, '{"videollamada","presencial"}', 'https://zoom.us/j/55678901234', '556 7890 1234', 'Belgrano, CABA', 'Psicóloga clínica especializada en ansiedad, autoestima y desarrollo personal.', '{"ansiedad","autoestima","metas"}', 'activo')
ON CONFLICT (email) DO NOTHING;
