import { NextRequest, NextResponse } from 'next/server';

/**
 * 安全头部中间件
 * 添加各种安全头部以防止常见的Web攻击
 */

export function securityHeaders(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: https:",
    "connect-src 'self' https: wss: ws:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // 设置安全头部
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // HTTPS强制 (生产环境)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 移除服务器信息
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * CORS配置
 */
export function corsHeaders(request: NextRequest) {
  const response = NextResponse.next();
  
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://sociomint.top',
    'https://www.sociomint.top',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * 速率限制
 */
const rateLimitMap = new Map();

export function rateLimit(request: NextRequest, limit: number = 100, windowMs: number = 60000) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;

  // 清理过期记录
  const userRequests = rateLimitMap.get(ip) || [];
  const validRequests = userRequests.filter((timestamp: number) => timestamp > windowStart);

  if (validRequests.length >= limit) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(windowMs / 1000).toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil((windowStart + windowMs) / 1000).toString()
      }
    });
  }

  // 记录当前请求
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', (limit - validRequests.length).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000).toString());

  return response;
}

/**
 * 输入验证和清理
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // 移除潜在的HTML标签
    .replace(/javascript:/gi, '') // 移除JavaScript协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .trim()
    .slice(0, 1000); // 限制长度
}

/**
 * 验证钱包地址
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // 以太坊地址格式验证
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * 验证交易哈希
 */
export function isValidTxHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  
  // 交易哈希格式验证
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  return txHashRegex.test(hash);
}

/**
 * SQL注入防护
 */
export function preventSQLInjection(query: string): boolean {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i
  ];

  return !sqlInjectionPatterns.some(pattern => pattern.test(query));
}

/**
 * XSS防护
 */
export function preventXSS(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * CSRF Token生成和验证
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

/**
 * 敏感数据脱敏
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = ['password', 'privateKey', 'secret', 'token', 'key'];
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * 安全日志记录
 */
export function securityLog(event: string, details: any, level: 'info' | 'warn' | 'error' = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: maskSensitiveData(details),
    level,
    userAgent: details.userAgent || 'unknown',
    ip: details.ip || 'unknown'
  };
  
  console.log(`[SECURITY-${level.toUpperCase()}]`, JSON.stringify(logEntry));
  
  // 在生产环境中，这里应该发送到安全监控系统
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    // 发送到Sentry或其他监控服务
  }
}

export default {
  securityHeaders,
  corsHeaders,
  rateLimit,
  sanitizeInput,
  isValidWalletAddress,
  isValidTxHash,
  preventSQLInjection,
  preventXSS,
  generateCSRFToken,
  validateCSRFToken,
  maskSensitiveData,
  securityLog
};
