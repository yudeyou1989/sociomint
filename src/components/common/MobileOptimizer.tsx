'use client';

import { useEffect, useState } from 'react';

// 移动端优化组件
export default function MobileOptimizer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 移动端优化设置
    if (typeof window !== 'undefined') {
      // 设置视口元标签
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');

      // 添加移动端优化样式
      const mobileStyles = document.createElement('style');
      mobileStyles.id = 'mobile-optimizer-styles';
      mobileStyles.textContent = `
        /* 移动端优化样式 */
        @media (max-width: 768px) {
          /* 防止横向滚动 */
          html, body {
            overflow-x: hidden;
            width: 100%;
          }

          /* 优化触摸目标大小 */
          button, a, input, select, textarea {
            min-height: 44px;
            min-width: 44px;
          }

          /* 优化表单输入 */
          input, textarea, select {
            font-size: 16px; /* 防止iOS缩放 */
            border-radius: 8px;
            padding: 12px;
          }

          /* 优化模态框 */
          .modal, [role="dialog"] {
            max-width: 95vw !important;
            max-height: 90vh !important;
            margin: 5vh auto !important;
          }

          /* 优化钱包连接模态框 */
          wcm-modal-container,
          w3m-modal-container {
            max-width: 95vw !important;
            max-height: 85vh !important;
            margin: 7.5vh auto !important;
          }

          /* 优化导航栏 */
          nav {
            padding: 8px 16px;
          }

          /* 优化卡片间距 */
          .card, .glass-card {
            margin: 8px;
            padding: 16px;
          }

          /* 优化按钮组 */
          .button-group {
            flex-direction: column;
            gap: 8px;
          }

          .button-group button {
            width: 100%;
          }

          /* 优化表格 */
          table {
            font-size: 14px;
          }

          th, td {
            padding: 8px 4px;
          }

          /* 优化网格布局 */
          .grid {
            grid-template-columns: 1fr !important;
            gap: 16px;
          }

          /* 优化文本大小 */
          h1 { font-size: 1.75rem; }
          h2 { font-size: 1.5rem; }
          h3 { font-size: 1.25rem; }

          /* 优化间距 */
          .container {
            padding: 16px;
          }

          /* 优化滚动 */
          .scroll-container {
            -webkit-overflow-scrolling: touch;
          }

          /* 优化加载动画 */
          .loading-spinner {
            width: 32px;
            height: 32px;
          }
        }

        /* 超小屏幕优化 */
        @media (max-width: 480px) {
          .text-4xl { font-size: 1.5rem; }
          .text-3xl { font-size: 1.25rem; }
          .text-2xl { font-size: 1.125rem; }
          
          .p-8 { padding: 1rem; }
          .p-6 { padding: 0.75rem; }
          .p-4 { padding: 0.5rem; }
          
          .gap-8 { gap: 1rem; }
          .gap-6 { gap: 0.75rem; }
          .gap-4 { gap: 0.5rem; }
        }

        /* 横屏优化 */
        @media (max-height: 500px) and (orientation: landscape) {
          .modal, [role="dialog"] {
            max-height: 95vh !important;
            overflow-y: auto;
          }
          
          nav {
            padding: 4px 16px;
          }
        }

        /* 高DPI屏幕优化 */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .icon, .logo {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        }

        /* 触摸优化 */
        @media (hover: none) and (pointer: coarse) {
          .hover\\:scale-105:hover {
            transform: none;
          }
          
          .hover\\:shadow-lg:hover {
            box-shadow: none;
          }
          
          button:active, .button:active {
            transform: scale(0.98);
            transition: transform 0.1s;
          }
        }

        /* 减少动画（用户偏好） */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* 暗色模式优化 */
        @media (prefers-color-scheme: dark) {
          :root {
            color-scheme: dark;
          }
        }
      `;

      // 检查是否已经添加过样式
      const existingStyles = document.getElementById('mobile-optimizer-styles');
      if (!existingStyles) {
        document.head.appendChild(mobileStyles);
      }

      // 移动端性能优化
      if (isMobile) {
        // 禁用某些动画以提升性能
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        
        // 优化滚动性能
        document.documentElement.style.setProperty('scroll-behavior', 'auto');
        
        // 添加触摸优化
        document.body.style.touchAction = 'manipulation';
      }

      // 处理iOS Safari的100vh问题
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);

      // 清理函数
      return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }
  }, [isMobile]);

  return null; // 这个组件不渲染任何内容
}

// 移动端检测Hook
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// 触摸优化Hook
export function useTouchOptimization() {
  useEffect(() => {
    // 防止双击缩放
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, []);
}

// 安全区域Hook（用于iPhone X等设备）
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea);

    return () => window.removeEventListener('orientationchange', updateSafeArea);
  }, []);

  return safeArea;
}
