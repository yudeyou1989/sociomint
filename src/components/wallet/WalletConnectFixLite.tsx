'use client';

import { useEffect } from 'react';

/**
 * WalletConnect 轻量级修复组件
 * 只在需要时进行最小化的样式修复，避免性能问题
 */
const WalletConnectFixLite = () => {
  useEffect(() => {
    // 只设置CSS变量，不进行DOM监听
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

    // 添加一次性样式，不进行持续监听
    const style = document.createElement('style');
    style.id = 'walletconnect-fix-lite';
    style.textContent = `
      /* WalletConnect 模态框基础样式 */
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
    
    // 检查是否已经添加过样式
    const existingStyle = document.getElementById('walletconnect-fix-lite');
    if (!existingStyle) {
      document.head.appendChild(style);
    }

    return () => {
      // 清理时移除样式
      const styleElement = document.getElementById('walletconnect-fix-lite');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // 这个组件不渲染任何可见内容
  return null;
};

export default WalletConnectFixLite;
