'use client';

import { useState, useEffect } from 'react';
import { checkSupabaseConnection, testSupabaseQuery } from '@/lib/supabaseUtils';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseDebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; error?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableName, setTableName] = useState('treasure_boxes');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [tablesList, setTablesList] = useState<string[]>([]);

  // 检查连接状态
  useEffect(() => {
    async function checkConnection() {
      setIsLoading(true);
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
      setIsLoading(false);
    }

    checkConnection();
  }, []);

  // 执行测试查询
  const handleTestQuery = async () => {
    setIsLoading(true);
    setQueryResult(null);
    const result = await testSupabaseQuery(tableName);
    setQueryResult(result);
    setIsLoading(false);
  };

  // 获取表列表
  const fetchTablesList = async () => {
    try {
      // 注意: 这需要数据库级别权限，普通用户无法执行
      const { data, error } = await supabase.rpc('get_tables');
      
      if (error) {
        console.error('获取表列表失败:', error);
        return;
      }
      
      if (data) {
        setTablesList(data);
      }
    } catch (error) {
      console.error('获取表列表异常:', error);
    }
  };

  // 尝试几个常用表名
  const commonTables = [
    'treasure_boxes',
    'box_rewards',
    'tasks',
    'users',
    'profiles',
    'transactions',
    'wallet_connections',
    'social_connections'
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supabase 连接调试</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">连接状态</h2>
        
        {isLoading && <p className="text-gray-400">检查中...</p>}
        
        {!isLoading && connectionStatus && (
          <div className={`p-4 rounded-md ${connectionStatus.connected ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <p className="font-medium">
              状态: {connectionStatus.connected ? '已连接' : '连接失败'}
            </p>
            {connectionStatus.error && (
              <p className="mt-2 text-red-400">错误: {connectionStatus.error}</p>
            )}
            <p className="mt-2 text-gray-300">
              项目URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置'}
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">测试查询</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">表名</label>
            <input
              type="text"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">常用表</label>
            <div className="flex flex-wrap gap-2">
              {commonTables.map(table => (
                <button
                  key={table}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-md"
                  onClick={() => setTableName(table)}
                >
                  {table}
                </button>
              ))}
            </div>
          </div>
          
          <button
            className="w-full py-2 bg-primary hover:bg-blue-600 rounded-md transition-colors"
            onClick={handleTestQuery}
            disabled={isLoading}
          >
            执行查询
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">查询结果</h2>
          
          {isLoading && <p className="text-gray-400">查询中...</p>}
          
          {!isLoading && queryResult && (
            <div>
              <p className="font-medium mb-2">
                状态: {queryResult.success ? '成功' : '失败'}
              </p>
              
              {queryResult.error && (
                <p className="mb-4 text-red-400">错误: {queryResult.error}</p>
              )}
              
              {queryResult.success && (
                <>
                  <p className="mb-2 text-gray-300">记录总数: {queryResult.count || 0}</p>
                  
                  {queryResult.data && queryResult.data.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">样本数据 (第一条记录):</p>
                      <pre className="bg-gray-900 p-3 rounded-md overflow-x-auto text-sm">
                        {JSON.stringify(queryResult.data[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-400">
        <p>如果连接失败，请检查以下内容:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>环境变量是否正确设置 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)</li>
          <li>网络连接是否正常</li>
          <li>Supabase项目是否运行正常</li>
          <li>表名是否正确</li>
          <li>RLS策略是否允许访问</li>
        </ul>
      </div>
    </div>
  );
} 