'use client';

import { useEffect, useState } from 'react';

export default function AssetsContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">我的资产</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">SM代币</h3>
          <p className="text-2xl font-bold text-yellow-400">0 SM</p>
          <p className="text-sm text-gray-400">≈ $0.00</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">BNB余额</h3>
          <p className="text-2xl font-bold text-yellow-400">0 BNB</p>
          <p className="text-sm text-gray-400">≈ $0.00</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">红花数量</h3>
          <p className="text-2xl font-bold text-red-400">0 🌹</p>
          <p className="text-sm text-gray-400">社交奖励</p>
        </div>
      </div>
      
      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
        <p className="text-blue-300 text-sm">
          💡 提示：请先连接钱包以查看您的真实资产
        </p>
      </div>
    </div>
  );
}
