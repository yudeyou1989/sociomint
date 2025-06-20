'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers, isAddress } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import ErrorBoundary from '@/components/ErrorBoundary';
import Logger from '@/services/logger';
import MultisigService, { 
  MultisigTransaction, 
  MultisigTransactionType,
  MultisigTransactionStatus
} from '@/services/multisigService';

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'MultisigPage' });

// 管理员地址列表 - 应该与多签钱包的所有者一致
const ADMIN_ADDRESSES: string[] = [];

/**
 * 多签钱包管理页面
 */
export default function MultisigPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<MultisigTransaction[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  
  const [transactionType, setTransactionType] = useState<string>('all');
  const [transactionStatus, setTransactionStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 新交易表单状态
  const [newTxDestination, setNewTxDestination] = useState<string>('');
  const [newTxValue, setNewTxValue] = useState<string>('0');
  const [newTxData, setNewTxData] = useState<string>('0x');
  const [newTxType, setNewTxType] = useState<MultisigTransactionType>(MultisigTransactionType.TRANSFER_FUNDS);
  const [newTxDescription, setNewTxDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 检查是否为管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (isConnected && address && publicClient) {
        try {
          // 获取多签钱包信息
          const info = await MultisigService.getMultisigInfo(publicClient);
          setWalletInfo(info);
          
          // 更新所有者列表
          setOwners(info.owners);
          
          // 检查当前用户是否是所有者
          const isOwner = info.owners.some(
            (owner: string) => owner.toLowerCase() === address.toLowerCase()
          );
          
          setIsAdmin(isOwner);
          
          if (!isOwner) {
            logger.warn('未授权访问多签钱包管理页面', {
              action: 'checkAdmin',
              additionalData: { address },
            });
            router.push('/');
          } else {
            logger.info('管理员已登录多签钱包管理页面', {
              action: 'checkAdmin',
              additionalData: { address },
            });
            
            // 加载交易
            loadTransactions();
          }
        } catch (error) {
          logger.error('获取多签钱包信息失败', {
            action: 'checkAdmin',
            additionalData: { error },
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        router.push('/');
      }
    };
    
    checkAdmin();
  }, [isConnected, address, publicClient, router]);
  
  // 加载交易
  const loadTransactions = async () => {
    try {
      if (!publicClient) return;

      const txs = await MultisigService.getAllTransactions(publicClient);
      setTransactions(txs);
      
      logger.info('多签钱包交易加载成功', {
        action: 'loadTransactions',
        additionalData: { count: txs.length },
      });
    } catch (error) {
      logger.error('加载多签钱包交易失败', {
        action: 'loadTransactions',
        additionalData: { error },
      });
    }
  };
  
  // 提交新交易
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletClient) {
      logger.error('未找到钱包客户端', {
        action: 'handleSubmitTransaction',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 验证输入
      if (!isAddress(newTxDestination)) {
        throw new Error('无效的目标地址');
      }
      
      if (parseFloat(newTxValue) < 0) {
        throw new Error('金额不能为负数');
      }
      
      // 提交交易
      const txId = await MultisigService.submitTransaction(
        walletClient,
        newTxDestination,
        newTxValue,
        newTxData,
        newTxType,
        newTxDescription
      );
      
      logger.info('交易提交成功', {
        action: 'handleSubmitTransaction',
        additionalData: { txId, destination: newTxDestination, value: newTxValue },
      });
      
      // 重置表单
      setNewTxDestination('');
      setNewTxValue('0');
      setNewTxData('0x');
      setNewTxType(MultisigTransactionType.TRANSFER_FUNDS);
      setNewTxDescription('');
      
      // 重新加载交易
      loadTransactions();
    } catch (error) {
      logger.error('提交交易失败', {
        action: 'handleSubmitTransaction',
        additionalData: { error },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 确认交易
  const handleConfirmTransaction = async (txId: number) => {
    if (!walletClient) return;

    try {
      await MultisigService.confirmTransaction(walletClient, txId);
      loadTransactions();
    } catch (error) {
      logger.error('确认交易失败', {
        action: 'handleConfirmTransaction',
        additionalData: { error, txId },
      });
    }
  };

  // 撤销确认
  const handleRevokeConfirmation = async (txId: number) => {
    if (!walletClient) return;

    try {
      await MultisigService.revokeConfirmation(walletClient, txId);
      loadTransactions();
    } catch (error) {
      logger.error('撤销确认失败', {
        action: 'handleRevokeConfirmation',
        additionalData: { error, txId },
      });
    }
  };

  // 执行交易
  const handleExecuteTransaction = async (txId: number) => {
    if (!walletClient) return;

    try {
      await MultisigService.executeTransaction(walletClient, txId);
      loadTransactions();
    } catch (error) {
      logger.error('执行交易失败', {
        action: 'handleExecuteTransaction',
        additionalData: { error, txId },
      });
    }
  };
  
  // 过滤交易
  const filteredTransactions = transactions.filter((tx) => {
    // 过滤交易类型
    if (transactionType !== 'all' && tx.type !== transactionType) {
      return false;
    }
    
    // 过滤交易状态
    if (transactionStatus !== 'all' && tx.status !== transactionStatus) {
      return false;
    }
    
    // 搜索查询
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.destination.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query) ||
        tx.id.toString().includes(query)
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
    <ErrorBoundary componentName="MultisigPage">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">多签钱包管理</h1>
        
        {walletInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>钱包余额</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{walletInfo.balance} BNB</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>所需确认数</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{walletInfo.requiredConfirmations} / {walletInfo.owners.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>交易数量</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{walletInfo.transactionCount}</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              placeholder="搜索交易..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="交易类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value={MultisigTransactionType.TRANSFER_FUNDS}>资金转移</SelectItem>
                <SelectItem value={MultisigTransactionType.UPGRADE_CONTRACT}>合约升级</SelectItem>
                <SelectItem value={MultisigTransactionType.CHANGE_PARAMETER}>参数变更</SelectItem>
                <SelectItem value={MultisigTransactionType.ADD_OWNER}>添加所有者</SelectItem>
                <SelectItem value={MultisigTransactionType.REMOVE_OWNER}>移除所有者</SelectItem>
                <SelectItem value={MultisigTransactionType.CHANGE_REQUIREMENT}>变更确认数</SelectItem>
                <SelectItem value={MultisigTransactionType.OTHER}>其他</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={transactionStatus} onValueChange={setTransactionStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="交易状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value={MultisigTransactionStatus.PENDING}>待确认</SelectItem>
                <SelectItem value={MultisigTransactionStatus.CONFIRMED}>已确认</SelectItem>
                <SelectItem value={MultisigTransactionStatus.EXECUTED}>已执行</SelectItem>
                <SelectItem value={MultisigTransactionStatus.FAILED}>执行失败</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={loadTransactions}>刷新</Button>
          </div>
        </div>
        
        <Tabs defaultValue="transactions">
          <TabsList className="mb-4">
            <TabsTrigger value="transactions">交易列表</TabsTrigger>
            <TabsTrigger value="new-transaction">新建交易</TabsTrigger>
            <TabsTrigger value="owners">所有者管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>交易列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">类型</th>
                        <th className="p-2 text-left">目标地址</th>
                        <th className="p-2 text-left">金额 (BNB)</th>
                        <th className="p-2 text-left">确认数</th>
                        <th className="p-2 text-left">状态</th>
                        <th className="p-2 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{tx.id}</td>
                          <td className="p-2">
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-2">
                            <a
                              href={`https://testnet.bscscan.com/address/${tx.destination}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {tx.destination.substring(0, 6)}...{tx.destination.substring(38)}
                            </a>
                          </td>
                          <td className="p-2">{tx.value}</td>
                          <td className="p-2">{tx.confirmations} / {tx.requiredConfirmations}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              tx.status === MultisigTransactionStatus.EXECUTED ? 'bg-green-100 text-green-800' :
                              tx.status === MultisigTransactionStatus.CONFIRMED ? 'bg-yellow-100 text-yellow-800' :
                              tx.status === MultisigTransactionStatus.PENDING ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              {tx.status === MultisigTransactionStatus.PENDING && (
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmTransaction(tx.id)}
                                >
                                  确认
                                </Button>
                              )}
                              
                              {tx.status === MultisigTransactionStatus.CONFIRMED && !tx.executed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExecuteTransaction(tx.id)}
                                >
                                  执行
                                </Button>
                              )}
                              
                              {/* 添加更多操作按钮 */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="new-transaction">
            <Card>
              <CardHeader>
                <CardTitle>创建新交易</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">交易类型</label>
                    <Select 
                      value={newTxType} 
                      onValueChange={(value) => setNewTxType(value as MultisigTransactionType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择交易类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MultisigTransactionType.TRANSFER_FUNDS}>资金转移</SelectItem>
                        <SelectItem value={MultisigTransactionType.UPGRADE_CONTRACT}>合约升级</SelectItem>
                        <SelectItem value={MultisigTransactionType.CHANGE_PARAMETER}>参数变更</SelectItem>
                        <SelectItem value={MultisigTransactionType.ADD_OWNER}>添加所有者</SelectItem>
                        <SelectItem value={MultisigTransactionType.REMOVE_OWNER}>移除所有者</SelectItem>
                        <SelectItem value={MultisigTransactionType.CHANGE_REQUIREMENT}>变更确认数</SelectItem>
                        <SelectItem value={MultisigTransactionType.OTHER}>其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">目标地址</label>
                    <Input
                      value={newTxDestination}
                      onChange={(e) => setNewTxDestination(e.target.value)}
                      placeholder="0x..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">金额 (BNB)</label>
                    <Input
                      type="number"
                      step="0.000000000000000001"
                      min="0"
                      value={newTxValue}
                      onChange={(e) => setNewTxValue(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">数据</label>
                    <Input
                      value={newTxData}
                      onChange={(e) => setNewTxData(e.target.value)}
                      placeholder="0x"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <Input
                      value={newTxDescription}
                      onChange={(e) => setNewTxDescription(e.target.value)}
                      placeholder="交易描述..."
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '提交中...' : '提交交易'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="owners">
            <Card>
              <CardHeader>
                <CardTitle>所有者列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">地址</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owners.map((owner, index) => (
                        <tr key={owner} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <a
                              href={`https://testnet.bscscan.com/address/${owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {owner}
                            </a>
                            {owner.toLowerCase() === address?.toLowerCase() && (
                              <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                当前用户
                              </span>
                            )}
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
