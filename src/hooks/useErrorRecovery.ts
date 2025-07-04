/**
 * 错误恢复Hook
 * 提供自动错误恢复和重试机制
 */

import { useState, useCallback, useRef } from 'react';
import { ErrorType, ErrorSeverity, AppError, globalErrorHandler } from '@/lib/errorHandler';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onError?: (error: AppError) => void;
  onRecovery?: () => void;
}

interface ErrorRecoveryState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onError,
    onRecovery,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
    });
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const handleError = useCallback(async (error: Error | AppError, context?: string) => {
    // 转换为AppError
    const appError = await globalErrorHandler.handleError(error, context);
    
    // 更新状态
    setState(prev => ({
      error: appError,
      isRetrying: false,
      retryCount: prev.error?.message === appError.message ? prev.retryCount : 0,
      canRetry: appError.retryable && prev.retryCount < maxRetries,
    }));

    // 调用错误回调
    onError?.(appError);

    return appError;
  }, [maxRetries, onError]);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!state.canRetry || state.isRetrying) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // 计算延迟时间
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, state.retryCount)
        : retryDelay;

      // 等待延迟
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay);
      });

      // 执行操作
      const result = await operation();
      
      // 成功恢复
      clearError();
      onRecovery?.();
      
      return result;
    } catch (error) {
      // 重试失败
      const appError = await handleError(error as Error, 'retry');
      
      setState(prev => ({
        ...prev,
        isRetrying: false,
        canRetry: appError.retryable && prev.retryCount < maxRetries,
      }));

      throw appError;
    }
  }, [state.canRetry, state.isRetrying, state.retryCount, exponentialBackoff, retryDelay, maxRetries, clearError, handleError, onRecovery]);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    try {
      const result = await operation();
      
      // 如果之前有错误，现在成功了，清除错误
      if (state.error) {
        clearError();
        onRecovery?.();
      }
      
      return result;
    } catch (error) {
      await handleError(error as Error, context);
      throw error;
    }
  }, [state.error, clearError, handleError, onRecovery]);

  const autoRetry = useCallback(async (operation: () => Promise<any>, context?: string) => {
    let lastError: AppError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // 成功，清除错误
        if (lastError) {
          clearError();
          onRecovery?.();
        }
        
        return result;
      } catch (error) {
        lastError = await handleError(error as Error, context);
        
        // 如果不可重试或达到最大重试次数，抛出错误
        if (!lastError.retryable || attempt >= maxRetries) {
          throw lastError;
        }
        
        // 计算延迟时间
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, [maxRetries, exponentialBackoff, retryDelay, clearError, handleError, onRecovery]);

  return {
    // 状态
    error: state.error,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    canRetry: state.canRetry,
    
    // 方法
    handleError,
    retry,
    clearError,
    executeWithRecovery,
    autoRetry,
  };
}

// 专门用于网络请求的Hook
export function useNetworkErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
  });
}

// 专门用于钱包操作的Hook
export function useWalletErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 2,
    retryDelay: 1000,
    exponentialBackoff: false,
  });
}

// 专门用于区块链交易的Hook
export function useTransactionErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 1,
    retryDelay: 5000,
    exponentialBackoff: false,
  });
}
