'use client';

import { useEffect } from 'react';

/**
 * WalletConnect 显示修复组件
 * 解决WalletConnect模态框显示不完整的问题
 */
const WalletConnectFix = () => {
  useEffect(() => {
    // 修复WalletConnect模态框样式（优化版本）
    const fixWalletConnectModal = () => {
      // 使用更高效的单一查询
      const allWalletElements = document.querySelectorAll('wcm-modal, w3m-modal, [data-w3m-modal], .wcm-modal, .w3m-modal');

      if (allWalletElements.length === 0) return; // 如果没有找到元素，直接返回

      allWalletElements.forEach((modal: Element) => {
        const htmlModal = modal as HTMLElement;

        // 批量设置样式，减少重排
        Object.assign(htmlModal.style, {
          zIndex: '99999999',
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        });
      });

      // 修复模态框容器（优化版本）
      const containers = document.querySelectorAll('wcm-modal-container, w3m-modal-container, .wcm-modal-container, .w3m-modal-container');
      containers.forEach((container: Element) => {
        const htmlContainer = container as HTMLElement;

        Object.assign(htmlContainer.style, {
          maxHeight: '90vh',
          maxWidth: '400px',
          width: '100%',
          margin: 'auto',
          overflow: 'auto',
          background: '#1a1a1a',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(13, 229, 255, 0.2)'
        });
      });

      // 修复模态框内容（优化版本）
      const contents = document.querySelectorAll('wcm-modal-content, w3m-modal-content, .wcm-modal-content, .w3m-modal-content');
      contents.forEach((content: Element) => {
        const htmlContent = content as HTMLElement;

        Object.assign(htmlContent.style, {
          padding: '20px',
          color: '#ffffff',
          fontFamily: '"Inter", system-ui, sans-serif'
        });
      });
    };

    // 立即执行一次修复
    fixWalletConnectModal();

    // 使用防抖的MutationObserver监听DOM变化
    let fixTimeout: NodeJS.Timeout | null = null;

    const debouncedFix = () => {
      if (fixTimeout) {
        clearTimeout(fixTimeout);
      }
      fixTimeout = setTimeout(fixWalletConnectModal, 300);
    };

    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;

      // 限制检查频率，避免过度处理
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 只检查直接添加的节点，不深度遍历
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const tagName = element.tagName?.toLowerCase() || '';
              const className = element.className || '';

              // 简化检查逻辑，只检查关键标识
              if (
                tagName.startsWith('wcm') ||
                tagName.startsWith('w3m') ||
                className.includes('wcm') ||
                className.includes('w3m') ||
                element.hasAttribute('data-w3m-modal')
              ) {
                shouldFix = true;
                break;
              }
            }
          }
          if (shouldFix) break;
        }
      }

      if (shouldFix) {
        debouncedFix();
      }
    });

    // 开始观察，减少观察范围和频率
    observer.observe(document.body, {
      childList: true,
      subtree: false, // 不深度观察，减少性能消耗
      attributes: false, // 不观察属性变化
    });

    // 减少定期检查频率（作为备用方案）
    const intervalId = setInterval(fixWalletConnectModal, 5000); // 从1秒改为5秒

    // 监听窗口大小变化
    const handleResize = () => {
      setTimeout(fixWalletConnectModal, 100);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      if (fixTimeout) {
        clearTimeout(fixTimeout);
      }
    };
  }, []);

  useEffect(() => {
    // 添加全局CSS变量
    const root = document.documentElement;
    
    // 设置WalletConnect相关的CSS变量
    root.style.setProperty('--wcm-z-index', '99999999');
    root.style.setProperty('--wcm-accent-color', '#0de5ff');
    root.style.setProperty('--wcm-background-color', '#1a1a1a');
    root.style.setProperty('--wcm-text-color', '#ffffff');
    root.style.setProperty('--wcm-font-family', '"Inter", system-ui, sans-serif');
    root.style.setProperty('--wcm-border-radius-master', '12px');
    
    root.style.setProperty('--w3m-z-index', '99999999');
    root.style.setProperty('--w3m-accent-color', '#0de5ff');
    root.style.setProperty('--w3m-background-color', '#1a1a1a');
    root.style.setProperty('--w3m-text-color', '#ffffff');
    root.style.setProperty('--w3m-font-family', '"Inter", system-ui, sans-serif');
    root.style.setProperty('--w3m-border-radius-master', '12px');

    // 添加动态样式
    const style = document.createElement('style');
    style.textContent = `
      /* WalletConnect 模态框强制样式 */
      wcm-modal,
      w3m-modal,
      [data-w3m-modal] {
        z-index: 99999999 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0, 0, 0, 0.8) !important;
        backdrop-filter: blur(4px) !important;
      }
      
      wcm-modal-container,
      w3m-modal-container {
        max-height: 90vh !important;
        max-width: 400px !important;
        width: 100% !important;
        margin: auto !important;
        overflow: auto !important;
        background: #1a1a1a !important;
        border-radius: 12px !important;
        box-shadow: 0 0 20px rgba(13, 229, 255, 0.2) !important;
      }
      
      wcm-modal-content,
      w3m-modal-content {
        padding: 20px !important;
        color: #ffffff !important;
        font-family: "Inter", system-ui, sans-serif !important;
      }
      
      /* 移动设备优化 */
      @media (max-width: 768px) {
        wcm-modal-container,
        w3m-modal-container {
          max-width: 90vw !important;
          max-height: 80vh !important;
        }
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 这个组件不渲染任何可见内容
  return null;
};

export default WalletConnectFix;
