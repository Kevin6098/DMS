type LogMeta = Record<string, unknown>;

const isDebugEnabled = process.env.REACT_APP_DEBUG_API === 'true';
const isProduction = process.env.NODE_ENV === 'production';

export const clientLogger = {
  debug: (message: string, meta?: LogMeta) => {
    if (isDebugEnabled) {
      console.debug(message, meta);
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (!isProduction || isDebugEnabled) {
      console.warn(message, meta);
    }
  },
  error: (message: string, meta?: unknown) => {
    if (!isProduction || isDebugEnabled) {
      console.error(message, meta);
    }
  },
};
