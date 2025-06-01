/**
 * 分析工具集成配置
 * 支持 Google Analytics 4 和自定义事件追踪
 */

import { gtag } from 'ga-gtag';

// 环境变量
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// 事件类型定义
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// 用户属性类型
export interface UserProperties {
  wallet_address?: string;
  user_type?: 'new' | 'returning';
  platform_connected?: string[];
  total_rewards?: number;
  registration_date?: string;
}

// 电商事件类型
export interface EcommerceEvent {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * 初始化 Google Analytics
 */
export function initializeAnalytics(): void {
  if (!GA_MEASUREMENT_ID) {
    console.warn('⚠️ Google Analytics ID not found');
    return;
  }

  if (typeof window === 'undefined') {
    return; // 服务端渲染时跳过
  }

  // 加载 gtag 脚本
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 初始化 gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: 'SocioMint',
    page_location: window.location.href,
    debug_mode: ENVIRONMENT === 'development',
    send_page_view: true
  });

  // 设置全局参数
  gtag('config', GA_MEASUREMENT_ID, {
    custom_map: {
      custom_parameter_1: 'wallet_address',
      custom_parameter_2: 'platform_type'
    }
  });

  console.log('✅ Google Analytics initialized');
}

/**
 * 追踪页面浏览
 */
export function trackPageView(page_path: string, page_title?: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('config', GA_MEASUREMENT_ID, {
    page_path,
    page_title: page_title || document.title
  });
}

/**
 * 追踪自定义事件
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.custom_parameters
  });
}

/**
 * 设置用户属性
 */
export function setUserProperties(properties: UserProperties): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('config', GA_MEASUREMENT_ID, {
    user_properties: properties
  });
}

/**
 * 追踪钱包连接事件
 */
export function trackWalletConnection(walletType: string, success: boolean): void {
  trackEvent({
    action: 'wallet_connect',
    category: 'engagement',
    label: walletType,
    value: success ? 1 : 0,
    custom_parameters: {
      wallet_type: walletType,
      success: success
    }
  });
}

/**
 * 追踪社交平台绑定事件
 */
export function trackSocialBinding(platform: string, success: boolean): void {
  trackEvent({
    action: 'social_bind',
    category: 'engagement',
    label: platform,
    value: success ? 1 : 0,
    custom_parameters: {
      platform: platform,
      success: success
    }
  });
}

/**
 * 追踪社交任务完成事件
 */
export function trackSocialTaskCompletion(
  platform: string,
  taskType: string,
  reward: number
): void {
  trackEvent({
    action: 'social_task_complete',
    category: 'engagement',
    label: `${platform}_${taskType}`,
    value: reward,
    custom_parameters: {
      platform: platform,
      task_type: taskType,
      reward_amount: reward
    }
  });
}

/**
 * 追踪空投池参与事件
 */
export function trackAirdropParticipation(
  roundId: string,
  depositAmount: number,
  expectedReward: number
): void {
  trackEvent({
    action: 'airdrop_participate',
    category: 'conversion',
    label: `round_${roundId}`,
    value: depositAmount,
    custom_parameters: {
      round_id: roundId,
      deposit_amount: depositAmount,
      expected_reward: expectedReward
    }
  });
}

/**
 * 追踪代币交换事件
 */
export function trackTokenExchange(
  fromToken: string,
  toToken: string,
  amount: number,
  exchangeRate: number
): void {
  trackEvent({
    action: 'token_exchange',
    category: 'conversion',
    label: `${fromToken}_to_${toToken}`,
    value: amount,
    custom_parameters: {
      from_token: fromToken,
      to_token: toToken,
      amount: amount,
      exchange_rate: exchangeRate
    }
  });

  // 同时追踪为电商事件
  trackPurchase({
    transaction_id: `exchange_${Date.now()}`,
    value: amount,
    currency: fromToken,
    items: [{
      item_id: toToken,
      item_name: `${toToken} Token`,
      category: 'cryptocurrency',
      quantity: amount * exchangeRate,
      price: 1 / exchangeRate
    }]
  });
}

/**
 * 追踪宝箱开启事件
 */
export function trackTreasureBoxOpen(
  boxType: string,
  cost: number,
  rewards: Array<{ type: string; amount: number }>
): void {
  const totalRewardValue = rewards.reduce((sum, reward) => sum + reward.amount, 0);

  trackEvent({
    action: 'treasure_box_open',
    category: 'engagement',
    label: boxType,
    value: cost,
    custom_parameters: {
      box_type: boxType,
      cost: cost,
      total_reward_value: totalRewardValue,
      reward_count: rewards.length
    }
  });
}

/**
 * 追踪购买事件（电商）
 */
export function trackPurchase(event: EcommerceEvent): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('event', 'purchase', {
    transaction_id: event.transaction_id,
    value: event.value,
    currency: event.currency,
    items: event.items
  });
}

/**
 * 追踪搜索事件
 */
export function trackSearch(searchTerm: string, category?: string): void {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    custom_parameters: {
      search_term: searchTerm,
      search_category: category
    }
  });
}

/**
 * 追踪分享事件
 */
export function trackShare(method: string, contentType: string, itemId?: string): void {
  trackEvent({
    action: 'share',
    category: 'engagement',
    label: method,
    custom_parameters: {
      method: method,
      content_type: contentType,
      item_id: itemId
    }
  });
}

/**
 * 追踪登录事件
 */
export function trackLogin(method: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('event', 'login', {
    method: method
  });
}

/**
 * 追踪注册事件
 */
export function trackSignUp(method: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('event', 'sign_up', {
    method: method
  });
}

/**
 * 追踪错误事件
 */
export function trackError(errorMessage: string, errorCategory: string, fatal: boolean = false): void {
  trackEvent({
    action: 'exception',
    category: 'error',
    label: errorMessage,
    custom_parameters: {
      description: errorMessage,
      error_category: errorCategory,
      fatal: fatal
    }
  });
}

/**
 * 追踪性能指标
 */
export function trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
  trackEvent({
    action: 'performance',
    category: 'technical',
    label: metricName,
    value: value,
    custom_parameters: {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit
    }
  });
}

/**
 * 追踪用户参与度
 */
export function trackEngagement(engagementType: string, duration?: number): void {
  trackEvent({
    action: 'engagement',
    category: 'user_behavior',
    label: engagementType,
    value: duration,
    custom_parameters: {
      engagement_type: engagementType,
      duration: duration
    }
  });
}

/**
 * 批量追踪事件
 */
export function trackBatchEvents(events: AnalyticsEvent[]): void {
  events.forEach(event => trackEvent(event));
}

/**
 * 设置自定义维度
 */
export function setCustomDimension(index: number, value: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  gtag('config', GA_MEASUREMENT_ID, {
    [`custom_parameter_${index}`]: value
  });
}

/**
 * 获取客户端 ID
 */
export function getClientId(): Promise<string> {
  return new Promise((resolve) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
      resolve('unknown');
      return;
    }

    gtag('get', GA_MEASUREMENT_ID, 'client_id', (clientId: string) => {
      resolve(clientId);
    });
  });
}

/**
 * 禁用分析追踪
 */
export function disableAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}

/**
 * 启用分析追踪
 */
export function enableAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
}

// 扩展 Window 接口
declare global {
  interface Window {
    dataLayer: any[];
    [key: string]: any;
  }
}

// 导出默认配置
export default {
  GA_MEASUREMENT_ID,
  ENVIRONMENT,
  initializeAnalytics,
  trackPageView,
  trackEvent
};
