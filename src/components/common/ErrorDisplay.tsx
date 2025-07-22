/**
 * 错误显示组件
 * 提供统一的错误信息显示和用户交互
 */

import React, { useState, useEffect } from 'react';
import { AppError, ERROR_CODES } from '@/utils/errorHandler';

// 错误显示组件属性
interface ErrorDisplayProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

// 错误图标组件
const ErrorIcon = ({ severity }: { severity: AppError['severity'] }) => {
  const getIconColor = () => {
    switch (severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#d97706'; // amber-600
      case 'low': return '#65a30d'; // lime-600
      default: return '#6b7280'; // gray-500
    }
  };

  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      style={{ color: getIconColor() }}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
};

// 重试按钮组件
const RetryButton = ({ onRetry, disabled }: { onRetry: () => void; disabled?: boolean }) => (
  <button
    onClick={onRetry}
    disabled={disabled}
    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    重试
  </button>
);

// 关闭按钮组件
const DismissButton = ({ onDismiss }: { onDismiss: () => void }) => (
  <button
    onClick={onDismiss}
    className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// 错误详情组件
const ErrorDetails = ({ error }: { error: AppError }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
      >
        {showDetails ? '隐藏详情' : '显示详情'}
      </button>
      
      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
          <div><strong>错误代码:</strong> {error.code}</div>
          <div><strong>时间:</strong> {new Date(error.timestamp).toLocaleString()}</div>
          <div><strong>类别:</strong> {error.category}</div>
          <div><strong>严重程度:</strong> {error.severity}</div>
          {error.metadata && (
            <div><strong>附加信息:</strong> {JSON.stringify(error.metadata, null, 2)}</div>
          )}
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">技术详情</summary>
              <pre className="mt-1 text-xs overflow-x-auto">{error.stack}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// 主错误显示组件
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && error && error.severity === 'low') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  if (!error || !isVisible) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (error.severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 ${getBackgroundColor()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <ErrorIcon severity={error.severity} />
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {error.userMessage}
          </h3>
          
          {error.message !== error.userMessage && (
            <p className="mt-1 text-sm text-gray-600">
              {error.message}
            </p>
          )}
          
          <div className="mt-3 flex items-center space-x-3">
            {error.retryable && onRetry && (
              <RetryButton onRetry={onRetry} />
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
              >
                关闭
              </button>
            )}
          </div>
          
          {showDetails && <ErrorDetails error={error} />}
        </div>
        
        {onDismiss && (
          <div className="ml-4">
            <DismissButton onDismiss={onDismiss} />
          </div>
        )}
      </div>
    </div>
  );
};

// 错误吐司组件
interface ErrorToastProps {
  error: AppError;
  onDismiss: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // 等待动画完成
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      default: return 'top-4 right-4';
    }
  };

  const getSeverityClasses = () => {
    switch (error.severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div
      className={`fixed z-50 max-w-sm w-full ${getPositionClasses()} transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
    >
      <div className={`rounded-lg shadow-lg p-4 ${getSeverityClasses()}`}>
        <div className="flex items-start">
          <ErrorIcon severity={error.severity} />
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {error.userMessage}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="ml-4 inline-flex text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: AppError; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const { errorHandler } = require('@/utils/errorHandler');
    const appError = errorHandler.createError(ERROR_CODES.INTERNAL_ERROR, error);
    
    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { handleComponentError } = require('@/utils/errorHandler');
    handleComponentError(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={this.state.error}
              onRetry={this.retry}
              showDetails={true}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 默认错误回退组件
export const DefaultErrorFallback: React.FC<{ error: AppError; retry: () => void }> = ({
  error,
  retry
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">出现了问题</h1>
        <p className="text-gray-600">我们正在努力解决这个问题</p>
      </div>
      
      <ErrorDisplay
        error={error}
        onRetry={retry}
        showDetails={true}
        className="mb-6"
      />
      
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          刷新页面
        </button>
      </div>
    </div>
  </div>
);

export default {
  ErrorDisplay,
  ErrorToast,
  ErrorBoundary,
  DefaultErrorFallback
};
