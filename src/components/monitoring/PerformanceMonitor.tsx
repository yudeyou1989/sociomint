'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  memoryUsage?: number;
  connectionType?: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInProduction?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showInProduction = false,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // 检查是否应该显示监控器
  const shouldShow = enabled || (process.env.NODE_ENV === 'production' && showInProduction);

  useEffect(() => {
    if (!shouldShow || typeof window === 'undefined') return;

    // 收集基础性能指标
    const collectBasicMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics: Partial<PerformanceMetrics> = {
        ttfb: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      };

      // First Contentful Paint
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        newMetrics.fcp = fcp.startTime;
      }

      // 内存使用情况 (如果支持)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      // 网络连接类型 (如果支持)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection.effectiveType;
      }

      setMetrics(prev => ({ ...prev, ...newMetrics }));
      onMetricsUpdate?.(newMetrics as PerformanceMetrics);
    };

    // 使用 PerformanceObserver 收集 Web Vitals
    const setupPerformanceObserver = () => {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        observerRef.current = lcpObserver; // 保存一个引用用于清理
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    };

    // 延迟收集指标，确保页面加载完成
    const timer = setTimeout(() => {
      collectBasicMetrics();
      setupPerformanceObserver();
    }, 1000);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [shouldShow, onMetricsUpdate]);

  // 获取性能评级
  const getPerformanceGrade = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  // 获取评级颜色
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  // 格式化数值
  const formatValue = (metric: string, value: number) => {
    if (metric === 'cls') return value.toFixed(3);
    if (metric === 'memoryUsage') return `${value.toFixed(1)} MB`;
    return `${Math.round(value)} ms`;
  };

  if (!shouldShow) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        minWidth: 280,
        maxWidth: 400,
        zIndex: 9999,
        boxShadow: 3,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" fontWeight="bold">
          性能监控
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box display="flex" flexDirection="column" gap={1}>
          {Object.entries(metrics).map(([key, value]) => {
            if (value === undefined || value === null) return null;
            
            const grade = getPerformanceGrade(key, value);
            const color = getGradeColor(grade);
            
            return (
              <Box key={key} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ minWidth: 80 }}>
                  {key.toUpperCase()}
                </Typography>
                <Chip
                  label={formatValue(key, value)}
                  size="small"
                  color={color as any}
                  variant="outlined"
                />
              </Box>
            );
          })}
          
          {metrics.connectionType && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">网络</Typography>
              <Chip
                label={metrics.connectionType}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </Collapse>

      {!isExpanded && (
        <Box display="flex" gap={1} flexWrap="wrap">
          {metrics.lcp && (
            <Chip
              label={`LCP: ${Math.round(metrics.lcp)}ms`}
              size="small"
              color={getGradeColor(getPerformanceGrade('lcp', metrics.lcp)) as any}
              variant="outlined"
            />
          )}
          {metrics.fid && (
            <Chip
              label={`FID: ${Math.round(metrics.fid)}ms`}
              size="small"
              color={getGradeColor(getPerformanceGrade('fid', metrics.fid)) as any}
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

// 性能监控钩子
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  const reportMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
    
    // 发送到分析服务 (如果需要)
    if (process.env.NODE_ENV === 'production') {
      // 这里可以集成 Google Analytics, Sentry 等
      console.log('Performance Metrics:', newMetrics);
    }
  };

  return { metrics, reportMetrics };
};

export default PerformanceMonitor;
