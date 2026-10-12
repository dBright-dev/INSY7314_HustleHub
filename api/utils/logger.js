/**
 * Simple logging with timestamps and levels
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, 
      Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, 
      Object.keys(meta).length ? meta : '');
  },
  error: (message, meta = {}) => {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, 
      Object.keys(meta).length ? meta : '');
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, 
        Object.keys(meta).length ? meta : '');
    }
  },
};

module.exports = logger;