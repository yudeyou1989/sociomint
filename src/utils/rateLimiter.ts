/**
 * API速率限制工具
 * 提供客户端和服务端的速率限制功能
 */

// 速率限制配置
export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyGenerator?: (req?: any) => string; // 键生成器
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean; // 跳过失败请求
  onLimitReached?: (key: string) => void; // 达到限制时的回调
}

// 请求记录
interface RequestRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// 内存存储的速率限制器
class MemoryRateLimiter {
  private store = new Map<string, RequestRecord>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // 定期清理过期记录
    setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  // 检查是否超过限制
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now >= record.resetTime) {
      // 创建新记录或重置过期记录
      const newRecord: RequestRecord = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      };
      this.store.set(key, newRecord);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newRecord.resetTime
      };
    }

    // 检查是否超过限制
    if (record.count >= this.config.maxRequests) {
      if (this.config.onLimitReached) {
        this.config.onLimitReached(key);
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    // 增加计数
    record.count++;
    this.store.set(key, record);

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  // 清理过期记录
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  // 重置特定键的限制
  reset(key: string) {
    this.store.delete(key);
  }

  // 获取当前状态
  getStatus(key: string) {
    const record = this.store.get(key);
    if (!record) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime
    };
  }
}

// 预定义的速率限制配置
export const RATE_LIMIT_CONFIGS = {
  // 严格限制（登录、注册等敏感操作）
  strict: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5
  },
  
  // 中等限制（API调用）
  moderate: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 30
  },
  
  // 宽松限制（一般请求）
  lenient: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100
  },
  
  // 钱包连接限制
  walletConnect: {
    windowMs: 5 * 60 * 1000, // 5分钟
    maxRequests: 10
  },
  
  // 交易提交限制
  transaction: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5
  },
  
  // 社交任务提交限制
  socialTask: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 3
  }
};

// 全局速率限制器实例
const rateLimiters = new Map<string, MemoryRateLimiter>();

// 获取或创建速率限制器
export const getRateLimiter = (name: string, config: RateLimitConfig): MemoryRateLimiter => {
  if (!rateLimiters.has(name)) {
    rateLimiters.set(name, new MemoryRateLimiter(config));
  }
  return rateLimiters.get(name)!;
};

// 客户端速率限制Hook
export const useRateLimit = (
  name: string, 
  config: RateLimitConfig,
  keyGenerator: () => string = () => 'default'
) => {
  const limiter = getRateLimiter(name, config);

  const checkLimit = () => {
    const key = keyGenerator();
    return limiter.check(key);
  };

  const getStatus = () => {
    const key = keyGenerator();
    return limiter.getStatus(key);
  };

  const reset = () => {
    const key = keyGenerator();
    limiter.reset(key);
  };

  return {
    checkLimit,
    getStatus,
    reset
  };
};

// API请求包装器，自动应用速率限制
export const withRateLimit = async <T>(
  requestFn: () => Promise<T>,
  limitName: string,
  config: RateLimitConfig,
  key: string = 'default'
): Promise<T> => {
  const limiter = getRateLimiter(limitName, config);
  const result = limiter.check(key);

  if (!result.allowed) {
    const waitTime = result.resetTime - Date.now();
    throw new Error(`请求过于频繁，请在 ${Math.ceil(waitTime / 1000)} 秒后重试`);
  }

  try {
    return await requestFn();
  } catch (error) {
    // 如果配置了跳过失败请求，则减少计数
    if (config.skipFailedRequests) {
      const record = (limiter as any).store.get(key);
      if (record) {
        record.count = Math.max(0, record.count - 1);
        (limiter as any).store.set(key, record);
      }
    }
    throw error;
  }
};

// 中间件函数（用于API路由）
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  const limiter = new MemoryRateLimiter(config);

  return (req: any, res: any, next?: () => void) => {
    // 生成键（可以基于IP、用户ID等）
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : req.ip || req.connection?.remoteAddress || 'unknown';

    const result = limiter.check(key);

    // 设置响应头
    if (res.setHeader) {
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    }

    if (!result.allowed) {
      const error = {
        error: 'Too Many Requests',
        message: '请求过于频繁，请稍后重试',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      };

      if (res.status) {
        return res.status(429).json(error);
      } else {
        throw new Error(error.message);
      }
    }

    if (next) {
      next();
    }
    return true;
  };
};

// 分布式速率限制器（使用Redis等外部存储）
export class DistributedRateLimiter {
  private storage: any; // Redis客户端或其他存储

  constructor(storage: any) {
    this.storage = storage;
  }

  async check(key: string, config: RateLimitConfig) {
    const now = Date.now();
    const windowKey = `rate_limit:${key}:${Math.floor(now / config.windowMs)}`;

    try {
      // 获取当前窗口的请求计数
      const count = await this.storage.incr(windowKey);
      
      // 设置过期时间
      if (count === 1) {
        await this.storage.expire(windowKey, Math.ceil(config.windowMs / 1000));
      }

      const allowed = count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count);
      const resetTime = Math.ceil(now / config.windowMs) * config.windowMs + config.windowMs;

      return {
        allowed,
        remaining,
        resetTime,
        count
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // 出错时允许请求通过
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        count: 0
      };
    }
  }
}

// 导出常用的速率限制器
export const commonRateLimiters = {
  // 钱包连接限制器
  walletConnect: getRateLimiter('walletConnect', RATE_LIMIT_CONFIGS.walletConnect),
  
  // 交易限制器
  transaction: getRateLimiter('transaction', RATE_LIMIT_CONFIGS.transaction),
  
  // 社交任务限制器
  socialTask: getRateLimiter('socialTask', RATE_LIMIT_CONFIGS.socialTask),
  
  // API调用限制器
  apiCall: getRateLimiter('apiCall', RATE_LIMIT_CONFIGS.moderate)
};

export default {
  MemoryRateLimiter,
  DistributedRateLimiter,
  getRateLimiter,
  useRateLimit,
  withRateLimit,
  rateLimitMiddleware,
  commonRateLimiters,
  RATE_LIMIT_CONFIGS
};
