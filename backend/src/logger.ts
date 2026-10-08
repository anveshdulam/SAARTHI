import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

export const requestContext = new AsyncLocalStorage<LogContext>();

const REDACTED = "[REDACTED]";

function redact(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj; 
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) return obj.map(redact);
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('key') ||
        lowerKey.includes('credentials')
      ) {
        result[key] = REDACTED;
      } else {
        result[key] = redact(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

function normalizeError(err: any): any {
  if (!err) return err;
  if (err instanceof Error) {
    return {
      error_name: err.name,
      message: redact(err.message),
      error_code: (err as any).code || (err as any).error_code || (err as any).errorCode,
      stack: err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : undefined
    };
  }
  // If it's a raw object, redact deeply but avoid huge subtrees
  return redact(err);
}

const LEVELS: Record<string, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

let configuredLevel = LEVELS.info;
const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
if (LEVELS[envLevel] !== undefined) {
  configuredLevel = LEVELS[envLevel];
} else {
  console.warn(`[WARN] Invalid LOG_LEVEL provided. Defaulting to 'info'.`);
}

function log(level: string, message: string, meta: Record<string, any> = {}, service: string = "backend") {
  const recordLevel = LEVELS[level] || 20;
  if (recordLevel < configuredLevel) return;

  const context = requestContext.getStore() || {};
  const payload: Record<string, any> = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    request_id: context.requestId,
    user_id: context.userId,
    ...meta
  };

  if (payload.error) {
    payload.error = normalizeError(payload.error);
  }
  if (payload.err) {
    payload.error = normalizeError(payload.err);
    delete payload.err;
  }

  for (const key of Object.keys(payload)) {
    if (key !== 'error' && key !== 'message' && key !== 'timestamp' && key !== 'level' && key !== 'service' && key !== 'request_id' && key !== 'user_id') {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('auth') || lowerKey.includes('cookie') || lowerKey.includes('key') || lowerKey.includes('credentials')) {
        payload[key] = "[REDACTED]";
      } else if (typeof payload[key] === 'object') {
        payload[key] = redact(payload[key]);
      }
    }
  }

  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }

  let output = JSON.stringify(payload);

  if (process.env.NODE_ENV === "development") {
    const { timestamp, level: lvl, service: svc, message: msg, request_id, operation, duration_ms, ...rest } = payload;
    const reqStr = request_id ? ` request_id=${request_id}` : "";
    const opStr = operation ? ` operation=${operation}` : "";
    const durStr = duration_ms !== undefined ? ` duration_ms=${duration_ms}` : "";
    
    let extra = "";
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "object") {
        extra += ` ${k}=${JSON.stringify(v)}`;
      } else {
        extra += ` ${k}=${v}`;
      }
    }
    
    output = `${timestamp} ${lvl.toUpperCase()} [${svc}] ${msg}${reqStr}${opStr}${durStr}${extra}`;
  }

  if (level === "error" || level === "warn") {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (msg: string, meta?: any, service?: string) => log("info", msg, meta, service),
  warn: (msg: string, meta?: any, service?: string) => log("warn", msg, meta, service),
  error: (msg: string, meta?: any, service?: string) => log("error", msg, meta, service),
  debug: (msg: string, meta?: any, service?: string) => log("debug", msg, meta, service),
};
