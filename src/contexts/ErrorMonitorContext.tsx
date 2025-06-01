"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalState } from './GlobalStateContext';

// 错误日志接口
interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  componentName?: string;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
  networkInfo?: {
    url?: string;
    method?: string;
    status?: number;
    response?: string;
  };
  handled: boolean;
  source: 'javascript' | 'api' | 'react' | 'promise' | 'custom';
  breadcrumbs: Breadcrumb[];
}

// 用户操作记录
interface Breadcrumb {
  type: 'navigation' | 'ui' | 'network' | 'log' | 'error';
  timestamp: number;
  message: string;
  data?: Record<string, any>;
}

// 完整的错误监控上下文类型
interface ErrorMonitorContextType {
  errors: ErrorLog[];
  breadcrumbs: Breadcrumb[];
  captureError: (error: Error | string, options?: CaptureErrorOptions) => string;
  captureApiError: (endpoint: string, statusCode: number, response: any, method?: string) => string;
  captureMessage: (message: string, severity?: 'info' | 'warning' | 'error' | 'critical') => string;
  clearErrors: () => void;
  reportError: (errorId: string) => Promise<void>;
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  clearBreadcrumbs: () => void;
  hasUnhandledErrors: boolean;
  errorCount: {
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}

// 捕获错误的选项
interface CaptureErrorOptions {
  componentName?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  handled?: boolean;
  source?: 'javascript' | 'api' | 'react' | 'promise' | 'custom';
  silent?: boolean; // 是否不显示UI提示
}

// 创建上下文
const ErrorMonitorContext = createContext<ErrorMonitorContextType | undefined>(undefined);

// Hook用于组件中访问错误监控
export const useErrorMonitor = () => {
  const context = useContext(ErrorMonitorContext);
  if (!context) {
    throw new Error('useErrorMonitor must be used within an ErrorMonitorProvider');
  }
  return context;
};

// 获取用户ID的辅助函数
const getUserId = (): string | undefined => {
  try {
    if (typeof window !== 'undefined') {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.id;
      }
    }
  } catch (e) {
    console.warn('Failed to get user ID from localStorage');
  }
  return undefined;
};

// 错误监控提供者组件
interface Props {
  children: ReactNode;
  maxErrors?: number; // 最大存储错误数
  reportEndpoint?: string; // 报告错误的端点
  debug?: boolean; // 是否显示调试信息
  captureUnhandled?: boolean; // 是否捕获未处理的错误
  captureBreadcrumbs?: boolean; // 是否捕获用户操作
  maxBreadcrumbs?: number; // 最大存储的用户操作数
}

export const ErrorMonitorProvider: React.FC<Props> = ({ 
  children,
  maxErrors = 50,
  reportEndpoint = '/api/error-report',
  debug = false,
  captureUnhandled = true,
  captureBreadcrumbs = true,
  maxBreadcrumbs = 50
}) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  
  // 从GlobalState获取添加通知的功能
  const { dispatch } = useGlobalState();
  
  // 统计错误计数
  const errorCount = useMemo(() => {
    return {
      total: errors.length,
      critical: errors.filter(e => e.severity === 'critical').length,
      error: errors.filter(e => e.severity === 'error').length,
      warning: errors.filter(e => e.severity === 'warning').length,
      info: errors.filter(e => e.severity === 'info').length,
    };
  }, [errors]);
  
  // 检查是否有未处理的错误
  const hasUnhandledErrors = useMemo(() => {
    return errors.some(error => !error.handled);
  }, [errors]);
  
  // 生成唯一ID
  const generateId = () => {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // 添加用户操作记录
  const addBreadcrumb = useCallback((breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    if (!captureBreadcrumbs) return;
    
    const newBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now()
    };
    
    setBreadcrumbs(prev => {
      const updated = [newBreadcrumb, ...prev];
      if (updated.length > maxBreadcrumbs) {
        return updated.slice(0, maxBreadcrumbs);
      }
      return updated;
    });
    
    if (debug) {
      console.log(`[Error Monitor] Breadcrumb: ${breadcrumb.type} - ${breadcrumb.message}`);
    }
  }, [captureBreadcrumbs, debug, maxBreadcrumbs]);
  
  // 清除所有用户操作记录
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);
  
  // 记录错误
  const logError = useCallback((
    newError: Omit<ErrorLog, 'id' | 'timestamp' | 'breadcrumbs'>
  ): string => {
    const errorId = generateId();
    
    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      breadcrumbs: breadcrumbs.slice(),
      ...newError
    };
    
    // 将错误添加到状态
    setErrors(prev => {
      const updated = [errorLog, ...prev];
      if (updated.length > maxErrors) {
        return updated.slice(0, maxErrors);
      }
      return updated;
    });
    
    // 记录到控制台
    if (debug || newError.severity === 'critical' || newError.severity === 'error') {
      console.error(
        `[Error Monitor] ${newError.severity.toUpperCase()} - ${newError.componentName || 'Unknown'}: ${newError.message}`,
        newError.metadata || {}
      );
    }
    
    return errorId;
  }, [breadcrumbs, debug, maxErrors]);
  
  // 捕获错误消息
  const captureMessage = useCallback((
    message: string, 
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): string => {
    const errorId = logError({
      message,
      severity,
      handled: true,
      source: 'custom',
      userId: getUserId()
    });
    
    // 根据严重程度决定是否显示通知
    if (severity === 'error' || severity === 'critical') {
      toast.error(message);
    } else if (severity === 'warning') {
      // 由于react-hot-toast没有内置warning方法，使用自定义图标
      toast(message, { icon: '⚠️' });
    } else {
      toast(message);
    }
    
    // 添加到全局状态的通知系统
    if (dispatch) {
      try {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: severity === 'info' ? 'info' : severity === 'warning' ? 'warning' : 'error',
            message,
            autoClose: severity === 'info' || severity === 'warning'
          }
        });
      } catch (e) {
        console.error('Failed to dispatch notification:', e);
      }
    }
    
    return errorId;
  }, [logError, dispatch]);
  
  // 捕获API错误
  const captureApiError = useCallback((
    endpoint: string,
    statusCode: number,
    response: any,
    method: string = 'GET'
  ): string => {
    // 确定严重程度
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'error';
    if (statusCode >= 500) severity = 'critical';
    else if (statusCode >= 400) severity = 'error';
    else if (statusCode >= 300) severity = 'warning';
    
    const errorId = logError({
      message: `API ${method} 请求错误: ${endpoint} (${statusCode})`,
      severity,
      handled: true,
      source: 'api',
      userId: getUserId(),
      networkInfo: {
        url: endpoint,
        method,
        status: statusCode,
        response: typeof response === 'string' ? response : JSON.stringify(response),
      }
    });
    
    // 只对客户端错误显示消息
    if (statusCode >= 400 && statusCode < 500) {
      toast.error(`请求错误: ${typeof response === 'string' ? response : JSON.stringify(response)}`);
    } else if (statusCode >= 500) {
      toast.error('服务器错误，请稍后再试');
    }
    
    return errorId;
  }, [logError]);
  
  // 捕获一般错误
  const captureError = useCallback((
    error: Error | string,
    options: CaptureErrorOptions = {}
  ): string => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    const {
      componentName,
      metadata,
      severity = 'error',
      handled = false,
      source = 'javascript',
      silent = false
    } = options;
    
    // 获取当前用户ID
    const userId = getUserId();
    
    const errorId = logError({
      message: errorMessage,
      stack: errorStack,
      componentName,
      metadata,
      severity,
      handled,
      source,
      userId
    });
    
    // 在UI上显示错误通知，除非设置了silent
    if (!silent) {
      if (severity === 'critical' || severity === 'error') {
        toast.error(componentName ? `${componentName}: ${errorMessage}` : errorMessage);
      } else if (severity === 'warning') {
        // 使用自定义图标显示警告
        toast(errorMessage, { icon: '⚠️' });
      } else {
        toast(errorMessage);
      }
      
      // 添加到全局状态的通知系统
      if (dispatch) {
        try {
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
              type: severity === 'info' ? 'info' : severity === 'warning' ? 'warning' : 'error',
              message: errorMessage,
              autoClose: severity === 'info' || severity === 'warning'
            }
          });
        } catch (e) {
          console.error('Failed to dispatch notification:', e);
        }
      }
    }
    
    return errorId;
  }, [logError, dispatch]);
  
  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  // 将错误报告到后端
  const reportError = useCallback(async (errorId: string): Promise<void> => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    
    try {
      // 添加用户操作
      addBreadcrumb({
        type: 'log',
        message: `Reporting error: ${error.message}`,
        data: { errorId }
      });
      
      // 发送到API端点
      const response = await fetch(reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
      
      if (!response.ok) {
        throw new Error('Failed to report error');
      }
      
      // 标记错误为已处理
      setErrors(prevErrors => 
        prevErrors.map(e => 
          e.id === errorId ? { ...e, handled: true } : e
        )
      );
      
      toast.success('错误已报告，感谢您的反馈');
    } catch (e) {
      console.error('Failed to send error report:', e);
      captureError(e instanceof Error ? e : String(e), {
        componentName: 'ErrorReporter',
        severity: 'warning',
        source: 'api'
      });
      toast.error('无法发送错误报告');
    }
  }, [errors, addBreadcrumb, reportEndpoint, captureError]);
  
  // 全局错误处理
  useEffect(() => {
    if (!captureUnhandled) return;
    
    // 定义所有处理函数
    const handleGlobalError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), {
        componentName: 'Window',
        source: 'javascript',
        handled: false
      });
      
      // 阻止默认处理
      event.preventDefault();
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      captureError(error, {
        componentName: 'Promise',
        source: 'promise',
        handled: false
      });
    };
    
    const handleNetworkError = () => {
      captureMessage('网络连接已断开', 'warning');
    };
    
    const handleNetworkRecovery = () => {
      captureMessage('网络连接已恢复', 'info');
    };
    
    const recordNavigation = () => {
      addBreadcrumb({
        type: 'navigation',
        message: `Navigated to: ${window.location.pathname}${window.location.search}`
      });
    };
    
    // 添加全局错误监听器
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('offline', handleNetworkError);
    window.addEventListener('online', handleNetworkRecovery);
    
    // 添加导航监听
    if (captureBreadcrumbs && typeof window !== 'undefined') {
      // 记录初始导航
      recordNavigation();
      
      // 监听路由变化
      window.addEventListener('popstate', recordNavigation);
    }
    
    // 清理函数
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('offline', handleNetworkError);
      window.removeEventListener('online', handleNetworkRecovery);
      
      if (captureBreadcrumbs && typeof window !== 'undefined') {
        window.removeEventListener('popstate', recordNavigation);
      }
    };
  }, [captureUnhandled, captureError, captureBreadcrumbs, addBreadcrumb, captureMessage]);
  
  // 提供上下文值
  const contextValue = useMemo<ErrorMonitorContextType>(() => ({
    errors,
    breadcrumbs,
    captureError,
    captureApiError,
    captureMessage,
    clearErrors,
    reportError,
    addBreadcrumb,
    clearBreadcrumbs,
    hasUnhandledErrors,
    errorCount
  }), [
    errors, 
    breadcrumbs, 
    captureError,
    captureApiError, 
    captureMessage,
    clearErrors, 
    reportError, 
    addBreadcrumb,
    clearBreadcrumbs,
    hasUnhandledErrors,
    errorCount
  ]);
  
  return (
    <ErrorMonitorContext.Provider value={contextValue}>
      {children}
    </ErrorMonitorContext.Provider>
  );
};

// 错误边界组件用于包裹React组件
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => React.ReactNode);
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ErrorMonitorContext;
  context!: React.ContextType<typeof ErrorMonitorContext>;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 调用自定义错误处理程序
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 获取错误监控上下文
    if (this.context) {
      this.context.captureError(error, {
        componentName: this.props.componentName,
        source: 'react',
        metadata: { componentStack: errorInfo.componentStack }
      });
    } else {
      console.error('Error occurred but no ErrorMonitorContext available:', error);
    }
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了fallback函数，则调用它
      if (typeof this.props.fallback === 'function' && this.state.error) {
        return (this.props.fallback as Function)(this.state.error, this.resetError);
      }
      
      // 如果提供了fallback组件，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 默认错误UI
      return (
        <div className="error-fallback bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-800 my-4">
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">组件发生错误</h2>
          <p className="text-red-600 dark:text-red-400 mb-2">
            {this.state.error?.message || '发生了一个未知错误'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">我们已记录此问题并将尽快修复。</p>
          <button 
            onClick={this.resetError}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 创建一个高阶组件，方便包装组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WithErrorBoundary;
}

// 创建API错误处理包装器
export function createApiErrorHandler(errorMonitor: ErrorMonitorContextType) {
  return async function apiErrorHandler<T>(
    promise: Promise<T>, 
    options: {
      endpoint: string;
      method?: string;
      silent?: boolean;
    }
  ): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      // 处理Fetch API或Axios错误
      const status = (error as any)?.response?.status || (error as any)?.status || 500;
      const response = (error as any)?.response?.data || (error as any)?.data || error;
      
      errorMonitor.captureApiError(
        options.endpoint,
        status,
        response,
        options.method || 'GET'
      );
      
      throw error; // 继续抛出错误以便调用者可以处理
    }
  };
} 