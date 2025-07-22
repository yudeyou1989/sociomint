// Google Analytics 4 配置
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// 检查是否启用了 GA
export const isGAEnabled = !!GA_TRACKING_ID && process.env.NODE_ENV === 'production';

// 页面浏览事件
export const pageview = (url: string) => {
  if (!isGAEnabled) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_location: url,
  });
};

// 自定义事件
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!isGAEnabled) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Web3 相关事件
export const trackWalletConnection = (walletType: string) => {
  event({
    action: 'wallet_connect',
    category: 'web3',
    label: walletType,
  });
};

export const trackTokenExchange = (amount: number, direction: 'buy' | 'sell') => {
  event({
    action: 'token_exchange',
    category: 'web3',
    label: direction,
    value: amount,
  });
};

export const trackTaskCompletion = (taskType: string) => {
  event({
    action: 'task_complete',
    category: 'social',
    label: taskType,
  });
};

export const trackSocialBinding = (platform: string) => {
  event({
    action: 'social_bind',
    category: 'social',
    label: platform,
  });
};

// 错误追踪
export const trackError = (error: string, location: string) => {
  event({
    action: 'error',
    category: 'error',
    label: `${location}: ${error}`,
  });
};

// 性能追踪
export const trackPerformance = (metric: string, value: number) => {
  event({
    action: 'performance',
    category: 'performance',
    label: metric,
    value: Math.round(value),
  });
};
