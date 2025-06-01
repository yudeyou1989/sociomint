'use client';

import { ReactNode, useEffect } from 'react';
import ErrorMonitoring from '@/services/errorMonitoring';

interface ErrorMonitoringProviderProps {
  children: ReactNode;
}

/**
 * 错误监控提供者组件
 * 
 * 初始化全局错误处理器并提供错误监控上下文
 */
const ErrorMonitoringProvider = ({ children }: ErrorMonitoringProviderProps) => {
  useEffect(() => {
    // 设置全局错误处理器
    ErrorMonitoring.setupGlobalErrorHandlers();
    
    // 记录应用程序启动
    console.info('Error monitoring initialized');
  }, []);

  return <>{children}</>;
};

export default ErrorMonitoringProvider;
