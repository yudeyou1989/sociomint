'use client';

import { useEffect, useState } from 'react';

export default function TasksContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">社交任务</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Twitter任务</h3>
          <p className="text-gray-400 mb-4">关注、点赞、转发获得奖励</p>
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-center">
            即将开放
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Telegram任务</h3>
          <p className="text-gray-400 mb-4">加入群组、分享内容获得奖励</p>
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-center">
            即将开放
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Discord任务</h3>
          <p className="text-gray-400 mb-4">参与社区讨论获得奖励</p>
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-center">
            即将开放
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
        <p className="text-yellow-300 text-sm">
          💡 提示：连接钱包后可以参与社交任务并获得红花奖励
        </p>
      </div>
    </div>
  );
}
