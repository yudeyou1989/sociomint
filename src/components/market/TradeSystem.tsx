'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaStore,
  FaUpload,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
// import { Button, Card, Tabs, Table, Modal, Input, Select, Badge, Avatar, Rate, message, Space, Tag } from 'antd';
// import { SearchOutlined, FilterOutlined, UserOutlined, HistoryOutlined, SyncOutlined, ClockCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
// import './TradeSystem.css';

// 支付方式类型
type PaymentMethod = 'sm' | 'wechat' | 'alipay' | 'usdt';

// 交易类型
type TradeType = 'buy' | 'sell';

// 资产类型
type AssetType = 'redFlower' | 'smToken';

// 订单状态
type OrderStatus =
  | 'active'
  | 'processing'
  | 'completed'
  | 'canceled'
  | 'disputed';

// 订单接口
interface TradeOrder {
  id: string;
  merchantId: string;
  merchantName: string;
  type: TradeType;
  asset: AssetType;
  price: number;
  minAmount: number;
  maxAmount: number;
  availableAmount: number;
  paymentMethods: PaymentMethod[];
  tradeCount: number;
  avgCompletionTime: number;
  status: OrderStatus;
  isMedalist?: boolean;
  completionRate?: number;
  responseTime?: number;
  createdAt: Date;
}

// 交易接口
interface Transaction {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  asset: AssetType;
  amount: number;
  price: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'completed' | 'canceled' | 'disputed';
  createdAt: Date;
  updatedAt: Date;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    qrCodeUrl?: string;
  };
  paymentProofUrl?: string;
  disputeReason?: string;
}

// 模拟的订单数据
const mockOrders: TradeOrder[] = [
  {
    id: '1',
    merchantId: '0x1a2b...3c4d',
    merchantName: '币圈小王子',
    type: 'buy',
    asset: 'redFlower',
    price: 0.05,
    minAmount: 100,
    maxAmount: 10000,
    availableAmount: 5000,
    paymentMethods: ['wechat', 'alipay'],
    tradeCount: 1520,
    avgCompletionTime: 8,
    status: 'active',
    isMedalist: true,
    completionRate: 99.5,
    responseTime: 2,
    createdAt: new Date('2023-08-15'),
  },
  {
    id: '2',
    merchantId: '0x5e6f...7g8h',
    merchantName: '数字藏家',
    type: 'buy',
    asset: 'redFlower',
    price: 0.048,
    minAmount: 500,
    maxAmount: 20000,
    availableAmount: 10000,
    paymentMethods: ['alipay', 'usdt'],
    tradeCount: 324,
    avgCompletionTime: 15,
    status: 'active',
    completionRate: 98.7,
    responseTime: 1,
    createdAt: new Date('2023-09-01'),
  },
  {
    id: '3',
    merchantId: '0x9i10...11j12',
    merchantName: '区块达人',
    type: 'buy',
    asset: 'smToken',
    price: 1.2,
    minAmount: 10,
    maxAmount: 1000,
    availableAmount: 500,
    paymentMethods: ['wechat', 'alipay', 'usdt'],
    tradeCount: 967,
    avgCompletionTime: 12,
    status: 'active',
    completionRate: 95.2,
    responseTime: 5,
    createdAt: new Date('2023-08-22'),
  },
  {
    id: '4',
    merchantId: '0xab12...cd34',
    merchantName: '链上玩家',
    type: 'sell',
    asset: 'redFlower',
    price: 0.055,
    minAmount: 100,
    maxAmount: 5000,
    availableAmount: 3000,
    paymentMethods: ['wechat', 'alipay'],
    tradeCount: 732,
    avgCompletionTime: 10,
    status: 'active',
    completionRate: 99.1,
    responseTime: 3,
    createdAt: new Date('2023-09-10'),
  },
  {
    id: '5',
    merchantId: '0xef56...gh78',
    merchantName: '花花交易所',
    type: 'sell',
    asset: 'redFlower',
    price: 0.052,
    minAmount: 200,
    maxAmount: 8000,
    availableAmount: 5000,
    paymentMethods: ['alipay', 'usdt'],
    tradeCount: 2150,
    avgCompletionTime: 5,
    status: 'active',
    isMedalist: true,
    completionRate: 96.8,
    responseTime: 4,
    createdAt: new Date('2023-09-05'),
  },
  {
    id: '6',
    merchantId: '0xij90...kl12',
    merchantName: 'SM收藏家',
    type: 'sell',
    asset: 'smToken',
    price: 1.18,
    minAmount: 5,
    maxAmount: 500,
    availableAmount: 300,
    paymentMethods: ['wechat', 'alipay', 'usdt'],
    tradeCount: 456,
    avgCompletionTime: 18,
    status: 'active',
    completionRate: 99.5,
    responseTime: 2,
    createdAt: new Date('2023-08-15'),
  },
];

// 模拟交易历史
const mockTransactions: Transaction[] = [
  {
    id: 't1',
    orderId: '1',
    buyerId: 'user1',
    sellerId: 'm1',
    asset: 'redFlower',
    amount: 500,
    price: 0.05,
    totalPrice: 25,
    status: 'completed',
    createdAt: new Date('2023-09-10T08:30:00'),
    updatedAt: new Date('2023-09-10T08:45:00'),
    paymentMethod: 'wechat',
  },
  {
    id: 't2',
    orderId: '2',
    buyerId: 'user1',
    sellerId: 'm2',
    asset: 'redFlower',
    amount: 1000,
    price: 0.048,
    totalPrice: 48,
    status: 'pending',
    createdAt: new Date('2023-09-15T14:20:00'),
    updatedAt: new Date('2023-09-15T14:20:00'),
    paymentMethod: 'alipay',
  },
];

// 交易系统组件
const TradeSystem = () => {
  const { wallet, balance } = useWallet();
  const [activeTab, setActiveTab] = useState<string>('buy');
  const [activeAsset, setActiveAsset] = useState<AssetType>('redFlower');
  const [activePaymentMethods, setActivePaymentMethods] = useState<
    PaymentMethod[]
  >(['wechat', 'alipay', 'usdt', 'sm']);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TradeOrder | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [currentTransaction, setCurrentTransaction] =
    useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tradeResult, setTradeResult] = useState<'success' | 'failure' | null>(null);
  const [filteredOrders, setFilteredOrders] =
    useState<TradeOrder[]>(mockOrders);

  // 使用useEffect来更新filteredOrders
  useEffect(() => {
    // 根据筛选条件更新订单列表
    const newFilteredOrders = mockOrders.filter(
      (order) =>
        order.type === activeTab &&
        order.asset === activeAsset &&
        order.paymentMethods.some((method) =>
          activePaymentMethods.includes(method),
        ),
    );
    setFilteredOrders(newFilteredOrders);
  }, [activeTab, activeAsset, activePaymentMethods]);

  // 打开交易模态框
  const openTradeModal = (order: TradeOrder) => {
    setSelectedOrder(order);
    setTradeAmount(order.minAmount);
    setShowTradeModal(true);
  };

  // 处理交易金额变更
  const handleAmountChange = (amount: number) => {
    if (!selectedOrder) return;

    // 确保金额在范围内
    if (amount < selectedOrder.minAmount) amount = selectedOrder.minAmount;
    if (amount > selectedOrder.maxAmount) amount = selectedOrder.maxAmount;
    if (amount > selectedOrder.availableAmount)
      amount = selectedOrder.availableAmount;

    setTradeAmount(amount);
  };

  // 选择支付方式
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);

    // 如果选择SM支付直接处理
    if (method === 'sm') {
      handleDirectPayment();
    } else {
      // 显示支付详情页
      setShowTradeModal(false);
      setShowPaymentModal(true);
    }
  };

  // 直接SM支付
  const handleDirectPayment = () => {
    if (!selectedOrder || !wallet.isConnected || tradeAmount === null) return;

    setIsProcessing(true);

    // 计算总价
    const totalAmount = tradeAmount * selectedOrder.price;

    // 检查余额
    if (selectedOrder.asset === 'redFlower' && selectedOrder.type === 'buy') {
      if (balance?.sm < totalAmount) {
        toast.error('SM余额不足');
        setIsProcessing(false);
        return;
      }
    }

    // 模拟交易过程
    setTimeout(() => {
      setIsProcessing(false);

      // 创建交易记录
      const transaction: Transaction = {
        id: `tx-${Date.now()}`,
        orderId: selectedOrder.id,
        buyerId: 'user1',
        sellerId: 'm1',
        asset: selectedOrder.asset,
        amount: tradeAmount,
        price: selectedOrder.price,
        totalPrice: totalAmount,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethod: 'sm',
      };

      setCurrentTransaction(transaction);
      setTradeResult('success');
      setShowTradeModal(false);
      setShowResultModal(true);
    }, 2000);
  };

  // 上传支付凭证
  const handleUploadProof = () => {
    if (!selectedOrder || !selectedPaymentMethod || tradeAmount === null)
      return;

    setIsProcessing(true);

    // 计算总价
    const totalAmount = tradeAmount * selectedOrder.price;

    // 模拟交易过程
    setTimeout(() => {
      setIsProcessing(false);

      // 创建交易记录
      const transaction: Transaction = {
        id: `tx-${Date.now()}`,
        orderId: selectedOrder.id,
        buyerId: 'user1',
        sellerId: 'm1',
        asset: selectedOrder.asset,
        amount: tradeAmount,
        price: selectedOrder.price,
        totalPrice: totalAmount,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethod: selectedPaymentMethod,
      };

      setCurrentTransaction(transaction);
      setTradeResult('success');
      setShowPaymentModal(false);
      setShowResultModal(true);
    }, 2000);
  };

  // 关闭所有模态框
  const closeAllModals = () => {
    setShowTradeModal(false);
    setShowPaymentModal(false);
    setShowResultModal(false);
    setSelectedOrder(null);
    setTradeAmount(null);
    setSelectedPaymentMethod(null);
    setPaymentProof('');
    setCurrentTransaction(null);
    setTradeResult(null);
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentProof(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="mb-10">
      {/* 市场视图 */}
      <div className="tech-card">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-gray-800/70 mr-3">
            <FaStore />
          </div>
          <h2 className="text-xl font-bold">交易市场</h2>
          <div className="ml-auto text-sm text-gray-400">
            <span>小红花和SM交易市场</span>
          </div>
        </div>

        {/* 交易类型和资产选择 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex bg-gray-800 rounded-md p-1 mb-4 md:mb-0">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-4 py-1.5 rounded-md text-sm ${activeTab === 'buy' ? 'bg-primary text-black font-medium' : 'text-gray-300'}`}
            >
              购买
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-4 py-1.5 rounded-md text-sm ${activeTab === 'sell' ? 'bg-primary text-black font-medium' : 'text-gray-300'}`}
            >
              出售
            </button>
          </div>

          <div className="flex bg-gray-800 rounded-md p-1">
            <button
              onClick={() => setActiveAsset('redFlower')}
              className={`px-4 py-1.5 rounded-md text-sm ${activeAsset === 'redFlower' ? 'bg-primary text-black font-medium' : 'text-gray-300'}`}
            >
              小红花
            </button>
            <button
              onClick={() => setActiveAsset('smToken')}
              className={`px-4 py-1.5 rounded-md text-sm ${activeAsset === 'smToken' ? 'bg-primary text-black font-medium' : 'text-gray-300'}`}
            >
              SM代币
            </button>
          </div>
        </div>

        {/* 支付方式过滤 */}
        <div className="mb-6 p-3 bg-gray-800/30 rounded-md">
          <div className="flex flex-wrap items-center">
            <div className="mr-3 text-sm text-gray-400">支付方式：</div>
            {['wechat', 'alipay', 'usdt', 'sm'].map((method) => (
              <label
                key={method}
                className="flex items-center mr-4 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activePaymentMethods.includes(
                    method as PaymentMethod,
                  )}
                  onChange={() => {
                    if (
                      activePaymentMethods.includes(method as PaymentMethod)
                    ) {
                      setActivePaymentMethods(
                        activePaymentMethods.filter((m) => m !== method),
                      );
                    } else {
                      setActivePaymentMethods([
                        ...activePaymentMethods,
                        method as PaymentMethod,
                      ]);
                    }
                  }}
                  className="mr-1"
                />
                <span className="text-sm">
                  {method === 'wechat' && '微信'}
                  {method === 'alipay' && '支付宝'}
                  {method === 'usdt' && 'USDT'}
                  {method === 'sm' && 'SM'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="tech-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="bg-gray-700 p-1.5 rounded-full mr-3">
                      <FaStore className="text-primary w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium flex items-center">
                        {order.merchantName}
                        {order.isMedalist && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded flex items-center">
                            金牌商人
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {order.merchantId}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {order.asset === 'redFlower'
                      ? `1 小红花 = ${order.price} ¥`
                      : `1 SM = ${order.price} ¥`}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-4 text-sm">
                  <div className="text-gray-400">交易限额</div>
                  <div className="md:col-span-2">
                    ¥ {order.minAmount} - {order.maxAmount}
                  </div>

                  <div className="text-gray-400">可用数量</div>
                  <div className="md:col-span-2">
                    {order.availableAmount}{' '}
                    {order.asset === 'redFlower' ? '小红花' : 'SM'}
                  </div>

                  <div className="text-gray-400">支付方式</div>
                  <div className="md:col-span-2 flex flex-wrap space-x-2">
                    {order.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className="px-2 py-0.5 bg-gray-700 rounded-md text-xs"
                      >
                        {method === 'wechat' && '微信'}
                        {method === 'alipay' && '支付宝'}
                        {method === 'usdt' && 'USDT'}
                        {method === 'sm' && 'SM'}
                      </span>
                    ))}
                  </div>

                  <div className="text-gray-400">交易统计</div>
                  <div className="md:col-span-2 flex items-center">
                    <span className="mr-3">成交: {order.tradeCount}笔</span>
                    <span className="flex items-center">
                      平均完成时间: {order.avgCompletionTime}分钟
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => openTradeModal(order)}
                    className="neon-button py-1.5 px-4 text-sm"
                    disabled={!wallet.isConnected}
                  >
                    {activeTab === 'buy' ? '购买' : '出售'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              暂无符合条件的{activeTab === 'buy' ? '购买' : '出售'}订单
            </div>
          )}
        </div>
      </div>

      {/* 交易模态框 */}
      {showTradeModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={closeAllModals}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'buy'
                ? `购买${activeAsset === 'redFlower' ? '小红花' : 'SM代币'}`
                : `出售${activeAsset === 'redFlower' ? '小红花' : 'SM代币'}`}
            </h3>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">商人</span>
                <span>{selectedOrder.merchantName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">兑换比率</span>
                <span className="text-primary">
                  1 {activeAsset === 'redFlower' ? '小红花' : 'SM'} ={' '}
                  {selectedOrder.price} ¥
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">交易限额</span>
                <span>
                  ¥ {selectedOrder.minAmount} - {selectedOrder.maxAmount}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">
                {activeTab === 'buy' ? '购买' : '出售'}数量 (
                {activeAsset === 'redFlower' ? '小红花' : 'SM'})
              </label>
              <input
                type="number"
                min={selectedOrder?.minAmount || 0}
                max={selectedOrder?.availableAmount || 0}
                value={tradeAmount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleAmountChange(parseFloat(e.target.value))
                }
                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              />

              {tradeAmount !== null && selectedOrder && (
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-700">
                  <div className="text-gray-400">总金额</div>
                  <div className="text-xl font-bold">
                    ¥{(tradeAmount * selectedOrder.price).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="text-gray-400 mb-2">选择支付方式</div>
              <div className="grid grid-cols-2 gap-3">
                {selectedOrder.paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleSelectPaymentMethod(method)}
                    className="py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors flex items-center justify-center"
                  >
                    {method === 'wechat' && '微信支付'}
                    {method === 'alipay' && '支付宝'}
                    {method === 'usdt' && 'USDT'}
                    {method === 'sm' && 'SM直接支付'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
              <h4 className="font-medium text-primary mb-1">交易提示</h4>
              <p className="text-xs text-gray-300">
                确认订单后，请按照商人提供的方式及时支付。如有疑问，可联系客服或通过平台纠纷解决机制处理。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 支付详情模态框 */}
      {showPaymentModal && selectedOrder && selectedPaymentMethod && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={closeAllModals}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-4">请完成支付</h3>

            <div className="mb-4 p-4 bg-gray-800/40 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">交易金额</span>
                <span className="text-xl font-bold text-primary">
                  {tradeAmount !== null ? (tradeAmount * selectedOrder.price).toFixed(2) : '0.00'} ¥
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">支付方式</span>
                <span>
                  {selectedPaymentMethod === 'wechat' && '微信支付'}
                  {selectedPaymentMethod === 'alipay' && '支付宝'}
                  {selectedPaymentMethod === 'usdt' && 'USDT'}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">交易数量</span>
                <span>
                  {tradeAmount}{' '}
                  {selectedOrder.asset === 'redFlower' ? '小红花' : 'SM'}
                </span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-800/40 rounded-md border border-gray-700">
              <h4 className="font-medium text-primary mb-3">商人支付信息</h4>
              <div className="bg-gray-900 p-3 rounded-md mb-3 flex items-center justify-center">
                {/* 这里显示商人的收款码或地址 */}
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-800 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-500">收款二维码</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedPaymentMethod === 'usdt'
                      ? 'USDT地址: 0x1a2b3c4d5e6f7g8h9i10j11k12l'
                      : '请使用微信/支付宝扫描上方二维码支付'}
                  </div>
                </div>
              </div>

              <div className="text-sm text-yellow-400 mb-3">
                重要提示：请在转账备注中注明订单编号{' '}
                <strong>{selectedOrder.id}</strong>
              </div>

              <div className="mb-4">
                <div className="text-gray-400 mb-2">上传支付凭证</div>
                <label className="block w-full py-3 px-4 bg-gray-900 border border-dashed border-gray-700 rounded-md cursor-pointer hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <FaUpload className="text-gray-500 mb-2" />
                    <span className="text-sm">
                      {paymentProof ? paymentProof : '点击上传支付截图'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      支持 JPG, PNG 格式
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleUploadProof}
              disabled={isProcessing || !paymentProof}
              className="neon-button w-full py-2.5"
            >
              {isProcessing ? '处理中...' : '确认已支付并上传凭证'}
            </button>
          </div>
        </div>
      )}

      {/* 交易结果模态框 */}
      {showResultModal && currentTransaction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={closeAllModals}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <div className="text-center mb-6">
              {currentTransaction.status === 'completed' ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold mb-2">交易完成</h3>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-400 mb-4">
                    ⏳
                  </div>
                  <h3 className="text-xl font-bold mb-2">待商人确认</h3>
                </>
              )}

              <p className="text-gray-300">
                {currentTransaction.status === 'completed'
                  ? '交易已成功完成，资产已转入您的账户。'
                  : '您的支付凭证已上传，请等待商人确认。'}
              </p>
            </div>

            <div className="mb-6 p-4 bg-gray-800/40 rounded-md">
              <h4 className="font-medium text-primary mb-3">交易详情</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">交易ID</span>
                  <span>{currentTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">交易类型</span>
                  <span>
                    {selectedOrder?.type === 'buy' ? '购买' : '出售'}
                    {selectedOrder?.asset === 'redFlower' ? '小红花' : 'SM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">交易数量</span>
                  <span>
                    {currentTransaction.amount}{' '}
                    {selectedOrder?.asset === 'redFlower' ? '小红花' : 'SM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">单价</span>
                  <span>{currentTransaction.price} ¥</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">总金额</span>
                  <span className="text-primary">
                    {currentTransaction.totalPrice.toFixed(2)} ¥
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">支付方式</span>
                  <span>
                    {currentTransaction.paymentMethod === 'wechat' &&
                      '微信支付'}
                    {currentTransaction.paymentMethod === 'alipay' && '支付宝'}
                    {currentTransaction.paymentMethod === 'usdt' && 'USDT'}
                    {currentTransaction.paymentMethod === 'sm' && 'SM直接支付'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">交易状态</span>
                  <span
                    className={
                      currentTransaction.status === 'completed'
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }
                  >
                    {currentTransaction.status === 'completed' && '已完成'}
                    {currentTransaction.status === 'pending' && '待确认'}
                    {currentTransaction.status === 'paid' && '已支付'}
                    {currentTransaction.status === 'canceled' && '已取消'}
                    {currentTransaction.status === 'disputed' && '存在争议'}
                  </span>
                </div>
              </div>
            </div>

            {currentTransaction.status !== 'completed' && (
              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <h4 className="font-medium text-yellow-400 mb-1">注意事项</h4>
                <p className="text-xs text-gray-300">
                  商人通常会在30分钟内确认您的支付。如超过2小时未确认，您可以联系客服或发起纠纷解决。
                </p>
              </div>
            )}

            <button
              onClick={closeAllModals}
              className="neon-button w-full py-2.5"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSystem;
