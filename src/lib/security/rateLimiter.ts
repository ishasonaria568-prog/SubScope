/**
 * Rate Limiter for SubScope API endpoints.
 * Protects serverless and Node.js environments from abuse and denial of service.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  activeScans: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 scan requests per minute per IP
const MAX_CONCURRENT_SCANS = 2; // Max 2 concurrent scans per IP

const ipStorage = new Map<string, RateLimitRecord>();

// Evict expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStorage.entries()) {
    if (record.resetAt <= now && record.activeScans <= 0) {
      ipStorage.delete(ip);
    }
  }
}, 60 * 1000).unref?.();

/**
 * Extracts client IP from incoming request headers or socket.
 */
export function getClientIp(req: any): string {
  if (!req) return '127.0.0.1';

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }

  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // in seconds
  error?: string;
}

/**
 * Checks and updates rate limit for an incoming request.
 */
export function checkRateLimit(req: any): RateLimitCheckResult {
  const ip = getClientIp(req);
  const now = Date.now();

  let record = ipStorage.get(ip);

  if (!record || record.resetAt <= now) {
    record = {
      count: 0,
      resetAt: now + WINDOW_MS,
      activeScans: record ? record.activeScans : 0,
    };
    ipStorage.set(ip, record);
  }

  // Check concurrent scans limit
  if (record.activeScans >= MAX_CONCURRENT_SCANS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: 15,
      error: `Too many concurrent scans in progress (${record.activeScans}/${MAX_CONCURRENT_SCANS}). Please wait for the ongoing scan to complete.`,
    };
  }

  // Check window frequency limit
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfter: retryAfterSeconds,
      error: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} scans per minute. Please retry in ${retryAfterSeconds}s.`,
    };
  }

  record.count++;
  const remaining = MAX_REQUESTS_PER_WINDOW - record.count;

  return {
    allowed: true,
    remaining,
  };
}

/**
 * Increments active concurrent scan count for an IP.
 */
export function markScanStarted(req: any): void {
  const ip = getClientIp(req);
  const record = ipStorage.get(ip);
  if (record) {
    record.activeScans = (record.activeScans || 0) + 1;
  }
}

/**
 * Decrements active concurrent scan count for an IP.
 */
export function markScanEnded(req: any): void {
  const ip = getClientIp(req);
  const record = ipStorage.get(ip);
  if (record && record.activeScans > 0) {
    record.activeScans--;
  }
}
