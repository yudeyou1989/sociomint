/**
 * 错误处理Hook
 * 提供统一的错误处理和状态管理
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, errorHandler, ERROR_CODES } from '@/utils/errorHandler';

// 错误状态接口
interface ErrorState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime: number | null;
}

// Hook配置
interface UseErrorHandlerConfig {
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  onError?: (error: AppError) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: AppError) => void;
}

// 错误处理Hook
export const useErrorHandler = (config: UseErrorHandlerConfig = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = false,
    onError,
    onRetry,
    onMaxRetriesReached
  } = config;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryTime: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 处理错误
  const handleError = useCallback((error: any, context?: string) => {
    let appError: AppError;

    // 如果已经是AppError，直接使用
    if (error.code && error.userMessage) {
      appError = error;
    } else {
      // 根据错误类型创建AppError
      if (error.name === 'ValidationError' || error.type === 'validation') {
        appError = errorHandler.handleValidationError(error, context);
      } else if (error.code === 4001 || error.message?.includes('user rejected')) {
        appError = errorHandler.handleWeb3Error(error);
      } else if (error.name === 'NetworkError' || error.status) {
        appError = errorHandler.handleNetworkError(error);
      } else {
        appError = errorHandler.createError(ERROR_CODES.INTERNAL_ERROR, error, { context });
      }
    }

    setErrorState(prev => ({
      ...prev,
      error: appError,
      retryCount: 0,
      isRetrying: false
    }));

    onError?.(appError);

    // 自动重试（仅对可重试的错误）
    if (autoRetry && appError.retryable && maxRetries > 0) {
      scheduleRetry();
    }
  }, [autoRetry, maxRetries, onError]);

  // 安排重试
  const scheduleRetry = useCallback(() => {
    if (errorState.retryCount >= maxRetries) {
      onMaxRetriesReached?.(errorState.error!);
      return;
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));

    retryTimeoutRef.current = setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        lastRetryTime: Date.now(),
        isRetrying: false
      }));

      onRetry?.(errorState.retryCount + 1);
    }, retryDelay * Math.pow(2, errorState.retryCount)); // 指数退避
  }, [errorState.retryCount, errorState.error, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

  // 手动重试
  const retry = useCallback(() => {
    if (!errorState.error?.retryable) {
      return false;
    }

    if (errorState.retryCount >= maxRetries) {
      onMaxRetriesReached?.(errorState.error);
      return false;
    }

    scheduleRetry();
    return true;
  }, [errorState.error, errorState.retryCount, maxRetries, scheduleRetry, onMaxRetriesReached]);

  // 清除错误
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryTime: null
    });
  }, []);

  // 包装异步函数
  const wrapAsync = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
  ): T => {
    return (async (...args: any[]) => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        handleError(error, context);
        throw error;
      }
    }) as T;
  }, [handleError, clearError]);

  // 包装同步函数
  const wrapSync = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): T => {
    return ((...args: any[]) => {
      try {
        clearError();
        return fn(...args);
      } catch (error) {
        handleError(error, context);
        throw error;
      }
    }) as T;
  }, [handleError, clearError]);

  return {
    // 状态
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    canRetry: errorState.error?.retryable && errorState.retryCount < maxRetries,
    hasError: !!errorState.error,

    // 方法
    handleError,
    retry,
    clearError,
    wrapAsync,
    wrapSync,

    // 便捷方法
    isNetworkError: errorState.error?.category === 'network',
    isValidationError: errorState.error?.category === 'validation',
    isAuthError: errorState.error?.category === 'auth',
    isContractError: errorState.error?.category === 'contract',
    isSystemError: errorState.error?.category === 'system',
    isUserError: errorState.error?.category === 'user',

    isCritical: errorState.error?.severity === 'critical',
    isHigh: errorState.error?.severity === 'high',
    isMedium: errorState.error?.severity === 'medium',
    isLow: errorState.error?.severity === 'low'
  };
};

// 全局错误状态Hook
export const useGlobalErrorHandler = () => {
  const [errors, setErrors] = useState<AppError[]>([]);

  // 添加错误
  const addError = useCallback((error: AppError) => {
    setErrors(prev => [error, ...prev.slice(0, 9)]); // 最多保留10个错误
  }, []);

  // 移除错误
  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => 
      `${error.code}-${error.timestamp}` !== errorId
    ));
  }, []);

  // 清除所有错误
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 获取错误ID
  const getErrorId = useCallback((error: AppError) => {
    return `${error.code}-${error.timestamp}`;
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
    getErrorId,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  };
};

// 表单错误处理Hook
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 设置字段错误
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  // 清除字段错误
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // 清除所有错误
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // 处理验证错误
  const handleValidationError = useCallback((error: any) => {
    if (error.details && Array.isArray(error.details)) {
      // 处理joi验证错误
      const newErrors: Record<string, string> = {};
      error.details.forEach((detail: any) => {
        const field = detail.path.join('.');
        newErrors[field] = detail.message;
      });
      setFieldErrors(newErrors);
    } else if (error.errors && typeof error.errors === 'object') {
      // 处理其他验证错误格式
      setFieldErrors(error.errors);
    } else if (error.field && error.message) {
      // 处理单个字段错误
      setFieldError(error.field, error.message);
    }
  }, [setFieldError]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleValidationError,
    hasFieldErrors: Object.keys(fieldErrors).length > 0,
    getFieldError: (field: string) => fieldErrors[field],
    hasFieldError: (field: string) => !!fieldErrors[field]
  };
};

// 异步操作错误处理Hook
export const useAsyncErrorHandler = () => {
  const [loading, setLoading] = useState(false);
  const { handleError, error, clearError, retry, canRetry } = useErrorHandler();

  // 执行异步操作
  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      const result = await asyncFn();
      return result;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  // 带重试的执行
  const executeWithRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    maxRetries = 3
  ): Promise<T | null> => {
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        setLoading(true);
        if (i === 0) clearError();
        
        const result = await asyncFn();
        return result;
      } catch (err) {
        lastError = err;
        
        if (i === maxRetries) {
          handleError(err, context);
          return null;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } finally {
        if (i === maxRetries) {
          setLoading(false);
        }
      }
    }
    
    return null;
  }, [handleError, clearError]);

  return {
    loading,
    error,
    execute,
    executeWithRetry,
    retry,
    canRetry,
    clearError,
    hasError: !!error
  };
};

export default {
  useErrorHandler,
  useGlobalErrorHandler,
  useFormErrorHandler,
  useAsyncErrorHandler
};
