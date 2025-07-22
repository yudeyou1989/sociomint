'use client';

import { useState } from 'react';
// // import {
  FaStore,
  "🔄",
  FaArrowDown,
  FaArrowUp,
  "✕",
} from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建

// 定义订单类型接口
interface Order {
  id: string;
  merchant: string;
  amount: number;
  price: number;
  total: number;
  paymentMethods: string[];
}

const MarketSection = () => {
  const [isMerchant, setIsMerchant] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 模拟的订单数据
  const buyOrders: Order[] = [
    {
      id: '1',
      merchant: '0x1a2b...3c4d',
      amount: 500,
      price: 0.05,
      total: 25,
      paymentMethods: ['支付宝', '微信'],
    },
    {
      id: '2',
      merchant: '0x5e6f...7g8h',
      amount: 1000,
      price: 0.048,
      total: 48,
      paymentMethods: ['支付宝'],
    },
    {
      id: '3',
      merchant: '0x9i10...11j12',
      amount: 2000,
      price: 0.045,
      total: 90,
      paymentMethods: ['微信'],
    },
  ];

  const sellOrders: Order[] = [
    {
      id: '4',
      merchant: '0xab12...cd34',
      amount: 300,
      price: 0.055,
      total: 16.5,
      paymentMethods: ['支付宝', '微信'],
    },
    {
      id: '5',
      merchant: '0xef56...gh78',
      amount: 800,
      price: 0.052,
      total: 41.6,
      paymentMethods: ['支付宝'],
    },
    {
      id: '6',
      merchant: '0xij90...kl12',
      amount: 1500,
      price: 0.05,
      total: 75,
      paymentMethods: ['微信'],
    },
  ];

  // 处理成为商家请求
  const handleBecomeMerchant = () => {
    console.log('申请成为商家，质押 5000 SM');
    // 这里添加实际交互逻辑，与Supabase交互，不上链
    setIsMerchant(true); // 模拟状态变化
  };

  // 创建买单或卖单
  const handleCreateOrder = (type: 'buy' | 'sell') => {
    console.log(`创建${type === 'buy' ? '购买' : '出售'}订单`);
    // 实际创建订单逻辑
  };

  // 打开交易模态框
  const openTradeModal = (order: Order) => {
    setSelectedOrder(order);
    setShowTradeModal(true);
  };

  // 处理交易
  const handleTrade = () => {
    console.log(`处理${activeTab === 'buy' ? '购买' : '出售'}订单`);
    // 模拟交易过程 - 实际中应调用Supabase接口
    setTimeout(() => {
      setShowTradeModal(false);
      alert('交易请求已提交，请按照商人提供的方式完成支付');
    }, 1000);
  };

  return (
    <div className="mb-10">
      {/* 商家状态区域 */}
      <div className="tech-card mb-8">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaStore className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">商家状态</h2>
            {isMerchant ? (
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-green-400">您当前是活跃商家</span>
                <div className="ml-auto">
                  <button className="neon-button py-1 px-4 text-sm">
                    创建交易订单
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">
                  您当前不是商家。成为商家可以创建买单和卖单，用人民币与用户交易小红花。
                </p>
                <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700 mb-4">
                  <span className="block mb-2 text-gray-300">
                    需要质押: <span className="text-primary">5000 SM</span>
                  </span>
                  <span className="block text-xs text-gray-400">
                    质押在Supabase中记录，不上链，解除商家身份后返还
                  </span>
                </div>
                <button onClick={handleBecomeMerchant} className="neon-button">
                  成为商家
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 市场视图 */}
      <div className="tech-card">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-gray-800/70 mr-3">
            🔄
          </div>
          <h2 className="text-xl font-bold">小红花交易市场</h2>
          <div className="ml-auto text-sm text-gray-400">
            <span>小红花不上链，仅作为平台道具使用</span>
          </div>
        </div>

        {/* 买卖标签页 */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('buy')}
              className={`py-2 px-4 font-medium relative ${
                activeTab === 'buy'
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              购买小红花
              {activeTab === 'buy' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sell')}
              className={`py-2 px-4 font-medium relative ${
                activeTab === 'sell'
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              出售小红花
              {activeTab === 'sell' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-800/30 rounded-md border border-primary/20">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="flex">
                <FaArrowDown className="text-green-400 mr-0.5" />
                <FaArrowUp className="text-red-400 ml-0.5" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-primary mb-1">人民币交易系统</h3>
              <p className="text-sm text-gray-300">
                您可以通过人民币从商人处购买小红花，或将小红花卖给商人获得人民币。
              </p>
            </div>
          </div>
        </div>

        {/* 订单表格 */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                  商家
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">
                  数量 (小红花)
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">
                  单价 (¥)
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-400">
                  总价 (¥)
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium text-gray-400">
                  支付方式
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium text-gray-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'buy' ? buyOrders : sellOrders).map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30"
                >
                  <td className="py-3 px-4 text-left">{order.merchant}</td>
                  <td className="py-3 px-4 text-right">{order.amount}</td>
                  <td className="py-3 px-4 text-right">{order.price}</td>
                  <td className="py-3 px-4 text-right">{order.total}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-1">
                      {order.paymentMethods.map((method) => (
                        <span
                          key={method}
                          className="px-1.5 py-0.5 bg-gray-700 rounded text-xs"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      className="py-1 px-3 bg-primary hover:bg-primary/80 text-black font-medium rounded-md text-sm"
                      onClick={() => openTradeModal(order)}
                    >
                      {activeTab === 'buy' ? '购买' : '出售'}
                    </button>
                  </td>
                </tr>
              ))}

              {(activeTab === 'buy' ? buyOrders : sellOrders).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    暂无{activeTab === 'buy' ? '购买' : '出售'}订单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 商家创建订单按钮，仅对商家显示 */}
        {isMerchant && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => handleCreateOrder(activeTab)}
              className="neon-button"
            >
              创建{activeTab === 'buy' ? '购买' : '出售'}订单
            </button>
          </div>
        )}
      </div>

      {/* 交易模态框 */}
      {showTradeModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowTradeModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'buy' ? '购买小红花' : '出售小红花'}
            </h3>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">商人</span>
                <span>{selectedOrder.merchant}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">数量</span>
                <span>{selectedOrder.amount} 小红花</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">单价</span>
                <span className="text-primary">
                  {selectedOrder.price} ¥/小红花
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">总价</span>
                <span>{selectedOrder.total} ¥</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-800/50 rounded-md border border-yellow-500/30">
              <h4 className="font-medium text-yellow-400 mb-2">支付方式</h4>
              <div className="flex space-x-2 mb-2">
                {selectedOrder.paymentMethods.map((method: string) => (
                  <span
                    key={method}
                    className="px-2 py-0.5 bg-gray-700 rounded-md text-xs"
                  >
                    {method}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-300">
                确认交易后，商人将与您联系并提供支付详情。请在平台内完成交流，避免风险。
              </p>
            </div>

            <div className="mb-3 text-xs text-gray-400">
              小红花是平台内部道具，此交易不涉及区块链上的代币交互。
            </div>

            <button onClick={handleTrade} className="neon-button w-full py-2.5">
              确认{activeTab === 'buy' ? '购买' : '出售'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketSection;
