import { NextRequest, NextResponse } from 'next/server';
// import { securityHeaders, corsHeaders, rateLimit, securityLog } from './src/middleware/securityHeaders';

/**
 * Next.js中间件 - 静态导出模式下暂时禁用
 * 处理安全、CORS、速率限制等
 */

export function middleware(request: NextRequest) {
  // 静态导出模式下简化中间件
  return NextResponse.next();
  // 静态导出模式下的简化逻辑已在上面处理
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
