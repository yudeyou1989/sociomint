'use client';

import { useState, Suspense } from 'react';
import { FaHammer, FaUser, FaSync } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { LoadingFallback } from '@/components/common/LazyComponents';

// 懒加载组件
const MerchantSystem = dynamic(() => import('@/components/market/MerchantSystem'), {
  loading: () => <LoadingFallback message="加载商户系统..." />,
  ssr: false
});

const TradeSystem = dynamic(() => import('@/components/market/TradeSystem'), {
  loading: () => <LoadingFallback message="加载交易系统..." />,
  ssr: false
});

const DisputeSystem = dynamic(() => import('@/components/market/DisputeSystem'), {
  loading: () => <LoadingFallback message="加载争议系统..." />,
  ssr: false
});

// 标签页类型
type TabType = 'merchant' | 'trade' | 'dispute';

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<TabType>('merchant');

  // 模拟余额数据 - 在实际应用中，这些数据应该从API获取
  const balance = {
    sm: 1250.75,
    redFlower: 350,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">交易市场</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('merchant')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'merchant' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              👤
              <span>商人系统</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'trade' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              🔄
              <span>交易市场</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dispute')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'dispute' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              🔨
              <span>纠纷处理</span>
            </div>
          </button>
        </div>
      </div>

      {/* 用户余额信息 */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div className="text-lg">
          您的余额:{' '}
          <span className="text-primary font-bold">
            {balance.sm.toFixed(2)} SM
          </span>
          <span className="mx-2">|</span>
          <span className="text-red-400 font-bold">
            {balance.redFlower} 小红花
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-2 md:mt-0">
          小红花和SM代币可通过商人系统进行交易
        </div>
      </div>

      <div className="mb-8">
        {activeTab === 'merchant' && <MerchantSystem />}
        {activeTab === 'trade' && <TradeSystem />}
        {activeTab === 'dispute' && <DisputeSystem />}
      </div>
    </div>
  );
}
