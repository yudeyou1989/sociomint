/**
 * API路由速率限制中间件
 * 为Next.js API路由提供速率限制保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, RateLimitConfig } from '@/utils/rateLimiter';

// 获取客户端IP地址
const getClientIP = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
};

// 获取用户标识符
const getUserIdentifier = (req: NextRequest): string => {
  // 优先使用用户ID（如果已认证）
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      // 这里可以解析JWT token获取用户ID
      // const token = authHeader.replace('Bearer ', '');
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return `user:${decoded.userId}`;
    } catch (error) {
      // Token无效，使用IP
    }
  }
  
  // 使用IP地址作为标识符
  return `ip:${getClientIP(req)}`;
};

// 创建速率限制中间件
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const middleware = rateLimitMiddleware({
    ...config,
    keyGenerator: (req: NextRequest) => getUserIdentifier(req)
  });

  return async (req: NextRequest) => {
    try {
      // 创建模拟的响应对象
      const headers = new Headers();
      const mockRes = {
        setHeader: (name: string, value: string | number) => {
          headers.set(name, value.toString());
        },
        status: (code: number) => ({
          json: (data: any) => {
            return NextResponse.json(data, { status: code, headers });
          }
        })
      };

      // 执行速率限制检查
      const result = middleware(req, mockRes);
      
      if (result === true) {
        // 通过检查，返回headers
        return { success: true, headers };
      } else {
        // 被限制，返回错误响应
        return { success: false, response: result };
      }
    } catch (error: any) {
      if (error.message.includes('请求过于频繁')) {
        return {
          success: false,
          response: NextResponse.json(
            {
              error: 'Too Many Requests',
              message: error.message,
              code: 'RATE_LIMIT_EXCEEDED'
            },
            { status: 429 }
          )
        };
      }
      throw error;
    }
  };
};

// 预定义的中间件
export const rateLimitMiddlewares = {
  // 严格限制（登录、注册等）
  strict: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.strict),
  
  // 中等限制（API调用）
  moderate: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.moderate),
  
  // 宽松限制（一般请求）
  lenient: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.lenient),
  
  // 钱包连接限制
  walletConnect: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.walletConnect),
  
  // 交易提交限制
  transaction: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.transaction),
  
  // 社交任务限制
  socialTask: createRateLimitMiddleware(RATE_LIMIT_CONFIGS.socialTask)
};

// 高阶函数：为API路由添加速率限制
export const withRateLimit = (
  handler: (req: NextRequest) => Promise<NextResponse>,
  limitType: keyof typeof rateLimitMiddlewares = 'moderate'
) => {
  const middleware = rateLimitMiddlewares[limitType];
  
  return async (req: NextRequest) => {
    // 执行速率限制检查
    const limitResult = await middleware(req);
    
    if (!limitResult.success) {
      return limitResult.response;
    }
    
    // 执行原始处理器
    const response = await handler(req);
    
    // 添加速率限制头部
    if (limitResult.headers) {
      limitResult.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
};

// 路由级别的速率限制装饰器
export const rateLimit = (limitType: keyof typeof rateLimitMiddlewares = 'moderate') => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      const middleware = rateLimitMiddlewares[limitType];
      const limitResult = await middleware(req);
      
      if (!limitResult.success) {
        return limitResult.response;
      }
      
      const response = await method.apply(this, [req, ...args]);
      
      // 添加速率限制头部
      if (limitResult.headers && response instanceof NextResponse) {
        limitResult.headers.forEach((value, key) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    };
    
    return descriptor;
  };
};

// 自适应速率限制（根据负载调整）
export class AdaptiveRateLimit {
  private baseConfig: RateLimitConfig;
  private currentMultiplier: number = 1;
  private lastAdjustment: number = Date.now();
  private errorRate: number = 0;
  private requestCount: number = 0;
  private errorCount: number = 0;

  constructor(baseConfig: RateLimitConfig) {
    this.baseConfig = baseConfig;
  }

  // 记录请求结果
  recordRequest(isError: boolean) {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }

    // 每分钟调整一次
    const now = Date.now();
    if (now - this.lastAdjustment > 60000) {
      this.adjustLimits();
      this.lastAdjustment = now;
      this.requestCount = 0;
      this.errorCount = 0;
    }
  }

  // 调整限制
  private adjustLimits() {
    if (this.requestCount === 0) return;

    this.errorRate = this.errorCount / this.requestCount;

    // 如果错误率高，降低限制
    if (this.errorRate > 0.1) {
      this.currentMultiplier = Math.max(0.5, this.currentMultiplier * 0.8);
    } 
    // 如果错误率低，逐渐恢复限制
    else if (this.errorRate < 0.05) {
      this.currentMultiplier = Math.min(1, this.currentMultiplier * 1.1);
    }
  }

  // 获取当前配置
  getCurrentConfig(): RateLimitConfig {
    return {
      ...this.baseConfig,
      maxRequests: Math.floor(this.baseConfig.maxRequests * this.currentMultiplier)
    };
  }
}

// 全局自适应限制器
const adaptiveLimiters = new Map<string, AdaptiveRateLimit>();

// 获取自适应限制器
export const getAdaptiveRateLimit = (name: string, baseConfig: RateLimitConfig) => {
  if (!adaptiveLimiters.has(name)) {
    adaptiveLimiters.set(name, new AdaptiveRateLimit(baseConfig));
  }
  return adaptiveLimiters.get(name)!;
};

// 自适应速率限制中间件
export const createAdaptiveRateLimitMiddleware = (name: string, baseConfig: RateLimitConfig) => {
  const adaptiveLimiter = getAdaptiveRateLimit(name, baseConfig);
  
  return async (req: NextRequest) => {
    const currentConfig = adaptiveLimiter.getCurrentConfig();
    const middleware = createRateLimitMiddleware(currentConfig);
    
    try {
      const result = await middleware(req);
      adaptiveLimiter.recordRequest(false);
      return result;
    } catch (error) {
      adaptiveLimiter.recordRequest(true);
      throw error;
    }
  };
};

export default {
  createRateLimitMiddleware,
  rateLimitMiddlewares,
  withRateLimit,
  rateLimit,
  AdaptiveRateLimit,
  getAdaptiveRateLimit,
  createAdaptiveRateLimitMiddleware
};
