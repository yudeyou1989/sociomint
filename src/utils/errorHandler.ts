/**
 * 错误处理工具
 * 提供统一的错误处理、日志记录和用户友好的错误信息
 */

// 错误类型定义
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  stack?: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'auth' | 'contract' | 'system' | 'user';
  retryable: boolean;
  metadata?: Record<string, any>;
}

// 错误代码映射
export const ERROR_CODES = {
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  
  // 钱包错误
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_CONNECTION_REJECTED: 'WALLET_CONNECTION_REJECTED',
  WALLET_NETWORK_MISMATCH: 'WALLET_NETWORK_MISMATCH',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // 合约错误
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 用户错误
  USER_CANCELLED: 'USER_CANCELLED',
  INVALID_OPERATION: 'INVALID_OPERATION'
} as const;

// 错误信息映射
const ERROR_MESSAGES: Record<string, { message: string; userMessage: string; severity: AppError['severity']; category: AppError['category']; retryable: boolean }> = {
  [ERROR_CODES.NETWORK_ERROR]: {
    message: 'Network request failed',
    userMessage: '网络连接失败，请检查网络连接后重试',
    severity: 'medium',
    category: 'network',
    retryable: true
  },
  [ERROR_CODES.TIMEOUT_ERROR]: {
    message: 'Request timeout',
    userMessage: '请求超时，请稍后重试',
    severity: 'medium',
    category: 'network',
    retryable: true
  },
  [ERROR_CODES.CONNECTION_FAILED]: {
    message: 'Connection failed',
    userMessage: '连接失败，请检查网络设置',
    severity: 'high',
    category: 'network',
    retryable: true
  },
  [ERROR_CODES.WALLET_NOT_FOUND]: {
    message: 'Wallet not found',
    userMessage: '未检测到钱包，请安装MetaMask或其他支持的钱包',
    severity: 'high',
    category: 'auth',
    retryable: false
  },
  [ERROR_CODES.WALLET_CONNECTION_REJECTED]: {
    message: 'User rejected wallet connection',
    userMessage: '用户拒绝连接钱包',
    severity: 'low',
    category: 'user',
    retryable: true
  },
  [ERROR_CODES.WALLET_NETWORK_MISMATCH]: {
    message: 'Wrong network',
    userMessage: '请切换到BSC网络',
    severity: 'medium',
    category: 'auth',
    retryable: true
  },
  [ERROR_CODES.INSUFFICIENT_BALANCE]: {
    message: 'Insufficient balance',
    userMessage: '余额不足，请检查账户余额',
    severity: 'medium',
    category: 'validation',
    retryable: false
  },
  [ERROR_CODES.CONTRACT_CALL_FAILED]: {
    message: 'Smart contract call failed',
    userMessage: '合约调用失败，请稍后重试',
    severity: 'high',
    category: 'contract',
    retryable: true
  },
  [ERROR_CODES.TRANSACTION_FAILED]: {
    message: 'Transaction failed',
    userMessage: '交易失败，请检查gas费用和网络状态',
    severity: 'high',
    category: 'contract',
    retryable: true
  },
  [ERROR_CODES.GAS_ESTIMATION_FAILED]: {
    message: 'Gas estimation failed',
    userMessage: 'Gas费用估算失败，请稍后重试',
    severity: 'medium',
    category: 'contract',
    retryable: true
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    message: 'Validation error',
    userMessage: '输入验证失败，请检查输入内容',
    severity: 'low',
    category: 'validation',
    retryable: false
  },
  [ERROR_CODES.INVALID_INPUT]: {
    message: 'Invalid input',
    userMessage: '输入内容无效，请重新输入',
    severity: 'low',
    category: 'validation',
    retryable: false
  },
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: {
    message: 'Required field missing',
    userMessage: '请填写所有必填字段',
    severity: 'low',
    category: 'validation',
    retryable: false
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    message: 'Unauthorized access',
    userMessage: '未授权访问，请重新登录',
    severity: 'high',
    category: 'auth',
    retryable: false
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    message: 'Token expired',
    userMessage: '登录已过期，请重新登录',
    severity: 'medium',
    category: 'auth',
    retryable: false
  },
  [ERROR_CODES.PERMISSION_DENIED]: {
    message: 'Permission denied',
    userMessage: '权限不足，无法执行此操作',
    severity: 'medium',
    category: 'auth',
    retryable: false
  },
  [ERROR_CODES.INTERNAL_ERROR]: {
    message: 'Internal server error',
    userMessage: '系统内部错误，请稍后重试',
    severity: 'critical',
    category: 'system',
    retryable: true
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    message: 'Service unavailable',
    userMessage: '服务暂时不可用，请稍后重试',
    severity: 'high',
    category: 'system',
    retryable: true
  },
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded',
    userMessage: '请求过于频繁，请稍后重试',
    severity: 'medium',
    category: 'system',
    retryable: true
  },
  [ERROR_CODES.USER_CANCELLED]: {
    message: 'User cancelled operation',
    userMessage: '操作已取消',
    severity: 'low',
    category: 'user',
    retryable: true
  },
  [ERROR_CODES.INVALID_OPERATION]: {
    message: 'Invalid operation',
    userMessage: '无效操作，请检查操作条件',
    severity: 'medium',
    category: 'user',
    retryable: false
  }
};

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 创建标准化错误
  createError(
    code: string,
    originalError?: Error | any,
    metadata?: Record<string, any>
  ): AppError {
    const errorInfo = ERROR_MESSAGES[code] || {
      message: 'Unknown error',
      userMessage: '发生未知错误，请稍后重试',
      severity: 'medium' as const,
      category: 'system' as const,
      retryable: true
    };

    const appError: AppError = {
      code,
      message: originalError?.message || errorInfo.message,
      details: originalError,
      timestamp: Date.now(),
      stack: originalError?.stack,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      category: errorInfo.category,
      retryable: errorInfo.retryable,
      metadata
    };

    this.logError(appError);
    return appError;
  }

  // 处理Web3错误
  handleWeb3Error(error: any): AppError {
    if (error.code === 4001) {
      return this.createError(ERROR_CODES.WALLET_CONNECTION_REJECTED, error);
    }
    
    if (error.code === -32603) {
      return this.createError(ERROR_CODES.CONTRACT_CALL_FAILED, error);
    }
    
    if (error.message?.includes('insufficient funds')) {
      return this.createError(ERROR_CODES.INSUFFICIENT_BALANCE, error);
    }
    
    if (error.message?.includes('gas')) {
      return this.createError(ERROR_CODES.GAS_ESTIMATION_FAILED, error);
    }
    
    if (error.message?.includes('network')) {
      return this.createError(ERROR_CODES.WALLET_NETWORK_MISMATCH, error);
    }

    return this.createError(ERROR_CODES.CONTRACT_CALL_FAILED, error);
  }

  // 处理网络错误
  handleNetworkError(error: any): AppError {
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return this.createError(ERROR_CODES.TIMEOUT_ERROR, error);
    }
    
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return this.createError(ERROR_CODES.CONNECTION_FAILED, error);
    }
    
    if (error.status === 429) {
      return this.createError(ERROR_CODES.RATE_LIMIT_EXCEEDED, error);
    }
    
    if (error.status === 401) {
      return this.createError(ERROR_CODES.UNAUTHORIZED, error);
    }
    
    if (error.status === 403) {
      return this.createError(ERROR_CODES.PERMISSION_DENIED, error);
    }
    
    if (error.status >= 500) {
      return this.createError(ERROR_CODES.SERVICE_UNAVAILABLE, error);
    }

    return this.createError(ERROR_CODES.NETWORK_ERROR, error);
  }

  // 处理验证错误
  handleValidationError(error: any, field?: string): AppError {
    const metadata = field ? { field } : undefined;
    
    if (error.message?.includes('required')) {
      return this.createError(ERROR_CODES.REQUIRED_FIELD_MISSING, error, metadata);
    }
    
    if (error.message?.includes('invalid')) {
      return this.createError(ERROR_CODES.INVALID_INPUT, error, metadata);
    }

    return this.createError(ERROR_CODES.VALIDATION_ERROR, error, metadata);
  }

  // 记录错误
  private logError(error: AppError) {
    this.errorLog.unshift(error);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 控制台输出
    if (error.severity === 'critical' || error.severity === 'high') {
      console.error('AppError:', error);
    } else {
      console.warn('AppError:', error);
    }

    // 发送到监控服务（如果配置了）
    this.sendToMonitoring(error);
  }

  // 发送到监控服务
  private sendToMonitoring(error: AppError) {
    // 这里可以集成Sentry、LogRocket等监控服务
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(error.message), {
        tags: {
          errorCode: error.code,
          severity: error.severity,
          category: error.category
        },
        extra: {
          details: error.details,
          metadata: error.metadata
        }
      });
    }
  }

  // 获取错误日志
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  // 清除错误日志
  clearErrorLog() {
    this.errorLog = [];
  }

  // 获取错误统计
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byCategory: {
        network: 0,
        validation: 0,
        auth: 0,
        contract: 0,
        system: 0,
        user: 0
      },
      retryable: 0,
      recent: this.errorLog.slice(0, 10)
    };

    this.errorLog.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
      if (error.retryable) stats.retryable++;
    });

    return stats;
  }
}

// 错误边界组件的错误处理
export const handleComponentError = (error: Error, errorInfo: any) => {
  const handler = ErrorHandler.getInstance();
  const appError = handler.createError(
    ERROR_CODES.INTERNAL_ERROR,
    error,
    { componentStack: errorInfo.componentStack }
  );
  
  return appError;
};

// 异步操作错误处理装饰器
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: any) => AppError
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handler = ErrorHandler.getInstance();
      const appError = errorHandler 
        ? errorHandler(error)
        : handler.createError(ERROR_CODES.INTERNAL_ERROR, error);
      
      throw appError;
    }
  }) as T;
};

// 重试机制
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  backoff = 2
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 如果是不可重试的错误，直接抛出
      if (error.retryable === false) {
        throw error;
      }
      
      // 如果已经是最后一次尝试，抛出错误
      if (i === maxRetries) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, i)));
    }
  }
  
  throw lastError;
};

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷函数
export const createError = (code: string, originalError?: Error | any, metadata?: Record<string, any>) => {
  return errorHandler.createError(code, originalError, metadata);
};

export const handleWeb3Error = (error: any) => {
  return errorHandler.handleWeb3Error(error);
};

export const handleNetworkError = (error: any) => {
  return errorHandler.handleNetworkError(error);
};

export const handleValidationError = (error: any, field?: string) => {
  return errorHandler.handleValidationError(error, field);
};

export default {
  ErrorHandler,
  ERROR_CODES,
  errorHandler,
  createError,
  handleWeb3Error,
  handleNetworkError,
  handleValidationError,
  handleComponentError,
  withErrorHandling,
  withRetry
};
