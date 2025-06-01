/**
 * Sentry 监控配置
 * 用于错误追踪和性能监控
 */

import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';

// 环境变量
const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';

// Sentry 配置
export const sentryConfig = {
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  release: `sociomint@${RELEASE}`,
  
  // 性能监控
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // 会话重放
  replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // 集成配置
  integrations: [
    new BrowserTracing({
      // 路由变化追踪
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      
      // 自动追踪的操作
      tracingOrigins: [
        'localhost',
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/sociomint\.com$/,
        /^https:\/\/.*\.supabase\.co$/,
        /^https:\/\/bsc-dataseed.*\.binance\.org$/
      ]
    }),
    
    // 会话重放
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    })
  ],
  
  // 错误过滤
  beforeSend(event, hint) {
    // 过滤掉开发环境的某些错误
    if (ENVIRONMENT === 'development') {
      // 过滤 HMR 相关错误
      if (event.exception?.values?.[0]?.value?.includes('HMR')) {
        return null;
      }
    }
    
    // 过滤网络错误
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }
    
    return event;
  },
  
  // 性能监控过滤
  beforeSendTransaction(event) {
    // 过滤掉某些不重要的事务
    if (event.transaction?.includes('/_next/')) {
      return null;
    }
    
    return event;
  }
};

// 初始化 Sentry
export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init(sentryConfig);
    
    // 设置用户上下文
    Sentry.setContext('app', {
      name: 'SocioMint',
      version: process.env.npm_package_version || '1.0.0'
    });
    
    console.log('✅ Sentry initialized');
  } else {
    console.warn('⚠️ Sentry DSN not found, monitoring disabled');
  }
}

// 自定义错误报告函数
export function reportError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  
  Sentry.captureException(error);
}

// 自定义事件报告函数
export function reportEvent(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

// 设置用户信息
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  walletAddress?: string;
}) {
  Sentry.setUser(user);
}

// 添加面包屑
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000
  });
}

// 区块链交易监控
export function trackTransaction(txHash: string, type: string, amount?: string) {
  Sentry.addBreadcrumb({
    message: `Blockchain transaction: ${type}`,
    category: 'blockchain',
    data: {
      txHash,
      type,
      amount,
      timestamp: new Date().toISOString()
    },
    level: 'info'
  });
}

// 社交平台操作监控
export function trackSocialAction(platform: string, action: string, success: boolean) {
  Sentry.addBreadcrumb({
    message: `Social action: ${platform} ${action}`,
    category: 'social',
    data: {
      platform,
      action,
      success,
      timestamp: new Date().toISOString()
    },
    level: success ? 'info' : 'warning'
  });
}

// 性能监控
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
    tags: {
      component: 'sociomint'
    }
  });
}

// API 调用监控
export function trackApiCall(endpoint: string, method: string, status: number, duration: number) {
  Sentry.addBreadcrumb({
    message: `API call: ${method} ${endpoint}`,
    category: 'api',
    data: {
      endpoint,
      method,
      status,
      duration,
      timestamp: new Date().toISOString()
    },
    level: status >= 400 ? 'error' : 'info'
  });
}

// 钱包连接监控
export function trackWalletConnection(walletType: string, success: boolean, error?: string) {
  const data = {
    walletType,
    success,
    timestamp: new Date().toISOString(),
    ...(error && { error })
  };
  
  Sentry.addBreadcrumb({
    message: `Wallet connection: ${walletType}`,
    category: 'wallet',
    data,
    level: success ? 'info' : 'error'
  });
  
  if (!success && error) {
    reportError(new Error(`Wallet connection failed: ${error}`), data);
  }
}

// 空投池操作监控
export function trackAirdropAction(action: string, amount?: string, roundId?: string) {
  Sentry.addBreadcrumb({
    message: `Airdrop action: ${action}`,
    category: 'airdrop',
    data: {
      action,
      amount,
      roundId,
      timestamp: new Date().toISOString()
    },
    level: 'info'
  });
}

// 用户行为监控
export function trackUserBehavior(action: string, page: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    data: {
      action,
      page,
      ...data,
      timestamp: new Date().toISOString()
    },
    level: 'info'
  });
}

// 导出默认配置
export default sentryConfig;
