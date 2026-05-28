/**
 * ═══════════════════════════════════════════════════════════════════
 * CONSTANTES GLOBALES DE LA APLICACIÓN
 * ═══════════════════════════════════════════════════════════════════
 */

module.exports = {
  // ROLES Y PERMISOS
  ROLES: {
    ADMIN: 'admin',
    ASESOR: 'asesor',
    CLIENTE: 'cliente'
  },

  // ESTADOS DE USUARIOS
  USER_STATES: {
    ACTIVO: 'activo',
    INACTIVO: 'inactivo',
    BANEADO: 'baneado',
    SUSPENDIDO: 'suspendido',
    PENDIENTE: 'pendiente'
  },

  // ESTADOS DE SESIONES
  SESSION_STATES: {
    ESPERANDO_PROPUESTA: 'esperando_propuesta',
    PROPUESTA_ENVIADA: 'propuesta_enviada',
    ESPERANDO_PAGO: 'esperando_pago',
    PAGADA: 'pagada',
    REALIZADA: 'realizada',
    CANCELADA: 'cancelada'
  },

  // MODALIDADES
  MODALIDADES: {
    VIDEOLLAMADA: 'videollamada',
    PRESENCIAL: 'presencial'
  },

  // COMISIONES Y PAGOS
  PAYMENT: {
    COMISION_PLATAFORMA: 0.30,      // 30% comisión
    GANANCIA_ASESOR: 0.70,          // 70% al asesor
    PLAZO_PAGO_ASESOR_HORAS: 48,    // 48 hs después de sesión
    PLAZO_VIDEO_HORAS: 24           // 24 hs para entregar video
  },

  // VALIDACIONES
  VALIDACIONES: {
    PASSWORD_MIN_LENGTH: 8,
    NOMBRE_MIN_LENGTH: 3,
    NOMBRE_MAX_LENGTH: 200,
    BIO_MAX_LENGTH: 500,
    EMAIL_REGEX: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
    TELEFONO_REGEX: /^[0-9+\\-\\s()]+$/
  },

  // LÍMITES
  LIMITES: {
    RESENAS_POR_PAGINA: 10,
    ASESORES_POR_PAGINA: 20,
    MAX_SESIONES_SIMULTANEAS: 5,
    REINTENTO_MAXIMO: 3
  },

  // ESPECIALIDADES VÁLIDAS
  ESPECIALIDADES: [
    'legal',
    'finanzas',
    'coaching',
    'recursos-humanos',
    'marketing',
    'tecnologia',
    'negocios',
    'salud',
    'educacion',
    'otro'
  ],

  // CÓDIGOS DE ERROR
  ERROR_CODES: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN'
  },

  // MENSAJES DE ERROR
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'No encontrado',
    BAD_REQUEST: 'Solicitud inválida',
    CONFLICT: 'El recurso ya existe',
    INTERNAL_ERROR: 'Error del servidor',
    VALIDATION_ERROR: 'Error de validación',
    TOKEN_EXPIRED: 'Token expirado',
    INVALID_TOKEN: 'Token inválido',
    EMAIL_REQUIRED: 'Email es requerido',
    PASSWORD_REQUIRED: 'Contraseña es requerida',
    INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
    EMAIL_EXISTS: 'El email ya está registrado',
    PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres'
  },

  // DURACIÓN DE TOKENS
  JWT: {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d'
  }
};
