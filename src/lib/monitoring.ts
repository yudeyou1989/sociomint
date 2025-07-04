/**
 * 监控系统
 * 提供错误监控、性能监控、用户行为分析等功能
 */

// 错误类型定义
interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  buildId?: string;
}

// 性能指标
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

// 用户行为事件
interface UserEvent {
  type: 'click' | 'view' | 'transaction' | 'error' | 'custom';
  action: string;
  category: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

// 监控配置
interface MonitoringConfig {
  apiEndpoint: string;
  apiKey?: string;
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  environment: 'development' | 'staging' | 'production';
}

class MonitoringService {
  private config: MonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private queue: Array<ErrorInfo | PerformanceMetric | UserEvent> = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  /**
   * 初始化监控
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // 全局错误处理
    if (this.config.enableErrorReporting) {
      this.setupErrorHandlers();
    }

    // 性能监控
    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    // 用户行为追踪
    if (this.config.enableUserTracking) {
      this.setupUserTracking();
    }

    // 定期刷新队列
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 10000); // 每10秒发送一次
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandlers(): void {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        buildId: process.env.BUILD_ID,
      });
    });

    // Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        buildId: process.env.BUILD_ID,
      });
    });
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.reportMetric({
            name: 'page_load_time',
            value: navigation.loadEventEnd - navigation.fetchStart,
            unit: 'ms',
            timestamp: Date.now(),
            tags: { page: window.location.pathname }
          });

          this.reportMetric({
            name: 'dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            unit: 'ms',
            timestamp: Date.now(),
            tags: { page: window.location.pathname }
          });
        }
      }, 0);
    });

    // 资源加载性能
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.reportMetric({
            name: 'resource_load_time',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            tags: { 
              resource: entry.name,
              type: (entry as PerformanceResourceTiming).initiatorType 
            }
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * 设置用户行为追踪
   */
  private setupUserTracking(): void {
    // 页面浏览
    this.trackEvent({
      type: 'view',
      action: 'page_view',
      category: 'navigation',
      properties: {
        page: window.location.pathname,
        referrer: document.referrer,
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    });

    // 点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      if (['button', 'a', 'input'].includes(tagName)) {
        this.trackEvent({
          type: 'click',
          action: 'element_click',
          category: 'interaction',
          label: target.textContent || target.getAttribute('aria-label') || tagName,
          properties: {
            element: tagName,
            className: target.className,
            id: target.id,
          },
          timestamp: Date.now(),
          userId: this.userId,
          sessionId: this.sessionId,
        });
      }
    });
  }

  /**
   * 报告错误
   */
  reportError(error: ErrorInfo): void {
    if (!this.config.enableErrorReporting) return;
    
    // 采样率控制
    if (Math.random() > this.config.sampleRate) return;

    console.error('Monitoring Error:', error);
    this.queue.push(error);
    
    // 立即发送严重错误
    if (error.message.includes('ChunkLoadError') || error.message.includes('Network')) {
      this.flush();
    }
  }

  /**
   * 报告性能指标
   */
  reportMetric(metric: PerformanceMetric): void {
    if (!this.config.enablePerformanceMonitoring) return;
    
    this.queue.push(metric);
  }

  /**
   * 追踪用户事件
   */
  trackEvent(event: UserEvent): void {
    if (!this.config.enableUserTracking) return;
    
    this.queue.push(event);
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * 追踪交易事件
   */
  trackTransaction(transactionData: {
    hash: string;
    type: string;
    amount: string;
    token: string;
    status: 'pending' | 'success' | 'failed';
  }): void {
    this.trackEvent({
      type: 'transaction',
      action: 'blockchain_transaction',
      category: 'web3',
      label: transactionData.type,
      value: parseFloat(transactionData.amount),
      properties: {
        hash: transactionData.hash,
        token: transactionData.token,
        status: transactionData.status,
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  /**
   * 追踪钱包连接
   */
  trackWalletConnection(walletType: string, success: boolean): void {
    this.trackEvent({
      type: 'custom',
      action: 'wallet_connection',
      category: 'web3',
      label: walletType,
      value: success ? 1 : 0,
      properties: {
        walletType,
        success,
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  /**
   * 刷新队列，发送数据
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const data = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          events: data,
          environment: this.config.environment,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send monitoring data:', response.status);
        // 重新加入队列
        this.queue.unshift(...data);
      }
    } catch (error) {
      console.warn('Error sending monitoring data:', error);
      // 重新加入队列
      this.queue.unshift(...data);
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // 最后一次发送
  }
}

// 全局监控实例
let monitoringService: MonitoringService | null = null;

/**
 * 初始化监控服务
 */
export function initializeMonitoring(config: Partial<MonitoringConfig> = {}): MonitoringService {
  const defaultConfig: MonitoringConfig = {
    apiEndpoint: '/api/monitoring',
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableUserTracking: true,
    sampleRate: 1.0,
    environment: (process.env.NODE_ENV as any) || 'development',
    ...config,
  };

  if (!monitoringService && typeof window !== 'undefined') {
    monitoringService = new MonitoringService(defaultConfig);
  }

  return monitoringService!;
}

/**
 * 获取监控服务实例
 */
export function getMonitoringService(): MonitoringService | null {
  return monitoringService;
}

/**
 * React错误边界监控
 */
export function reportReactError(error: Error, errorInfo: React.ErrorInfo): void {
  const monitoring = getMonitoringService();
  if (monitoring) {
    monitoring.reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: monitoring['sessionId'],
      buildId: process.env.BUILD_ID,
    });
  }
}

// 导出类型
export type { ErrorInfo, PerformanceMetric, UserEvent, MonitoringConfig };
