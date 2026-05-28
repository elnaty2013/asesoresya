/**
 * ═══════════════════════════════════════════════════════════════════
 * MIDDLEWARE DE MANEJO CENTRALIZADO DE ERRORES
 * ═══════════════════════════════════════════════════════════════════
 */

const { ERROR_CODES, ERROR_MESSAGES } = require('../config/constants');

class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de error global
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Error conocido (AppError)
  if (err instanceof AppError) {
    const response = {
      error: err.message,
      code: err.code,
      ...(isDevelopment && { stack: err.stack })
    };
    return res.status(err.statusCode).json(response);
  }

  // Error de validación de base de datos
  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(409).json({
      error: 'El recurso ya existe',
      code: ERROR_CODES.CONFLICT
    });
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return res.status(400).json({
      error: 'Referencia inválida a otro recurso',
      code: ERROR_CODES.BAD_REQUEST
    });
  }

  // Error genérico no controlado
  console.error('❌ Error no controlado:', {
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  res.status(500).json({
    error: 'Error interno del servidor',
    code: ERROR_CODES.INTERNAL_ERROR,
    ...(isDevelopment && { details: err.message })
  });
};

module.exports = { AppError, errorHandler };
