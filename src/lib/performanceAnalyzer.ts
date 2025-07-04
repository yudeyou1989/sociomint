/**
 * 性能分析工具
 * 提供详细的性能指标收集和分析
 */

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: string;
  details?: any;
}

interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: {
    navigation: NavigationMetrics;
    resources: ResourceMetrics[];
    vitals: WebVitals;
    custom: CustomMetrics;
  };
  recommendations: string[];
}

interface NavigationMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface ResourceMetrics {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  cached: boolean;
}

interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface CustomMetrics {
  walletConnectionTime?: number;
  transactionTime?: number;
  apiResponseTimes: Record<string, number>;
  componentRenderTimes: Record<string, number>;
}

class PerformanceAnalyzer {
  private entries: PerformanceEntry[] = [];
  private customMetrics: CustomMetrics = { apiResponseTimes: {}, componentRenderTimes: {} };
  private observer?: PerformanceObserver;

  constructor() {
    this.initializeObserver();
    this.collectNavigationMetrics();
  }

  /**
   * 初始化性能观察器
   */
  private initializeObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // 观察所有类型的性能条目
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * 处理性能条目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const processedEntry: PerformanceEntry = {
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      type: entry.entryType,
      details: this.extractEntryDetails(entry),
    };

    this.entries.push(processedEntry);

    // 实时分析关键指标
    this.analyzeEntry(processedEntry);
  }

  /**
   * 提取条目详细信息
   */
  private extractEntryDetails(entry: any): any {
    switch (entry.entryType) {
      case 'navigation':
        return {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          loadComplete: entry.loadEventEnd - entry.loadEventStart,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
        };
      case 'resource':
        return {
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
          initiatorType: entry.initiatorType,
        };
      case 'largest-contentful-paint':
        return {
          element: entry.element?.tagName,
          url: entry.url,
          size: entry.size,
        };
      case 'first-input':
        return {
          processingStart: entry.processingStart,
          processingEnd: entry.processingEnd,
        };
      case 'layout-shift':
        return {
          value: entry.value,
          hadRecentInput: entry.hadRecentInput,
        };
      default:
        return {};
    }
  }

  /**
   * 分析性能条目
   */
  private analyzeEntry(entry: PerformanceEntry): void {
    // 检查慢资源
    if (entry.type === 'resource' && entry.duration > 1000) {
      console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`);
    }

    // 检查大的LCP
    if (entry.type === 'largest-contentful-paint' && entry.duration > 2500) {
      console.warn(`Poor LCP detected: ${entry.duration}ms`);
    }

    // 检查高的FID
    if (entry.type === 'first-input' && entry.duration > 100) {
      console.warn(`Poor FID detected: ${entry.duration}ms`);
    }
  }

  /**
   * 收集导航指标
   */
  private collectNavigationMetrics(): void {
    if (typeof window === 'undefined') return;

    // 等待页面加载完成
    if (document.readyState === 'complete') {
      this.processNavigationTiming();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.processNavigationTiming(), 0);
      });
    }
  }

  /**
   * 处理导航时间
   */
  private processNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstByte: navigation.responseStart - navigation.fetchStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
    };

    console.log('Navigation Metrics:', metrics);
  }

  /**
   * 测量自定义操作
   */
  measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.recordCustomMetric(name, duration);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.recordCustomMetric(`${name}_error`, duration);
        throw error;
      }
    );
  }

  /**
   * 记录自定义指标
   */
  recordCustomMetric(name: string, value: number): void {
    if (name.includes('api_')) {
      this.customMetrics.apiResponseTimes[name] = value;
    } else if (name.includes('component_')) {
      this.customMetrics.componentRenderTimes[name] = value;
    } else if (name === 'wallet_connection') {
      this.customMetrics.walletConnectionTime = value;
    } else if (name === 'transaction') {
      this.customMetrics.transactionTime = value;
    }

    console.log(`Custom metric recorded: ${name} = ${value}ms`);
  }

  /**
   * 获取Web Vitals
   */
  getWebVitals(): WebVitals {
    const vitals: WebVitals = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    };

    // LCP
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // FCP
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      vitals.fcp = fcpEntries[0].startTime;
    }

    // FID
    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      vitals.fid = fidEntries[0].processingStart - fidEntries[0].startTime;
    }

    // CLS
    const clsEntries = performance.getEntriesByType('layout-shift');
    vitals.cls = clsEntries
      .filter((entry: any) => !entry.hadRecentInput)
      .reduce((sum: number, entry: any) => sum + entry.value, 0);

    // TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      vitals.ttfb = navigation.responseStart - navigation.fetchStart;
    }

    return vitals;
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {
        navigation: this.getNavigationMetrics(),
        resources: this.getResourceMetrics(),
        vitals: this.getWebVitals(),
        custom: this.customMetrics,
      },
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * 获取导航指标
   */
  private getNavigationMetrics(): NavigationMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const vitals = this.getWebVitals();

    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: vitals.fcp,
      largestContentfulPaint: vitals.lcp,
      firstInputDelay: vitals.fid,
      cumulativeLayoutShift: vitals.cls,
      timeToInteractive: this.calculateTTI(),
    };
  }

  /**
   * 获取资源指标
   */
  private getResourceMetrics(): ResourceMetrics[] {
    return performance.getEntriesByType('resource').map((entry: any) => ({
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize || 0,
      duration: entry.duration,
      startTime: entry.startTime,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    }));
  }

  /**
   * 计算TTI (Time to Interactive)
   */
  private calculateTTI(): number {
    // 简化的TTI计算
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.domInteractive - navigation.fetchStart : 0;
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const vitals = this.getWebVitals();

    if (vitals.lcp > 2500) {
      recommendations.push('优化最大内容绘制 (LCP) - 考虑优化图片加载或减少渲染阻塞资源');
    }

    if (vitals.fid > 100) {
      recommendations.push('优化首次输入延迟 (FID) - 减少主线程阻塞时间');
    }

    if (vitals.cls > 0.1) {
      recommendations.push('优化累积布局偏移 (CLS) - 为图片和广告预留空间');
    }

    if (vitals.fcp > 1800) {
      recommendations.push('优化首次内容绘制 (FCP) - 优化关键渲染路径');
    }

    return recommendations;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// 全局实例
export const performanceAnalyzer = new PerformanceAnalyzer();

// 便捷方法
export const measureAsync = <T>(name: string, operation: () => Promise<T>) => 
  performanceAnalyzer.measureOperation(name, operation);

export const recordMetric = (name: string, value: number) => 
  performanceAnalyzer.recordCustomMetric(name, value);

export const getPerformanceReport = () => 
  performanceAnalyzer.generateReport();
