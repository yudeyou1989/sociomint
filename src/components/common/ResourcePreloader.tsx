'use client';

import { useEffect } from 'react';

// 关键资源预加载
const criticalResources = [
  // 钱包图标
  '/images/wallets/metamask.svg',
  '/images/wallets/coinbase.svg',
  '/images/wallets/walletconnect.svg',
  '/images/wallets/generic.svg',
  
  // 其他关键图标
  '/favicon.ico',
  '/next.svg',
  '/file.svg',
  '/globe.svg',
  '/window.svg',
];

// 预加载关键路由
const criticalRoutes = [
  '/tasks',
  '/exchange',
  '/market',
  '/profile',
];

// 预加载关键组件
const criticalComponents = [
  () => import('@/components/wallet/WalletSelectModal'),
  () => import('@/components/tasks/TaskCard'),
  () => import('@/UserBalanceDisplay'),
];

interface ResourcePreloaderProps {
  preloadImages?: boolean;
  preloadRoutes?: boolean;
  preloadComponents?: boolean;
}

export default function ResourcePreloader({
  preloadImages = true,
  preloadRoutes = true,
  preloadComponents = true,
}: ResourcePreloaderProps) {
  
  useEffect(() => {
    // 只在浏览器环境中执行
    if (typeof window === 'undefined') return;

    // 使用 requestIdleCallback 在空闲时预加载
    const preloadWhenIdle = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
    };

    // 预加载图片
    if (preloadImages) {
      preloadWhenIdle(() => {
        criticalResources.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          document.head.appendChild(link);
        });
      });
    }

    // 预加载路由
    if (preloadRoutes) {
      preloadWhenIdle(() => {
        criticalRoutes.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
        });
      });
    }

    // 预加载组件
    if (preloadComponents) {
      preloadWhenIdle(() => {
        criticalComponents.forEach(importFunc => {
          importFunc().catch(() => {
            // 静默处理预加载失败
          });
        });
      });
    }

    // 预加载字体
    preloadWhenIdle(() => {
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      fontLink.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
      document.head.appendChild(fontLink);
    });

  }, [preloadImages, preloadRoutes, preloadComponents]);

  return null; // 这个组件不渲染任何内容
}

// 高级预加载钩子
export function useResourcePreloader() {
  const preloadImage = (src: string) => {
    if (typeof window === 'undefined') return;
    
    const img = new Image();
    img.src = src;
  };

  const preloadRoute = (href: string) => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  };

  const preloadComponent = (importFunc: () => Promise<any>) => {
    if (typeof window === 'undefined') return;
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunc().catch(() => {
          // 静默处理预加载失败
        });
      });
    } else {
      setTimeout(() => {
        importFunc().catch(() => {
          // 静默处理预加载失败
        });
      }, 100);
    }
  };

  return {
    preloadImage,
    preloadRoute,
    preloadComponent,
  };
}

// 智能预加载：基于用户行为预测
export function useSmartPreloader() {
  const { preloadRoute, preloadComponent } = useResourcePreloader();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 监听鼠标悬停事件，预加载链接
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.startsWith(window.location.origin)) {
        const href = new URL(link.href).pathname;
        preloadRoute(href);
      }
    };

    // 监听滚动事件，预加载即将进入视口的内容
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrollPosition / documentHeight;

      // 当滚动到50%时，预加载更多组件
      if (scrollPercentage > 0.5) {
        preloadComponent(() => import('@/TransactionHistory'));
        preloadComponent(() => import('@/TokenExchange'));
      }

      // 当滚动到80%时，预加载底部相关组件
      if (scrollPercentage > 0.8) {
        preloadComponent(() => import('@/components/social/SocialTaskList'));
        preloadComponent(() => import('@/components/airdrop/AirdropPoolList'));
      }
    };

    // 添加事件监听器
    document.addEventListener('mouseenter', handleMouseEnter, true);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 清理函数
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [preloadRoute, preloadComponent]);

  return null;
}

// 网络感知预加载
export function useNetworkAwarePreloader() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    
    // 只在快速网络连接时进行预加载
    if (connection && (connection.effectiveType === '4g' || connection.downlink > 1.5)) {
      // 预加载更多资源
      criticalComponents.forEach(importFunc => {
        setTimeout(() => {
          importFunc().catch(() => {
            // 静默处理预加载失败
          });
        }, Math.random() * 2000); // 随机延迟，避免同时加载
      });
    }
  }, []);

  return null;
}
