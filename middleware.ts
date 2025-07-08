import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, corsHeaders, rateLimit, securityLog } from './src/middleware/securityHeaders';

/**
 * Next.js中间件
 * 处理安全、CORS、速率限制等
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 记录请求
  securityLog('request', {
    method: request.method,
    pathname,
    userAgent: request.headers.get('user-agent'),
    ip: request.ip || request.headers.get('x-forwarded-for')
  });

  // API路由的特殊处理
  if (pathname.startsWith('/api/')) {
    // 对API路由应用更严格的速率限制
    const apiRateLimit = rateLimit(request, 50, 60000); // 每分钟50次请求
    if (apiRateLimit.status === 429) {
      securityLog('rate_limit_exceeded', {
        pathname,
        ip: request.ip || request.headers.get('x-forwarded-for')
      }, 'warn');
      return apiRateLimit;
    }

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 });
    }

    // 应用CORS头部
    const corsResponse = corsHeaders(request);
    
    // 应用安全头部
    const securityResponse = securityHeaders(request);
    
    // 合并头部
    const response = NextResponse.next();
    corsResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    securityResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // 对敏感路径应用额外保护
  const sensitiveRoutes = ['/admin', '/profile', '/vault'];
  if (sensitiveRoutes.some(route => pathname.startsWith(route))) {
    const sensitiveRateLimit = rateLimit(request, 20, 60000); // 每分钟20次请求
    if (sensitiveRateLimit.status === 429) {
      securityLog('sensitive_route_rate_limit', {
        pathname,
        ip: request.ip || request.headers.get('x-forwarded-for')
      }, 'warn');
      return sensitiveRateLimit;
    }
  }

  // 阻止可疑的路径
  const suspiciousPatterns = [
    /\.php$/,
    /\.asp$/,
    /\.jsp$/,
    /wp-admin/,
    /wp-login/,
    /admin\.php/,
    /phpmyadmin/,
    /\.env$/,
    /\.git/,
    /\.svn/,
    /backup/,
    /config/
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
    securityLog('suspicious_path_access', {
      pathname,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')
    }, 'error');
    
    return new NextResponse('Not Found', { status: 404 });
  }

  // 应用安全头部到所有响应
  return securityHeaders(request);
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
