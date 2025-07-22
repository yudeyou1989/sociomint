'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 加载状态类型
interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// 全局加载状态管理器
export function LoadingStateProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      isAnyLoading,
      clearAllLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

// 使用加载状态的Hook
export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingState must be used within LoadingStateProvider');
  }
  return context;
}

// 智能加载指示器组件
interface SmartLoadingIndicatorProps {
  loadingKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  minLoadingTime?: number; // 最小加载时间，避免闪烁
  delay?: number; // 延迟显示时间
}

export function SmartLoadingIndicator({
  loadingKey,
  children,
  fallback,
  minLoadingTime = 300,
  delay = 200
}: SmartLoadingIndicatorProps) {
  const { isLoading } = useLoadingState();
  const [showLoading, setShowLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const loading = isLoading(loadingKey);

  // 处理延迟显示和最小加载时间
  useState(() => {
    let delayTimer: NodeJS.Timeout;
    let minTimer: NodeJS.Timeout;

    if (loading) {
      // 延迟显示加载状态
      delayTimer = setTimeout(() => {
        setShowLoading(true);
        setStartTime(Date.now());
      }, delay);
    } else if (showLoading && startTime) {
      // 确保最小加载时间
      const elapsed = Date.now() - startTime;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        minTimer = setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, remaining);
      } else {
        setShowLoading(false);
        setStartTime(null);
      }
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  });

  if (showLoading) {
    return (
      <>
        {fallback || <DefaultLoadingFallback />}
      </>
    );
  }

  return <>{children}</>;
}

// 默认加载回退组件
const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-[#0de5ff] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// 页面级加载覆盖层
export function PageLoadingOverlay() {
  const { isAnyLoading } = useLoadingState();

  if (!isAnyLoading()) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900/90 rounded-lg p-6 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0de5ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-sm">处理中...</p>
      </div>
    </div>
  );
}

// 按钮加载状态Hook
export function useButtonLoading(key: string) {
  const { setLoading, isLoading } = useLoadingState();

  const withLoading = useCallback(async (asyncFn: () => Promise<any>) => {
    setLoading(key, true);
    try {
      return await asyncFn();
    } finally {
      setLoading(key, false);
    }
  }, [key, setLoading]);

  return {
    loading: isLoading(key),
    withLoading
  };
}

// 表单提交加载Hook
export function useFormLoading(formKey: string) {
  const { setLoading, isLoading } = useLoadingState();

  const submitWithLoading = useCallback(async (
    submitFn: () => Promise<any>,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    setLoading(formKey, true);
    try {
      const result = await submitFn();
      onSuccess?.();
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      setLoading(formKey, false);
    }
  }, [formKey, setLoading]);

  return {
    loading: isLoading(formKey),
    submitWithLoading
  };
}

// 数据获取加载Hook
export function useDataLoading(dataKey: string) {
  const { setLoading, isLoading } = useLoadingState();

  const fetchWithLoading = useCallback(async <T>(
    fetchFn: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: unknown) => void
  ): Promise<T | null> => {
    setLoading(dataKey, true);
    try {
      const data = await fetchFn();
      onSuccess?.(data);
      return data;
    } catch (error) {
      onError?.(error);
      return null;
    } finally {
      setLoading(dataKey, false);
    }
  }, [dataKey, setLoading]);

  return {
    loading: isLoading(dataKey),
    fetchWithLoading
  };
}

// 骨架屏组件
export function SkeletonLoader({ 
  lines = 3, 
  className = '',
  animated = true 
}: { 
  lines?: number; 
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-800/50 rounded ${animated ? 'animate-pulse' : ''}`}
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
        />
      ))}
    </div>
  );
}

// 卡片骨架屏
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 animate-pulse ${className}`}>
      <div className="h-6 bg-gray-700/50 rounded mb-4 w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700/50 rounded w-4/6"></div>
      </div>
      <div className="mt-4 h-10 bg-gray-700/50 rounded w-1/3"></div>
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className = '' 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* 表头 */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-6 bg-gray-700/50 rounded flex-1"></div>
        ))}
      </div>
      
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 mb-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-800/50 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingStateProvider;
