'use client';

import { ReactNode, useEffect } from 'react';
import BlockchainMonitor from '@/services/blockchainMonitor';
import Logger from '@/services/logger';

interface BlockchainMonitorProviderProps {
  children: ReactNode;
  enableMonitoring?: boolean;
}

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'BlockchainMonitorProvider' });

/**
 * 区块链监控提供者组件
 * 
 * 初始化区块链事件监控并提供监控上下文
 */
const BlockchainMonitorProvider = ({ 
  children, 
  enableMonitoring = true 
}: BlockchainMonitorProviderProps) => {
  useEffect(() => {
    if (!enableMonitoring) {
      logger.info('Blockchain monitoring disabled');
      return;
    }

    let tokenUnwatch: (() => void) | undefined;
    let exchangeUnwatch: (() => void) | undefined;

    const setupMonitoring = async () => {
      try {
        logger.info('Setting up blockchain monitoring');
        
        // 监控代币合约事件
        tokenUnwatch = await BlockchainMonitor.monitorTokenEvents();
        
        // 监控交换合约事件
        exchangeUnwatch = await BlockchainMonitor.monitorExchangeEvents();
        
        logger.info('Blockchain monitoring initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize blockchain monitoring', {
          action: 'setupMonitoring',
          additionalData: { error },
        });
      }
    };

    setupMonitoring();

    // 清理函数
    return () => {
      logger.info('Cleaning up blockchain monitoring');
      
      if (tokenUnwatch) {
        tokenUnwatch();
      }
      
      if (exchangeUnwatch) {
        exchangeUnwatch();
      }
    };
  }, [enableMonitoring]);

  return <>{children}</>;
};

export default BlockchainMonitorProvider;
