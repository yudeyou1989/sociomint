'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorMonitoring from '../services/errorMonitoring';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下次渲染时显示备用 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    const { componentName, onError } = this.props;

    // 调用错误监控服务
    ErrorMonitoring.handleBoundaryError(error, errorInfo.componentStack, componentName);

    // 调用自定义错误处理函数
    if (onError) {
      onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // 如果定义了备用UI，则显示备用UI
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      // 默认的错误UI
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">出现了一些问题</h2>
          <p className="text-red-600 mb-4">
            应用程序遇到了错误。我们已记录此问题并将尽快修复。
          </p>
          <details className="text-sm text-gray-700">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              错误详情
            </summary>
            <p className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {error.toString()}
            </p>
          </details>
          <button
            onClick={this.resetError}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    // 正常情况下渲染子组件
    return children;
  }
}

export default ErrorBoundary;
