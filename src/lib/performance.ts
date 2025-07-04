/**
 * 性能监控工具
 * 提供页面性能监控、用户体验指标收集等功能
 */

// Web Vitals 指标类型
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// 性能指标接口
interface PerformanceMetrics {
  // Core Web Vitals
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // 自定义指标
  pageLoadTime?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  resourceLoadTime?: number;
  
  // 用户交互指标
  clickDelay?: number;
  scrollPerformance?: number;
  
  // 内存使用
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // 网络信息
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// 性能监控类
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private startTime: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  /**
   * 初始化性能监控
   */
  private initializeMonitoring(): void {
    // 监控导航时间
    this.observeNavigationTiming();
    
    // 监控资源加载时间
    this.observeResourceTiming();
    
    // 监控长任务
    this.observeLongTasks();
    
    // 监控布局偏移
    this.observeLayoutShift();
    
    // 监控最大内容绘制
    this.observeLargestContentfulPaint();
    
    // 监控首次输入延迟
    this.observeFirstInputDelay();
    
    // 获取网络信息
    this.getNetworkInformation();
    
    // 监控内存使用
    this.observeMemoryUsage();
  }

  /**
   * 监控导航时间
   */
  private observeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        this.metrics.ttfb = navigation.responseStart - navigation.fetchStart;
        this.metrics.firstPaint = navigation.responseEnd - navigation.fetchStart;
      }
    }
  }

  /**
   * 监控资源加载时间
   */
  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalResourceTime = 0;
        let resourceCount = 0;

        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            totalResourceTime += entry.duration;
            resourceCount++;
          }
        });

        if (resourceCount > 0) {
          this.metrics.resourceLoadTime = totalResourceTime / resourceCount;
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  /**
   * 监控长任务
   */
  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        // longtask 可能不被支持
        console.warn('Long task monitoring not supported');
      }
    }
  }

  /**
   * 监控布局偏移 (CLS)
   */
  private observeLayoutShift(): void {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });

        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Layout shift monitoring not supported');
      }
    }
  }

  /**
   * 监控最大内容绘制 (LCP)
   */
  private observeLargestContentfulPaint(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }
    }
  }

  /**
   * 监控首次输入延迟 (FID)
   */
  private observeFirstInputDelay(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });

        observer.observe({ entryTypes: ['first-input'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('FID monitoring not supported');
      }
    }
  }

  /**
   * 获取网络信息
   */
  private getNetworkInformation(): void {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.type;
      this.metrics.effectiveType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
    }
  }

  /**
   * 监控内存使用
   */
  private observeMemoryUsage(): void {
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
  }

  /**
   * 测量点击延迟
   */
  measureClickDelay(element: HTMLElement): void {
    let startTime: number;
    
    element.addEventListener('mousedown', () => {
      startTime = performance.now();
    });
    
    element.addEventListener('click', () => {
      if (startTime) {
        const delay = performance.now() - startTime;
        this.metrics.clickDelay = delay;
      }
    });
  }

  /**
   * 测量滚动性能
   */
  measureScrollPerformance(): void {
    let lastScrollTime = 0;
    let frameCount = 0;
    let totalTime = 0;

    const measureFrame = () => {
      const currentTime = performance.now();
      if (lastScrollTime > 0) {
        totalTime += currentTime - lastScrollTime;
        frameCount++;
      }
      lastScrollTime = currentTime;
    };

    window.addEventListener('scroll', () => {
      requestAnimationFrame(measureFrame);
    });

    // 每5秒计算一次平均滚动性能
    setInterval(() => {
      if (frameCount > 0) {
        this.metrics.scrollPerformance = totalTime / frameCount;
        frameCount = 0;
        totalTime = 0;
      }
    }, 5000);
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 发送性能数据到服务器
   */
  async sendMetrics(endpoint: string = '/api/analytics/performance'): Promise<void> {
    try {
      const metrics = this.getMetrics();
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionDuration: Date.now() - this.startTime,
        }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * 清理监控器
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 全局性能监控实例
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * 获取性能监控实例
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
}

/**
 * Web Vitals 监控
 */
export function initWebVitals(callback?: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined') return;

  // 动态导入 web-vitals 库
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    const handleMetric = (metric: WebVitalsMetric) => {
      console.log('Web Vital:', metric);
      callback?.(metric);
      
      // 发送到分析服务
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };

    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }).catch(error => {
    console.warn('Failed to load web-vitals:', error);
  });
}

/**
 * 性能标记工具
 */
export const PerformanceMark = {
  start(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}-start`);
    }
  },

  end(name: string): number | null {
    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      return measure ? measure.duration : null;
    }
    return null;
  },

  clear(name?: string): void {
    if ('performance' in window) {
      if (name) {
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  }
};
