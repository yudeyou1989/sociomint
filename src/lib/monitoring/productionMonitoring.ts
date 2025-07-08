/**
 * 生产环境监控系统
 * 集成错误监控、性能监控、用户行为分析
 */

interface MonitoringConfig {
  sentryDsn?: string;
  googleAnalyticsId?: string;
  hotjarId?: string;
  logRocketId?: string;
  enablePerformanceMonitoring: boolean;
  enableErrorMonitoring: boolean;
  enableUserAnalytics: boolean;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  loadTime: number;
  bundleSize: number;
  memoryUsage: number;
}

interface UserEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class ProductionMonitoring {
  private config: MonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
  }

  /**
   * 初始化监控系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // 初始化Sentry错误监控
      if (this.config.enableErrorMonitoring && this.config.sentryDsn) {
        await this.initializeSentry();
      }

      // 初始化Google Analytics
      if (this.config.enableUserAnalytics && this.config.googleAnalyticsId) {
        await this.initializeGoogleAnalytics();
      }

      // 初始化性能监控
      if (this.config.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }

      // 设置全局错误处理
      this.setupGlobalErrorHandling();

      // 设置性能观察器
      this.setupPerformanceObservers();

      this.isInitialized = true;
      console.log('Production monitoring initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }

  /**
   * 初始化Sentry
   */
  private async initializeSentry(): Promise<void> {
    try {
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        beforeSend: (event) => {
          // 过滤敏感信息
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          return event;
        },
      });

      console.log('Sentry initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * 初始化Google Analytics
   */
  private async initializeGoogleAnalytics(): Promise<void> {
    try {
      // 动态加载GA脚本
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
      document.head.appendChild(script);

      // 初始化gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', this.config.googleAnalyticsId, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=Strict;Secure',
      });

      console.log('Google Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitoring(): void {
    // Web Vitals监控
    if ('PerformanceObserver' in window) {
      this.observeWebVitals();
    }

    // 资源加载监控
    this.observeResourceLoading();

    // 内存使用监控
    this.observeMemoryUsage();
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });
    });

    // Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        severity: 'high'
      });
    });

    // React错误边界
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('React')) {
        this.reportError({
          message: args.join(' '),
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    // 观察导航性能
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.reportPerformanceMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * 观察Web Vitals
   */
  private observeWebVitals(): void {
    // 这里可以集成web-vitals库
    // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
  }

  /**
   * 观察资源加载
   */
  private observeResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 1000) { // 超过1秒的资源
            this.reportSlowResource(entry);
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * 观察内存使用
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 超过50MB
          this.reportHighMemoryUsage(memory);
        }
      }, 30000); // 每30秒检查一次
    }
  }

  /**
   * 报告错误
   */
  reportError(errorInfo: ErrorInfo): void {
    try {
      // 发送到Sentry
      if (this.config.enableErrorMonitoring && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(errorInfo.message), {
          extra: errorInfo,
          user: { id: this.userId },
          tags: { severity: errorInfo.severity }
        });
      }

      // 发送到自定义端点
      this.sendToEndpoint('/api/monitoring/errors', errorInfo);

      console.error('Error reported:', errorInfo);
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  /**
   * 报告性能指标
   */
  reportPerformanceMetrics(timing: PerformanceNavigationTiming): void {
    const metrics: Partial<PerformanceMetrics> = {
      ttfb: timing.responseStart - timing.requestStart,
      loadTime: timing.loadEventEnd - timing.navigationStart,
    };

    this.sendToEndpoint('/api/monitoring/performance', metrics);
  }

  /**
   * 报告慢资源
   */
  private reportSlowResource(entry: PerformanceEntry): void {
    this.sendToEndpoint('/api/monitoring/slow-resources', {
      name: entry.name,
      duration: entry.duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 报告高内存使用
   */
  private reportHighMemoryUsage(memory: any): void {
    this.sendToEndpoint('/api/monitoring/memory', {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 跟踪用户事件
   */
  trackEvent(event: Omit<UserEvent, 'sessionId' | 'timestamp'>): void {
    const userEvent: UserEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userId: this.userId
    };

    // 发送到Google Analytics
    if (this.config.enableUserAnalytics && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value
      });
    }

    // 发送到自定义端点
    this.sendToEndpoint('/api/monitoring/events', userEvent);
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    if ((window as any).gtag) {
      (window as any).gtag('config', this.config.googleAnalyticsId, {
        user_id: userId
      });
    }
  }

  /**
   * 发送数据到端点
   */
  private async sendToEndpoint(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Failed to send data to ${endpoint}:`, error);
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 创建全局监控实例
export const monitoring = new ProductionMonitoring({
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
  enablePerformanceMonitoring: true,
  enableErrorMonitoring: true,
  enableUserAnalytics: true
});

export default monitoring;
