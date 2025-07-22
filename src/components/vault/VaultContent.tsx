'use client';

import { useEffect, useState } from 'react';

export default function VaultContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">质押金库</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">质押统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">725,000</p>
            <p className="text-sm text-gray-400">总锁定价值 (TVL)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">15.5%</p>
            <p className="text-sm text-gray-400">平均年化收益</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">1,250</p>
            <p className="text-sm text-gray-400">质押用户数</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">质押SM代币</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">质押数量</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">质押期限</label>
              <select className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white">
                <option value="flexible">活期 (8% APY)</option>
                <option value="30days">30天 (12% APY)</option>
                <option value="90days">90天 (17.5% APY)</option>
                <option value="180days">180天 (20% APY)</option>
              </select>
            </div>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors">
              开始质押
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">我的质押</h3>
          <div className="text-center py-8">
            <p className="text-gray-400">暂无质押记录</p>
            <p className="text-sm text-gray-500 mt-2">连接钱包后开始质押</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded p-4">
        <p className="text-purple-300 text-sm">
          💡 提示：质押SM代币可以获得稳定的收益，期限越长收益越高
        </p>
      </div>
    </div>
  );
}
