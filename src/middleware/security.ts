/**
 * 安全中间件
 * 提供API路由的安全保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, CSRFProtection, InputValidator } from '@/lib/security';

// 速率限制配置
const RATE_LIMITS = {
  '/api/auth': { maxRequests: 5, windowMs: 60000 }, // 认证接口：每分钟5次
  '/api/wallet': { maxRequests: 10, windowMs: 60000 }, // 钱包接口：每分钟10次
  '/api/exchange': { maxRequests: 20, windowMs: 60000 }, // 交换接口：每分钟20次
  '/api/tasks': { maxRequests: 30, windowMs: 60000 }, // 任务接口：每分钟30次
  default: { maxRequests: 100, windowMs: 60000 }, // 默认：每分钟100次
};

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

/**
 * 速率限制中间件
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);
  
  // 获取对应的速率限制配置
  let rateLimit = RATE_LIMITS.default;
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      rateLimit = limit;
      break;
    }
  }
  
  // 检查速率限制
  const rateLimitKey = `${clientIP}:${pathname}`;
  if (RateLimiter.isRateLimited(rateLimitKey, rateLimit.maxRequests, rateLimit.windowMs)) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }
  
  return null;
}

/**
 * CSRF保护中间件
 */
export function csrfProtectionMiddleware(request: NextRequest): NextResponse | null {
  // 只对POST、PUT、DELETE请求进行CSRF检查
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return null;
  }
  
  const csrfToken = request.headers.get('x-csrf-token');
  
  if (!csrfToken || !CSRFProtection.validateToken(csrfToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token', code: 'CSRF_TOKEN_INVALID' },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * 输入验证中间件
 */
export async function inputValidationMiddleware(request: NextRequest): Promise<NextResponse | null> {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return null;
  }
  
  try {
    const body = await request.json();
    const pathname = request.nextUrl.pathname;
    
    // 根据不同的API路径进行相应的验证
    if (pathname.includes('/api/wallet')) {
      return validateWalletRequest(body);
    } else if (pathname.includes('/api/exchange')) {
      return validateExchangeRequest(body);
    } else if (pathname.includes('/api/tasks')) {
      return validateTaskRequest(body);
    }
    
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }
}

/**
 * 验证钱包相关请求
 */
function validateWalletRequest(body: any): NextResponse | null {
  if (body.address && !InputValidator.validateWalletAddress(body.address)) {
    return NextResponse.json(
      { error: 'Invalid wallet address format', code: 'INVALID_WALLET_ADDRESS' },
      { status: 400 }
    );
  }
  
  if (body.amount && !InputValidator.validateNumber(body.amount)) {
    return NextResponse.json(
      { error: 'Invalid amount format', code: 'INVALID_AMOUNT' },
      { status: 400 }
    );
  }
  
  return null;
}

/**
 * 验证交换相关请求
 */
function validateExchangeRequest(body: any): NextResponse | null {
  if (body.bnbAmount) {
    if (!InputValidator.validateNumber(body.bnbAmount)) {
      return NextResponse.json(
        { error: 'Invalid BNB amount format', code: 'INVALID_BNB_AMOUNT' },
        { status: 400 }
      );
    }
    
    const amount = parseFloat(body.bnbAmount);
    if (!InputValidator.validateRange(amount, 0.001, 100)) {
      return NextResponse.json(
        { error: 'BNB amount out of valid range', code: 'AMOUNT_OUT_OF_RANGE' },
        { status: 400 }
      );
    }
  }
  
  if (body.slippage) {
    if (!InputValidator.validateNumber(body.slippage)) {
      return NextResponse.json(
        { error: 'Invalid slippage format', code: 'INVALID_SLIPPAGE' },
        { status: 400 }
      );
    }
    
    const slippage = parseFloat(body.slippage);
    if (!InputValidator.validateRange(slippage, 0.1, 50)) {
      return NextResponse.json(
        { error: 'Slippage out of valid range (0.1% - 50%)', code: 'SLIPPAGE_OUT_OF_RANGE' },
        { status: 400 }
      );
    }
  }
  
  return null;
}

/**
 * 验证任务相关请求
 */
function validateTaskRequest(body: any): NextResponse | null {
  if (body.url && !InputValidator.validateUrl(body.url)) {
    return NextResponse.json(
      { error: 'Invalid URL format', code: 'INVALID_URL' },
      { status: 400 }
    );
  }
  
  if (body.hashtag && !InputValidator.validateHashtag(body.hashtag)) {
    return NextResponse.json(
      { error: 'Invalid hashtag format', code: 'INVALID_HASHTAG' },
      { status: 400 }
    );
  }
  
  if (body.content && !InputValidator.validateLength(body.content, 1, 5000)) {
    return NextResponse.json(
      { error: 'Content length must be between 1 and 5000 characters', code: 'INVALID_CONTENT_LENGTH' },
      { status: 400 }
    );
  }
  
  return null;
}

/**
 * 安全头部中间件
 */
export function securityHeadersMiddleware(response: NextResponse): NextResponse {
  // 设置安全头部
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // 设置CSP头部
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

/**
 * 主安全中间件
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  // 1. 速率限制检查
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return securityHeadersMiddleware(rateLimitResponse);
  }
  
  // 2. CSRF保护检查
  const csrfResponse = csrfProtectionMiddleware(request);
  if (csrfResponse) {
    return securityHeadersMiddleware(csrfResponse);
  }
  
  // 3. 输入验证检查
  const validationResponse = await inputValidationMiddleware(request);
  if (validationResponse) {
    return securityHeadersMiddleware(validationResponse);
  }
  
  // 4. 继续处理请求
  const response = NextResponse.next();
  
  // 5. 添加安全头部
  return securityHeadersMiddleware(response);
}

/**
 * 清理速率限制记录的定时任务
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    RateLimiter.cleanup();
  }, 60000); // 每分钟清理一次
}
