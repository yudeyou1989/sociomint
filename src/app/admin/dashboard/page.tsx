'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import ErrorBoundary from '@/components/ErrorBoundary';
import Logger from '@/services/logger';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'AdminDashboard' });

// 管理员地址列表
const ADMIN_ADDRESSES = [
  '0xd7d7dd989642222B6f685aF0220dc0065F489ae0', // 示例地址，请替换为实际管理员地址
];

// 日志类型
interface LogEntry {
  id: string;
  created_at: string;
  level: string;
  message: string;
  context: any;
  environment: string;
}

// 事件类型
interface EventEntry {
  id: string;
  created_at: string;
  event_type: string;
  transaction_hash: string;
  block_number: number;
  contract_address: string;
  event_name: string;
  event_data: any;
}

// 错误类型
interface ErrorEntry {
  id: string;
  created_at: string;
  message: string;
  severity: string;
  context: any;
  error_id: string;
}

/**
 * 管理员仪表板页面
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  
  const [logLevel, setLogLevel] = useState<string>('all');
  const [eventType, setEventType] = useState<string>('all');
  const [errorSeverity, setErrorSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 检查是否为管理员
  useEffect(() => {
    if (isConnected && address) {
      const isAdminAddress = ADMIN_ADDRESSES.some(
        (adminAddress) => adminAddress.toLowerCase() === address.toLowerCase()
      );
      
      setIsAdmin(isAdminAddress);
      setIsLoading(false);
      
      if (!isAdminAddress) {
        logger.warn('Unauthorized access attempt to admin dashboard', {
          action: 'checkAdmin',
          additionalData: { address },
        });
        router.push('/');
      } else {
        logger.info('Admin logged in to dashboard', {
          action: 'checkAdmin',
          additionalData: { address },
        });
        
        // 加载数据
        loadData();
      }
    } else {
      setIsLoading(false);
      router.push('/');
    }
  }, [isConnected, address, router]);
  
  // 加载数据
  const loadData = async () => {
    try {
      // 加载日志
      const { data: logData, error: logError } = await supabase
        .from('application_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (logError) throw logError;
      setLogs(logData || []);
      
      // 加载事件
      const { data: eventData, error: eventError } = await supabase
        .from('blockchain_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (eventError) throw eventError;
      setEvents(eventData || []);
      
      // 加载错误
      const { data: errorData, error: errorError } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (errorError) throw errorError;
      setErrors(errorData || []);
      
      logger.info('Dashboard data loaded successfully', {
        action: 'loadData',
        additionalData: {
          logCount: logData?.length || 0,
          eventCount: eventData?.length || 0,
          errorCount: errorData?.length || 0,
        },
      });
    } catch (error) {
      logger.error('Failed to load dashboard data', {
        action: 'loadData',
        additionalData: { error },
      });
    }
  };
  
  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    // 过滤日志级别
    if (logLevel !== 'all' && log.level !== logLevel) {
      return false;
    }
    
    // 搜索查询
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.context).toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // 过滤事件
  const filteredEvents = events.filter((event) => {
    // 过滤事件类型
    if (eventType !== 'all' && event.event_type !== eventType) {
      return false;
    }
    
    // 搜索查询
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.event_name.toLowerCase().includes(query) ||
        event.transaction_hash.toLowerCase().includes(query) ||
        JSON.stringify(event.event_data).toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // 过滤错误
  const filteredErrors = errors.filter((error) => {
    // 过滤错误严重性
    if (errorSeverity !== 'all' && error.severity !== errorSeverity) {
      return false;
    }
    
    // 搜索查询
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        error.message.toLowerCase().includes(query) ||
        error.error_id.toLowerCase().includes(query) ||
        JSON.stringify(error.context).toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // 如果正在加载或不是管理员，显示加载中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  // 如果不是管理员，不显示内容（已经重定向）
  if (!isAdmin) {
    return null;
  }
  
  return (
    <ErrorBoundary componentName="AdminDashboard">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">管理员仪表板</h1>
        
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={loadData}>刷新数据</Button>
          </div>
        </div>
        
        <Tabs defaultValue="logs">
          <TabsList className="mb-4">
            <TabsTrigger value="logs">应用日志</TabsTrigger>
            <TabsTrigger value="events">区块链事件</TabsTrigger>
            <TabsTrigger value="errors">错误报告</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>应用日志</span>
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="日志级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="debug">调试</SelectItem>
                      <SelectItem value="info">信息</SelectItem>
                      <SelectItem value="warn">警告</SelectItem>
                      <SelectItem value="error">错误</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">时间</th>
                        <th className="p-2 text-left">级别</th>
                        <th className="p-2 text-left">消息</th>
                        <th className="p-2 text-left">上下文</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              log.level === 'error' ? 'bg-red-100 text-red-800' :
                              log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                              log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2">{log.message}</td>
                          <td className="p-2">
                            <pre className="text-xs overflow-auto max-w-xs">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="events">
            {/* 区块链事件内容 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>区块链事件</span>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="事件类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="token_transfer">代币转账</SelectItem>
                      <SelectItem value="token_mint">代币铸造</SelectItem>
                      <SelectItem value="token_burn">代币销毁</SelectItem>
                      <SelectItem value="exchange_purchase">代币购买</SelectItem>
                      <SelectItem value="exchange_round_change">轮次变更</SelectItem>
                      <SelectItem value="exchange_config_change">配置变更</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">时间</th>
                        <th className="p-2 text-left">事件类型</th>
                        <th className="p-2 text-left">事件名称</th>
                        <th className="p-2 text-left">交易哈希</th>
                        <th className="p-2 text-left">数据</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{new Date(event.created_at).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.event_type.includes('token') ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {event.event_type}
                            </span>
                          </td>
                          <td className="p-2">{event.event_name}</td>
                          <td className="p-2">
                            <a
                              href={`https://testnet.bscscan.com/tx/${event.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {event.transaction_hash.substring(0, 10)}...
                            </a>
                          </td>
                          <td className="p-2">
                            <pre className="text-xs overflow-auto max-w-xs">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="errors">
            {/* 错误报告内容 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>错误报告</span>
                  <Select value={errorSeverity} onValueChange={setErrorSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="严重性" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="critical">严重</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">时间</th>
                        <th className="p-2 text-left">严重性</th>
                        <th className="p-2 text-left">错误ID</th>
                        <th className="p-2 text-left">消息</th>
                        <th className="p-2 text-left">上下文</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredErrors.map((error) => (
                        <tr key={error.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{new Date(error.created_at).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {error.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2">{error.error_id}</td>
                          <td className="p-2">{error.message}</td>
                          <td className="p-2">
                            <pre className="text-xs overflow-auto max-w-xs">
                              {JSON.stringify(error.context, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
