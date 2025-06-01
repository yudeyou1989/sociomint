/**
 * 错误监控服务
 * 
 * 该服务负责捕获、记录和报告应用程序中的错误。
 * 它支持将错误发送到后端API，并可以集成第三方错误监控服务。
 */

import { createClient } from '@supabase/supabase-js';

// 环境变量
const ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 错误严重性级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 错误上下文接口
export interface ErrorContext {
  userId?: string;
  walletAddress?: string;
  path?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

// 错误报告接口
export interface ErrorReport {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: string;
  environment: string;
  context: ErrorContext;
  userAgent?: string;
  errorId: string;
}

/**
 * 生成唯一的错误ID
 */
const generateErrorId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

/**
 * 记录错误到控制台
 */
const logToConsole = (report: ErrorReport): void => {
  const { severity, message, errorId, context } = report;
  
  console.group(`[${severity.toUpperCase()}] Error ${errorId}`);
  console.error(message);
  console.info('Context:', context);
  console.groupEnd();
};

/**
 * 将错误报告发送到后端API
 */
const sendToApi = async (report: ErrorReport): Promise<void> => {
  try {
    await supabase.from('error_logs').insert([report]);
  } catch (error) {
    console.error('Failed to send error report to API:', error);
  }
};

/**
 * 创建错误报告
 */
const createErrorReport = (
  error: Error,
  severity: ErrorSeverity,
  context: ErrorContext
): ErrorReport => {
  return {
    message: error.message,
    stack: error.stack,
    severity,
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    errorId: generateErrorId(),
  };
};

/**
 * 捕获并报告错误
 */
export const captureError = async (
  error: Error,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context: ErrorContext = {}
): Promise<string> => {
  // 创建错误报告
  const report = createErrorReport(error, severity, context);
  
  // 记录到控制台
  logToConsole(report);
  
  // 在生产环境中发送到API
  if (ENVIRONMENT === 'production') {
    await sendToApi(report);
  }
  
  return report.errorId;
};

/**
 * 捕获并报告异常
 */
export const captureException = async (
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context: ErrorContext = {}
): Promise<string> => {
  const error = new Error(message);
  return captureError(error, severity, context);
};

/**
 * 创建全局错误处理器
 */
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window !== 'undefined') {
    // 处理未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      captureError(error, ErrorSeverity.HIGH, {
        action: 'unhandledrejection',
      });
    });
    
    // 处理未捕获的错误
    window.addEventListener('error', (event) => {
      const { message, filename, lineno, colno, error } = event;
      
      if (error) {
        captureError(error, ErrorSeverity.HIGH, {
          action: 'uncaughterror',
          path: filename,
          additionalData: { lineno, colno },
        });
      } else {
        captureException(message, ErrorSeverity.HIGH, {
          action: 'uncaughterror',
          path: filename,
          additionalData: { lineno, colno },
        });
      }
    });
  }
};

/**
 * 创建React错误边界的错误处理器
 */
export const handleBoundaryError = (
  error: Error,
  componentStack: string,
  componentName?: string
): void => {
  captureError(error, ErrorSeverity.HIGH, {
    component: componentName || 'Unknown',
    additionalData: { componentStack },
  });
};

/**
 * 错误监控服务
 */
const ErrorMonitoring = {
  captureError,
  captureException,
  setupGlobalErrorHandlers,
  handleBoundaryError,
  ErrorSeverity,
};

export default ErrorMonitoring;
