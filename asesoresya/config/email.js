/**
 * ═══════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE EMAILS
 * ═══════════════════════════════════════════════════════════════════
 */

module.exports = {
  // Configuración de Resend
  RESEND: {
    API_KEY: process.env.RESEND_API_KEY,
    FROM: process.env.EMAIL_FROM || 'noreply@asesoresya.com.ar',
    REPLY_TO: 'hola@asesoresya.com.ar'
  },

  // Plantillas por tipo de email
  TEMPLATES: {
    NUEVA_SOLICITUD: 'nueva_solicitud',
    PAGO_ASESOR: 'pago_asesor',
    SOLICITUD_ENVIADA: 'solicitud_enviada',
    PROPUESTA_HORARIO: 'propuesta_horario',
    PAGO_CONFIRMADO: 'pago_confirmado',
    RECORDATORIO: 'recordatorio',
    ENTREVISTA: 'entrevista',
    ASESOR_APROBADO: 'asesor_aprobado',
    ASESOR_RECHAZADO: 'asesor_rechazado'
  },

  // Configuración de reintentos
  REINTENTOS: {
    MAX_INTENTOS: 3,
    DELAY_MS: 5000
  },

  // Destinatarios para notificaciones internas
  ADMIN_EMAILS: [
    process.env.ADMIN_EMAIL || 'nathangarnek@asesoresya.com'
  ]
};
