'use client';

import { useEffect, useState } from 'react';

export default function ExchangeContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">代币交换</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">SM代币交换</h2>
        <p className="text-gray-400 mb-6">使用BNB购买SM代币，或将SM代币兑换为BNB</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded p-4">
            <h3 className="font-medium mb-4">购买SM代币</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">BNB数量</label>
                <input 
                  type="number" 
                  placeholder="0.0"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">将获得SM代币</label>
                <input 
                  type="text" 
                  placeholder="0"
                  readOnly
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-300"
                />
              </div>
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded transition-colors">
                购买SM代币
              </button>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded p-4">
            <h3 className="font-medium mb-4">出售SM代币</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">SM代币数量</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">将获得BNB</label>
                <input 
                  type="text" 
                  placeholder="0.0"
                  readOnly
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-300"
                />
              </div>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
                出售SM代币
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded p-4">
          <p className="text-blue-300 text-sm">
            💡 提示：请先连接钱包以使用交换功能
          </p>
        </div>
      </div>
    </div>
  );
}
