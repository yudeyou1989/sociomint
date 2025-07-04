/**
 * CSRF令牌API路由
 * 提供CSRF令牌的生成和验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';

/**
 * 获取CSRF令牌
 */
export async function GET(request: NextRequest) {
  try {
    // 生成新的CSRF令牌
    const token = CSRFProtection.generateToken();
    
    // 设置令牌到会话中
    CSRFProtection.setToken(token);
    
    return NextResponse.json({
      success: true,
      token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
        code: 'CSRF_GENERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * 验证CSRF令牌
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSRF token is required',
          code: 'CSRF_TOKEN_REQUIRED'
        },
        { status: 400 }
      );
    }
    
    // 验证令牌
    const isValid = CSRFProtection.validateToken(token);
    
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      valid: true,
      message: 'CSRF token is valid'
    });
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate CSRF token',
        code: 'CSRF_VALIDATION_FAILED'
      },
      { status: 500 }
    );
  }
}
