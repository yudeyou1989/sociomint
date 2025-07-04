/**
 * 错误处理系统
 * 提供统一的错误处理、分类、恢复机制
 */

import { getMonitoringService } from './monitoring';

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BLOCKCHAIN = 'BLOCKCHAIN',
  CONTRACT = 'CONTRACT',
  WALLET = 'WALLET',
  DATABASE = 'DATABASE',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// 应用错误接口
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
  userMessage: string;
  originalError?: Error;
}

// 错误恢复策略
export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
  maxRetries: number;
  retryDelay: number;
}

// 错误处理器类
export class ErrorHandler {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private retryAttempts = new Map<string, number>();

  constructor() {
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies(): void {
    // 网络错误恢复策略
    this.addRecoveryStrategy({
      canRecover: (error) => error.type === ErrorType.NETWORK && error.retryable,
      recover: async (error) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Retrying network request...');
      },
      maxRetries: 3,
      retryDelay: 2000,
    });

    // 钱包连接错误恢复策略
    this.addRecoveryStrategy({
      canRecover: (error) => error.type === ErrorType.WALLET && error.code === 'CONNECTION_FAILED',
      recover: async (error) => {
        console.log('Attempting to reconnect wallet...');
        // 这里可以触发钱包重连逻辑
      },
      maxRetries: 2,
      retryDelay: 1000,
    });

    // 区块链交易失败恢复策略
    this.addRecoveryStrategy({
      canRecover: (error) => error.type === ErrorType.BLOCKCHAIN && error.code === 'TRANSACTION_FAILED',
      recover: async (error) => {
        console.log('Suggesting transaction retry with higher gas...');
        // 这里可以建议用户增加gas费重试
      },
      maxRetries: 1,
      retryDelay: 5000,
    });
  }

  /**
   * 添加恢复策略
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * 处理错误
   */
  async handleError(error: Error | AppError, context?: string): Promise<AppError> {
    let appError: AppError;

    // 如果已经是AppError，直接使用
    if (this.isAppError(error)) {
      appError = error;
    } else {
      // 转换为AppError
      appError = this.convertToAppError(error, context);
    }

    // 记录错误
    this.logError(appError, context);

    // 报告到监控系统
    this.reportError(appError);

    // 尝试恢复
    await this.attemptRecovery(appError);

    return appError;
  }

  /**
   * 转换为应用错误
   */
  private convertToAppError(error: Error, context?: string): AppError {
    const message = error.message || 'Unknown error occurred';
    
    // 根据错误信息判断类型
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let retryable = false;
    let userMessage = '操作失败，请重试';

    // 网络错误
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      type = ErrorType.NETWORK;
      retryable = true;
      userMessage = '网络连接失败，请检查网络后重试';
    }
    // 钱包错误
    else if (message.includes('wallet') || message.includes('MetaMask') || message.includes('ethereum')) {
      type = ErrorType.WALLET;
      severity = ErrorSeverity.HIGH;
      userMessage = '钱包连接失败，请检查钱包状态';
    }
    // 区块链错误
    else if (message.includes('transaction') || message.includes('gas') || message.includes('revert')) {
      type = ErrorType.BLOCKCHAIN;
      severity = ErrorSeverity.HIGH;
      userMessage = '区块链交易失败，请检查交易参数';
    }
    // 验证错误
    else if (message.includes('validation') || message.includes('invalid')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = '输入数据无效，请检查后重试';
    }
    // 认证错误
    else if (message.includes('unauthorized') || message.includes('authentication')) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      userMessage = '身份验证失败，请重新登录';
    }
    // 权限错误
    else if (message.includes('forbidden') || message.includes('permission')) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.HIGH;
      userMessage = '权限不足，无法执行此操作';
    }
    // 速率限制错误
    else if (message.includes('rate limit') || message.includes('too many requests')) {
      type = ErrorType.RATE_LIMIT;
      retryable = true;
      userMessage = '请求过于频繁，请稍后重试';
    }

    return {
      type,
      severity,
      message,
      timestamp: Date.now(),
      retryable,
      userMessage,
      originalError: error,
    };
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(error: AppError): Promise<void> {
    const errorKey = `${error.type}-${error.code || error.message}`;
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;

    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error) && currentAttempts < strategy.maxRetries) {
        try {
          this.retryAttempts.set(errorKey, currentAttempts + 1);
          
          console.log(`Attempting recovery for error: ${error.message} (attempt ${currentAttempts + 1})`);
          
          await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));
          await strategy.recover(error);
          
          // 恢复成功，清除重试计数
          this.retryAttempts.delete(errorKey);
          return;
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }

    // 如果所有恢复策略都失败，清除重试计数
    this.retryAttempts.delete(errorKey);
  }

  /**
   * 记录错误
   */
  private logError(error: AppError, context?: string): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    const logData = {
      error,
      context,
      timestamp: new Date().toISOString(),
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  /**
   * 报告错误到监控系统
   */
  private reportError(error: AppError): void {
    const monitoring = getMonitoringService();
    if (monitoring) {
      monitoring.reportError({
        message: error.message,
        stack: error.originalError?.stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: error.timestamp,
        sessionId: monitoring['sessionId'],
      });
    }
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  /**
   * 检查是否为AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * 创建特定类型的错误
   */
  static createError(
    type: ErrorType,
    message: string,
    options: Partial<Omit<AppError, 'type' | 'message' | 'timestamp'>> = {}
  ): AppError {
    return {
      type,
      message,
      severity: ErrorSeverity.MEDIUM,
      timestamp: Date.now(),
      retryable: false,
      userMessage: message,
      ...options,
    };
  }

  /**
   * 网络错误创建器
   */
  static createNetworkError(message: string, retryable = true): AppError {
    return this.createError(ErrorType.NETWORK, message, {
      severity: ErrorSeverity.MEDIUM,
      retryable,
      userMessage: '网络连接失败，请检查网络后重试',
    });
  }

  /**
   * 钱包错误创建器
   */
  static createWalletError(message: string, code?: string): AppError {
    return this.createError(ErrorType.WALLET, message, {
      severity: ErrorSeverity.HIGH,
      code,
      userMessage: '钱包操作失败，请检查钱包状态',
    });
  }

  /**
   * 区块链错误创建器
   */
  static createBlockchainError(message: string, code?: string): AppError {
    return this.createError(ErrorType.BLOCKCHAIN, message, {
      severity: ErrorSeverity.HIGH,
      code,
      userMessage: '区块链交易失败，请检查交易参数',
    });
  }

  /**
   * 验证错误创建器
   */
  static createValidationError(message: string, details?: any): AppError {
    return this.createError(ErrorType.VALIDATION, message, {
      severity: ErrorSeverity.LOW,
      details,
      userMessage: '输入数据无效，请检查后重试',
    });
  }
}

// 全局错误处理器实例
export const globalErrorHandler = new ErrorHandler();

// 便捷函数
export const handleError = (error: Error | AppError, context?: string) => 
  globalErrorHandler.handleError(error, context);

export const createNetworkError = ErrorHandler.createNetworkError;
export const createWalletError = ErrorHandler.createWalletError;
export const createBlockchainError = ErrorHandler.createBlockchainError;
export const createValidationError = ErrorHandler.createValidationError;
