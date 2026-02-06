export const logger = {
  info: (message: string, meta?: any) => {
    log('INFO', message, meta);
  },
  warn: (message: string, meta?: any) => {
    log('WARN', message, meta);
  },
  error: (message: string, error?: any) => {
    log('ERROR', message, { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
  },
};

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: any) {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'production') {
    // JSON logging for production monitoring tools (Datadog, CloudWatch, etc.)
    console.log(JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    }));
  } else {
    // Pretty printing for development
    const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';

    console.log(`${color}[${level}]${reset} ${message}`);
    if (meta) {
        console.dir(meta, { depth: null, colors: true });
    }
  }
}
