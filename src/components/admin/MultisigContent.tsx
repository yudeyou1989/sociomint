'use client';

import { useEffect, useState } from 'react';

export default function MultisigContent() {
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
      <h1 className="text-3xl font-bold mb-8">多签钱包管理</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">多签功能</h2>
        <p className="text-gray-400">多签钱包管理功能开发中...</p>
        
        <div className="mt-6 space-y-4">
          <div className="bg-gray-700 rounded p-4">
            <h3 className="font-medium mb-2">功能列表</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 创建多签交易</li>
              <li>• 签名确认</li>
              <li>• 执行交易</li>
              <li>• 交易历史</li>
            </ul>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
            <p className="text-blue-300 text-sm">
              💡 提示：此功能需要连接钱包后才能使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
