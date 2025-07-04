/**
 * 懒加载组件
 * 提供组件懒加载和加载状态管理
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { LoadingProps } from '@/types/components';

// 默认加载组件
const DefaultLoading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  text = '加载中...', 
  overlay = false,
  className 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const LoadingSpinner = (
    <div className={`flex flex-col items-center justify-center ${overlay ? 'fixed inset-0 bg-black bg-opacity-50 z-50' : 'py-8'} ${className || ''}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
      {text && <p className="text-gray-500 mt-2 text-sm">{text}</p>}
    </div>
  );

  return LoadingSpinner;
};

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoader Error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// 默认错误回退组件
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">加载失败</h3>
    <p className="text-gray-600 text-center mb-4">组件加载时出现错误，请重试</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      重新加载
    </button>
    {process.env.NODE_ENV === 'development' && (
      <details className="mt-4 text-xs text-gray-500">
        <summary className="cursor-pointer">错误详情</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
          {error.message}
        </pre>
      </details>
    )}
  </div>
);

// 懒加载高阶组件
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loading?: ComponentType<LoadingProps>;
    error?: ComponentType<{ error: Error; retry: () => void }>;
    loadingProps?: LoadingProps;
  } = {}
) {
  const LazyComponent = lazy(importFunc);
  const LoadingComponent = options.loading || DefaultLoading;
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyErrorBoundary fallback={options.error}>
      <Suspense fallback={<LoadingComponent {...(options.loadingProps || {})} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyErrorBoundary>
  ));
}

// 预加载函数
export function preloadComponent(importFunc: () => Promise<{ default: ComponentType<any> }>) {
  // 在空闲时间预加载组件
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      importFunc().catch(console.error);
    });
  } else {
    // 降级到 setTimeout
    setTimeout(() => {
      importFunc().catch(console.error);
    }, 100);
  }
}

// 懒加载组件工厂
export const LazyLoader = {
  // 社交任务组件
  SocialTaskList: withLazyLoading(
    () => import('@/components/social/SocialTaskList'),
    { loadingProps: { text: '加载社交任务...' } }
  ),
  
  // 空投池组件
  AirdropPoolList: withLazyLoading(
    () => import('@/components/airdrop/AirdropPoolList'),
    { loadingProps: { text: '加载空投池...' } }
  ),
  
  AirdropParticipationForm: withLazyLoading(
    () => import('@/components/airdrop/AirdropParticipationForm'),
    { loadingProps: { text: '加载参与表单...' } }
  ),
  
  // 交易历史组件
  TransactionHistory: withLazyLoading(
    () => import('@/TransactionHistory'),
    { loadingProps: { text: '加载交易历史...' } }
  ),
  
  // 用户余额组件
  UserBalanceDisplay: withLazyLoading(
    () => import('@/UserBalanceDisplay'),
    { loadingProps: { text: '加载余额信息...' } }
  ),
  
  // 代币交换组件
  TokenExchange: withLazyLoading(
    () => import('@/TokenExchange'),
    { loadingProps: { text: '加载交换界面...' } }
  ),
  
  // 小红花兑换组件
  XiaohonghuaExchange: withLazyLoading(
    () => import('@/XiaohonghuaExchange'),
    { loadingProps: { text: '加载小红花兑换...' } }
  ),
};

// 预加载所有组件
export function preloadAllComponents() {
  if (typeof window === 'undefined') return;
  
  // 延迟预加载，避免影响首屏性能
  setTimeout(() => {
    preloadComponent(() => import('@/components/social/SocialTaskList'));
    preloadComponent(() => import('@/components/airdrop/AirdropPoolList'));
    preloadComponent(() => import('@/components/airdrop/AirdropParticipationForm'));
    preloadComponent(() => import('@/TransactionHistory'));
    preloadComponent(() => import('@/UserBalanceDisplay'));
    preloadComponent(() => import('@/TokenExchange'));
    preloadComponent(() => import('@/XiaohonghuaExchange'));
  }, 2000);
}

export default LazyLoader;
