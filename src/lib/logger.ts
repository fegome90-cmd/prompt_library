/**
 * WO-0010: Logger estructurado
 * Reemplaza console.error con logging estructurado para producción
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Obtener nivel de log desde variable de entorno
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function formatLog(entry: LogEntry): string {
  // En producción, usar formato JSON
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  
  // En desarrollo, formato legible
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('debug')) return;
    console.debug(formatLog(createEntry('debug', message, context)));
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('info')) return;
    console.info(formatLog(createEntry('info', message, context)));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('warn')) return;
    console.warn(formatLog(createEntry('warn', message, context)));
  },

  error(message: string, context?: Record<string, unknown>): void {
    // Siempre loguear errores
    console.error(formatLog(createEntry('error', message, context)));
  },
};

// Helper para logging de API
export function logApiError(
  endpoint: string, 
  error: unknown, 
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`API Error: ${endpoint}`, {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}

// Helper para logging de operaciones
export function logOperation(
  operation: string,
  details: Record<string, unknown>
): void {
  logger.info(operation, details);
}
