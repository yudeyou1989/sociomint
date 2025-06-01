import { useState, useEffect } from 'react';
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTruck,
  FaClipboardList,
} from 'react-icons/fa';

// 订单状态
type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

// 支付方式
type PaymentMethod = 'SM' | '小红花' | '第三方';

// 订单类型
interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  itemName: string;
  itemType: '社交服务' | '数字产品' | '虚拟物品' | '其他';
  quantity: number;
  amount: number;
  currency: 'SM' | '小红花';
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
}

// 交易订单管理系统
const OrderManagement = () => {
  // 订单视图
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');

  // 筛选和排序状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 当前选中的订单
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 模拟订单数据
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'T202504150023',
      buyerId: 'U1001',
      buyerName: '张三',
      sellerId: 'U1002',
      sellerName: '李四',
      itemName: '50个社交媒体互动',
      itemType: '社交服务',
      quantity: 1,
      amount: 5000,
      currency: 'SM',
      paymentMethod: 'SM',
      status: 'completed',
      createdAt: new Date(2025, 3, 15, 9, 30),
      updatedAt: new Date(2025, 3, 16, 10, 45),
      completedAt: new Date(2025, 3, 16, 10, 45),
    },
    {
      id: 'T202504130018',
      buyerId: 'U1001',
      buyerName: '张三',
      sellerId: 'U1003',
      sellerName: '王五',
      itemName: '内容创作服务',
      itemType: '社交服务',
      quantity: 1,
      amount: 8000,
      currency: 'SM',
      paymentMethod: 'SM',
      status: 'processing',
      createdAt: new Date(2025, 3, 13, 14, 20),
      updatedAt: new Date(2025, 3, 13, 14, 25),
    },
    {
      id: 'T202504100015',
      buyerId: 'U1004',
      buyerName: '赵六',
      sellerId: 'U1001',
      sellerName: '张三',
      itemName: '社交媒体推广',
      itemType: '社交服务',
      quantity: 1,
      amount: 1500,
      currency: '小红花',
      paymentMethod: '小红花',
      status: 'disputed',
      createdAt: new Date(2025, 3, 10, 11, 15),
      updatedAt: new Date(2025, 3, 15, 9, 30),
      notes: '客户对服务质量有异议',
    },
    {
      id: 'T202504080010',
      buyerId: 'U1001',
      buyerName: '张三',
      sellerId: 'U1005',
      sellerName: '孙七',
      itemName: '数字艺术品',
      itemType: '数字产品',
      quantity: 1,
      amount: 3000,
      currency: 'SM',
      paymentMethod: '第三方',
      status: 'cancelled',
      createdAt: new Date(2025, 3, 8, 16, 10),
      updatedAt: new Date(2025, 3, 9, 10, 22),
    },
    {
      id: 'T202504050008',
      buyerId: 'U1006',
      buyerName: '周八',
      sellerId: 'U1001',
      sellerName: '张三',
      itemName: '专业评论服务',
      itemType: '社交服务',
      quantity: 5,
      amount: 2500,
      currency: 'SM',
      paymentMethod: 'SM',
      status: 'pending',
      createdAt: new Date(2025, 3, 5, 9, 5),
      updatedAt: new Date(2025, 3, 5, 9, 5),
    },
  ]);

  // 获取状态按钮样式
  const getStatusStyle = (status: OrderStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'paid':
        return 'bg-blue-500/20 text-blue-500';
      case 'processing':
        return 'bg-purple-500/20 text-purple-500';
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-500';
      case 'refunded':
        return 'bg-orange-500/20 text-orange-500';
      case 'disputed':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'paid':
        return <FaCheckCircle />;
      case 'processing':
        return <FaTruck />;
      case 'completed':
        return <FaCheckCircle />;
      case 'cancelled':
        return <FaTimesCircle />;
      case 'refunded':
        return <FaTimesCircle />;
      case 'disputed':
        return <FaTimesCircle />;
      default:
        return <FaClock />;
    }
  };

  // 格式化状态显示
  const formatStatus = (status: OrderStatus): string => {
    switch (status) {
      case 'pending':
        return '待支付';
      case 'paid':
        return '已支付';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      case 'refunded':
        return '已退款';
      case 'disputed':
        return '有纠纷';
      default:
        return '未知状态';
    }
  };

  // 筛选订单
  const filteredOrders = orders.filter((order) => {
    // 按角色筛选
    const roleFilter =
      viewMode === 'buyer'
        ? order.buyerId === 'U1001' // 假设当前用户ID为U1001
        : order.sellerId === 'U1001';

    // 按状态筛选
    const statusFilterMatch =
      statusFilter === 'all' || order.status === statusFilter;

    // 按搜索词筛选
    const searchMatch =
      searchTerm === '' ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (viewMode === 'buyer'
        ? order.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
        : order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()));

    return roleFilter && statusFilterMatch && searchMatch;
  });

  // 排序订单
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  // 更新订单状态（模拟）
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date(),
        };
      }
      return order;
    });

    setOrders(updatedOrders);

    // 如果当前正在查看这个订单，也更新它
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        status: newStatus,
        updatedAt: new Date(),
      });
    }
  };

  // 获取可用操作按钮
  const getActionButtons = (order: Order) => {
    // 买家视角
    if (viewMode === 'buyer') {
      switch (order.status) {
        case 'pending':
          return (
            <div className="flex space-x-2">
              <button
                onClick={() => updateOrderStatus(order.id, 'paid')}
                className="bg-primary/90 hover:bg-primary text-white text-xs rounded px-2 py-1"
              >
                支付
              </button>
              <button
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs rounded px-2 py-1"
              >
                取消
              </button>
            </div>
          );
        case 'processing':
          return (
            <button
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className="bg-green-600/90 hover:bg-green-600 text-white text-xs rounded px-2 py-1"
            >
              确认完成
            </button>
          );
        case 'completed':
          return (
            <button
              onClick={() => {
                /* 跳转到评价页面 */
              }}
              className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs rounded px-2 py-1"
            >
              评价
            </button>
          );
        default:
          return null;
      }
    }
    // 卖家视角
    else {
      switch (order.status) {
        case 'paid':
          return (
            <button
              onClick={() => updateOrderStatus(order.id, 'processing')}
              className="bg-purple-600/90 hover:bg-purple-600 text-white text-xs rounded px-2 py-1"
            >
              开始处理
            </button>
          );
        case 'processing':
          return (
            <button
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className="bg-green-600/90 hover:bg-green-600 text-white text-xs rounded px-2 py-1"
            >
              标记完成
            </button>
          );
        default:
          return null;
      }
    }
  };

  // 切换排序顺序
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="mb-8">
      <div className="tech-card">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <h2 className="text-xl font-bold mb-2 md:mb-0">交易订单管理</h2>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('buyer')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'buyer'
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  我的购买
                </button>
                <button
                  onClick={() => setViewMode('seller')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'seller'
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  我的销售
                </button>
              </div>
            </div>

            <div className="bg-black/30 border border-gray-800 rounded-md p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索订单号、商品名或交易对象"
                    className="w-full bg-black/30 border border-gray-700 rounded-md py-2 pl-9 pr-3 text-white text-sm"
                  />
                  <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as OrderStatus | 'all')
                      }
                      className="appearance-none bg-black/30 border border-gray-700 rounded-md py-2 pl-9 pr-8 text-white text-sm"
                    >
                      <option value="all">全部状态</option>
                      <option value="pending">待支付</option>
                      <option value="paid">已支付</option>
                      <option value="processing">处理中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                      <option value="refunded">已退款</option>
                      <option value="disputed">有纠纷</option>
                    </select>
                    <FaFilter className="absolute left-3 top-2.5 text-gray-500" />
                  </div>

                  <button
                    onClick={() => {
                      setSortBy(sortBy === 'date' ? 'amount' : 'date');
                      setSortOrder('desc');
                    }}
                    className="bg-black/30 border border-gray-700 rounded-md py-2 px-3 text-white text-sm flex items-center"
                  >
                    <FaSort className="mr-1" />
                    {sortBy === 'date' ? '时间排序' : '金额排序'}
                  </button>

                  <button
                    onClick={toggleSortOrder}
                    className="bg-black/30 border border-gray-700 rounded-md py-2 px-3 text-white text-sm"
                  >
                    {sortOrder === 'desc' ? '降序' : '升序'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* 订单列表 */}
              <div
                className={`${selectedOrder ? 'md:col-span-7' : 'md:col-span-12'} space-y-3`}
              >
                {sortedOrders.length === 0 ? (
                  <div className="text-center py-10 bg-gray-800/20 border border-gray-800 rounded-md">
                    <p className="text-gray-400">暂无订单记录</p>
                  </div>
                ) : (
                  sortedOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? 'bg-gray-800/50 border-primary'
                          : 'bg-gray-800/20 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{order.itemName}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full flex items-center space-x-1 ${getStatusStyle(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              <span>{formatStatus(order.status)}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            订单号: {order.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {order.amount} {order.currency}
                          </p>
                          <p className="text-sm text-gray-400">
                            {order.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-sm text-gray-400">
                          {viewMode === 'buyer'
                            ? `卖家: ${order.sellerName}`
                            : `买家: ${order.buyerName}`}
                        </p>

                        <div className="flex items-center space-x-2">
                          {getActionButtons(order)}
                          <button
                            className="text-primary hover:text-primary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 订单详情 */}
              {selectedOrder && (
                <div className="md:col-span-5">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4 sticky top-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">订单详情</h3>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-400 text-sm mb-1">基本信息</h4>
                        <div className="bg-black/30 rounded-md p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-gray-500">订单编号</span>
                              <p>{selectedOrder.id}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">创建时间</span>
                              <p>{selectedOrder.createdAt.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">订单状态</span>
                              <p
                                className={`inline-flex items-center space-x-1 ${getStatusStyle(
                                  selectedOrder.status,
                                ).replace('bg-', 'text-')}`}
                              >
                                {getStatusIcon(selectedOrder.status)}
                                <span>
                                  {formatStatus(selectedOrder.status)}
                                </span>
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">支付方式</span>
                              <p>{selectedOrder.paymentMethod}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-gray-400 text-sm mb-1">商品信息</h4>
                        <div className="bg-black/30 rounded-md p-3">
                          <div className="mb-2">
                            <span className="text-gray-500 text-sm">
                              商品名称
                            </span>
                            <p className="font-medium">
                              {selectedOrder.itemName}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">商品类型</span>
                              <p>{selectedOrder.itemType}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">数量</span>
                              <p>{selectedOrder.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">总金额</span>
                              <p className="font-medium">
                                {selectedOrder.amount} {selectedOrder.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-gray-400 text-sm mb-1">交易对象</h4>
                        <div className="bg-black/30 rounded-md p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">买家</span>
                              <p>
                                {selectedOrder.buyerName} (ID:{' '}
                                {selectedOrder.buyerId})
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">卖家</span>
                              <p>
                                {selectedOrder.sellerName} (ID:{' '}
                                {selectedOrder.sellerId})
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-gray-400 text-sm mb-1">操作记录</h4>
                        <div className="bg-black/30 rounded-md p-3 max-h-32 overflow-y-auto text-sm">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                              <div>
                                <p>订单创建</p>
                                <p className="text-gray-500">
                                  {selectedOrder.createdAt.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {selectedOrder.status !== 'pending' && (
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                                <div>
                                  <p>
                                    订单状态变更为:{' '}
                                    {formatStatus(selectedOrder.status)}
                                  </p>
                                  <p className="text-gray-500">
                                    {selectedOrder.updatedAt.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {selectedOrder.completedAt && (
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                <div>
                                  <p>订单完成</p>
                                  <p className="text-gray-500">
                                    {selectedOrder.completedAt.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedOrder.notes && (
                        <div>
                          <h4 className="text-gray-400 text-sm mb-1">备注</h4>
                          <div className="bg-black/30 rounded-md p-3 text-sm">
                            <p>{selectedOrder.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* 操作按钮区域 */}
                      <div className="flex justify-end space-x-3 pt-2">
                        {getActionButtons(selectedOrder)}

                        {/* 额外操作按钮 */}
                        {selectedOrder.status !== 'cancelled' &&
                          selectedOrder.status !== 'refunded' && (
                            <button
                              className="text-gray-400 hover:text-gray-300 text-sm border border-gray-700 rounded-md px-3 py-1"
                              onClick={() => {
                                /* 跳转到聊天界面 */
                              }}
                            >
                              联系{viewMode === 'buyer' ? '卖家' : '买家'}
                            </button>
                          )}

                        {/* 纠纷按钮 */}
                        {selectedOrder.status !== 'disputed' &&
                          selectedOrder.status !== 'cancelled' &&
                          selectedOrder.status !== 'refunded' && (
                            <button
                              className="text-red-400 hover:text-red-300 text-sm border border-red-900/50 rounded-md px-3 py-1"
                              onClick={() => {
                                /* 跳转到纠纷提交界面 */
                              }}
                            >
                              提交纠纷
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
