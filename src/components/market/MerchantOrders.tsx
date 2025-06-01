'use client';

import { useState, useEffect } from 'react';
import {
  FaCoins,
  FaPlus,
  FaEdit,
  FaTimes,
  FaWallet,
  FaWeixin,
  FaAlipay,
  FaEthereum,
  FaUpload,
  FaInfoCircle,
} from 'react-icons/fa';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'react-hot-toast';

// 订单类型定义
type OrderType = 'sell' | 'buy';
type AssetType = 'redFlower' | 'smToken';
type PaymentMethod = 'sm' | 'wechat' | 'alipay' | 'usdt';

// 订单状态
type OrderStatus = 'active' | 'paused' | 'completed' | 'canceled';

// 订单接口
interface MerchantOrder {
  id: string;
  merchantId: string;
  type: OrderType;
  asset: AssetType;
  price: number;
  minAmount: number;
  maxAmount: number;
  availableAmount: number;
  paymentMethods: PaymentMethod[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  qrCodeUrls: Record<PaymentMethod, string | null>;
}

// 默认的空订单表单
const defaultOrderForm = {
  type: 'sell' as OrderType,
  asset: 'redFlower' as AssetType,
  price: 0,
  minAmount: 100,
  maxAmount: 10000,
  availableAmount: 0,
  paymentMethods: [] as PaymentMethod[],
  qrCodeUrls: {
    sm: null,
    wechat: null,
    alipay: null,
    usdt: null,
  },
};

const MerchantOrders = () => {
  const { wallet, balance } = useWallet();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<MerchantOrder | null>(null);
  const [orderForm, setOrderForm] = useState({ ...defaultOrderForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<PaymentMethod, File | null>
  >({
    sm: null,
    wechat: null,
    alipay: null,
    usdt: null,
  });

  // 加载商人订单
  useEffect(() => {
    if (wallet.isConnected) {
      // 模拟从API获取订单数据
      setTimeout(() => {
        const mockOrders = generateMockOrders();
        setOrders(mockOrders);
      }, 1000);
    }
  }, [wallet.isConnected]);

  // 生成模拟订单数据
  const generateMockOrders = () => {
    const mockOrders: MerchantOrder[] = [];

    // 生成5个随机订单
    for (let i = 0; i < 5; i++) {
      const orderType = Math.random() > 0.5 ? 'sell' : 'buy';
      const assetType = Math.random() > 0.5 ? 'redFlower' : 'smToken';

      // 根据不同的资产和订单类型设置不同的价格范围
      let price;
      if (assetType === 'redFlower') {
        // 小红花的价格（以法币计）
        price = (Math.random() * 0.5 + 0.2).toFixed(2);
      } else {
        // SM代币的价格（以法币计）
        price = (Math.random() * 20 + 10).toFixed(2);
      }

      const paymentMethods: PaymentMethod[] = [];
      // 随机选择支付方式
      if (Math.random() > 0.5) paymentMethods.push('sm');
      if (Math.random() > 0.5) paymentMethods.push('wechat');
      if (Math.random() > 0.3) paymentMethods.push('alipay');
      if (Math.random() > 0.7) paymentMethods.push('usdt');

      // 确保至少有一种支付方式
      if (paymentMethods.length === 0) {
        paymentMethods.push('alipay');
      }

      const minAmount = Math.floor(Math.random() * 500) + 100;
      const maxAmount = minAmount + Math.floor(Math.random() * 10000);
      const availableAmount =
        Math.floor(Math.random() * (maxAmount - minAmount)) + minAmount;

      const createdDate = new Date();
      createdDate.setDate(
        createdDate.getDate() - Math.floor(Math.random() * 30),
      );

      mockOrders.push({
        id: `order-${i + 1}`,
        merchantId: wallet.address || '',
        type: orderType,
        asset: assetType,
        price: parseFloat(price),
        minAmount,
        maxAmount,
        availableAmount,
        paymentMethods,
        status: 'active' as OrderStatus,
        createdAt: createdDate,
        updatedAt: new Date(),
        qrCodeUrls: {
          sm: null,
          wechat: paymentMethods.includes('wechat')
            ? 'https://placeholder.pics/svg/200x200/DEDEDE/555555/WeChat%20QR'
            : null,
          alipay: paymentMethods.includes('alipay')
            ? 'https://placeholder.pics/svg/200x200/DEDEDE/555555/Alipay%20QR'
            : null,
          usdt: paymentMethods.includes('usdt')
            ? 'https://placeholder.pics/svg/200x200/DEDEDE/555555/USDT%20QR'
            : null,
        },
      });
    }

    return mockOrders;
  };

  // 打开创建订单模态框
  const handleCreateOrder = () => {
    setOrderForm({ ...defaultOrderForm });
    setUploadedFiles({
      sm: null,
      wechat: null,
      alipay: null,
      usdt: null,
    });
    setShowCreateModal(true);
  };

  // 打开编辑订单模态框
  const handleEditOrder = (order: MerchantOrder) => {
    setCurrentOrder(order);
    setOrderForm({
      type: order.type,
      asset: order.asset,
      price: order.price,
      minAmount: order.minAmount,
      maxAmount: order.maxAmount,
      availableAmount: order.availableAmount,
      paymentMethods: [...order.paymentMethods],
      qrCodeUrls: { ...order.qrCodeUrls },
    });
    setShowEditModal(true);
  };

  // 处理暂停/激活订单
  const handleToggleOrderStatus = (order: MerchantOrder) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: o.status === 'active' ? 'paused' : 'active',
          updatedAt: new Date(),
        };
      }
      return o;
    });

    setOrders(updatedOrders);

    toast.success(
      order.status === 'active'
        ? '订单已暂停，不会显示给其他用户'
        : '订单已激活，其他用户可以看到',
    );
  };

  // 处理取消订单
  const handleCancelOrder = (order: MerchantOrder) => {
    if (window.confirm('确定要取消此订单吗？取消后无法恢复。')) {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'canceled',
            updatedAt: new Date(),
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      toast.success('订单已取消');
    }
  };

  // 处理表单变更
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const method = name as PaymentMethod;

      if (checkbox.checked) {
        setOrderForm((prev) => ({
          ...prev,
          paymentMethods: [...prev.paymentMethods, method],
        }));
      } else {
        setOrderForm((prev) => ({
          ...prev,
          paymentMethods: prev.paymentMethods.filter((m) => m !== method),
        }));
      }
    } else {
      setOrderForm((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  // 处理支付二维码上传
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    method: PaymentMethod,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 检查文件类型
      if (!file.type.includes('image')) {
        toast.error('请上传图片格式的二维码');
        return;
      }

      // 检查文件大小 (2MB限制)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片大小不能超过2MB');
        return;
      }

      setUploadedFiles((prev) => ({
        ...prev,
        [method]: file,
      }));

      // 模拟URL生成
      const reader = new FileReader();
      reader.onload = (event) => {
        setOrderForm((prev) => ({
          ...prev,
          qrCodeUrls: {
            ...prev.qrCodeUrls,
            [method]: event.target?.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 提交创建/更新订单
  const handleSubmitOrder = () => {
    // 验证表单
    if (orderForm.price <= 0) {
      toast.error('请设置有效的价格');
      return;
    }

    if (orderForm.minAmount <= 0 || orderForm.maxAmount <= 0) {
      toast.error('最小和最大金额必须大于0');
      return;
    }

    if (orderForm.minAmount >= orderForm.maxAmount) {
      toast.error('最大金额必须大于最小金额');
      return;
    }

    if (orderForm.paymentMethods.length === 0) {
      toast.error('请至少选择一种支付方式');
      return;
    }

    // 验证QR码图片
    for (const method of orderForm.paymentMethods) {
      if (method !== 'sm' && !orderForm.qrCodeUrls[method]) {
        toast.error(
          `请上传${method === 'wechat' ? '微信' : method === 'alipay' ? '支付宝' : 'USDT'}收款二维码`,
        );
        return;
      }
    }

    setIsSubmitting(true);

    // 模拟提交过程
    setTimeout(() => {
      if (showCreateModal) {
        // 创建新订单
        const newOrder: MerchantOrder = {
          id: `order-${Date.now()}`,
          merchantId: wallet.address || '',
          type: orderForm.type,
          asset: orderForm.asset,
          price: orderForm.price,
          minAmount: orderForm.minAmount,
          maxAmount: orderForm.maxAmount,
          availableAmount: orderForm.availableAmount || orderForm.maxAmount,
          paymentMethods: orderForm.paymentMethods,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          qrCodeUrls: orderForm.qrCodeUrls,
        };

        setOrders([newOrder, ...orders]);
        setShowCreateModal(false);
        toast.success('订单创建成功');
      } else if (showEditModal && currentOrder) {
        // 更新订单
        const updatedOrders = orders.map((o) => {
          if (o.id === currentOrder.id) {
            return {
              ...o,
              type: orderForm.type,
              asset: orderForm.asset,
              price: orderForm.price,
              minAmount: orderForm.minAmount,
              maxAmount: orderForm.maxAmount,
              availableAmount: orderForm.availableAmount,
              paymentMethods: orderForm.paymentMethods,
              updatedAt: new Date(),
              qrCodeUrls: orderForm.qrCodeUrls,
            };
          }
          return o;
        });

        setOrders(updatedOrders);
        setShowEditModal(false);
        toast.success('订单已更新');
      }

      setIsSubmitting(false);
    }, 1500);
  };

  // 渲染支付方式选择UI
  const renderPaymentMethodsSelection = () => {
    const methods: { key: PaymentMethod; label: string; icon: JSX.Element }[] =
      [
        {
          key: 'sm',
          label: 'SM代币',
          icon: <FaCoins className="text-primary" />,
        },
        {
          key: 'wechat',
          label: '微信支付',
          icon: <FaWeixin className="text-green-500" />,
        },
        {
          key: 'alipay',
          label: '支付宝',
          icon: <FaAlipay className="text-blue-500" />,
        },
        {
          key: 'usdt',
          label: 'USDT',
          icon: <FaEthereum className="text-teal-500" />,
        },
      ];

    return (
      <div className="mt-4">
        <label className="block text-gray-300 mb-2">选择支付方式</label>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((method) => (
            <div key={method.key} className="flex items-center">
              <input
                type="checkbox"
                id={`payment-${method.key}`}
                name={method.key}
                checked={orderForm.paymentMethods.includes(method.key)}
                onChange={handleFormChange}
                className="mr-2"
              />
              <label
                htmlFor={`payment-${method.key}`}
                className="flex items-center cursor-pointer"
              >
                {method.icon}
                <span className="ml-1">{method.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染二维码上传UI
  const renderQRCodeUploads = () => {
    if (orderForm.paymentMethods.length === 0) return null;

    const requiresQRCode = orderForm.paymentMethods.filter((m) => m !== 'sm');
    if (requiresQRCode.length === 0) return null;

    return (
      <div className="mt-4">
        <label className="block text-gray-300 mb-2">上传收款二维码</label>
        <div className="space-y-3">
          {requiresQRCode.map((method) => (
            <div
              key={method}
              className="border border-gray-700 rounded-md p-3 bg-gray-800/40"
            >
              <div className="flex items-center mb-2">
                {method === 'wechat' && (
                  <FaWeixin className="text-green-500 mr-2" />
                )}
                {method === 'alipay' && (
                  <FaAlipay className="text-blue-500 mr-2" />
                )}
                {method === 'usdt' && (
                  <FaEthereum className="text-teal-500 mr-2" />
                )}
                <span>
                  {method === 'wechat'
                    ? '微信'
                    : method === 'alipay'
                      ? '支付宝'
                      : 'USDT'}{' '}
                  收款码
                </span>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <label className="relative flex items-center justify-center border border-dashed border-gray-600 rounded-md h-24 cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFileChange(e, method)}
                    />

                    {orderForm.qrCodeUrls[method] ? (
                      <img
                        src={orderForm.qrCodeUrls[method] || ''}
                        alt="QR Code"
                        className="h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <FaUpload className="mx-auto mb-1" />
                        <span className="text-xs">上传二维码</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-2">
          请确保二维码清晰可见，支持JPG、PNG格式，大小不超过2MB
        </p>
      </div>
    );
  };

  // 渲染模态框 - 订单表单
  const renderOrderForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-gray-300 mb-2">订单类型</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-center justify-center p-3 rounded-md cursor-pointer ${orderForm.type === 'sell' ? 'bg-primary/20 border border-primary' : 'bg-gray-800 border border-gray-700'}`}
          >
            <input
              type="radio"
              name="type"
              value="sell"
              checked={orderForm.type === 'sell'}
              onChange={handleFormChange}
              className="sr-only"
            />
            <span>我要出售</span>
          </label>

          <label
            className={`flex items-center justify-center p-3 rounded-md cursor-pointer ${orderForm.type === 'buy' ? 'bg-primary/20 border border-primary' : 'bg-gray-800 border border-gray-700'}`}
          >
            <input
              type="radio"
              name="type"
              value="buy"
              checked={orderForm.type === 'buy'}
              onChange={handleFormChange}
              className="sr-only"
            />
            <span>我要收购</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2">资产类型</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-center justify-center p-3 rounded-md cursor-pointer ${orderForm.asset === 'redFlower' ? 'bg-primary/20 border border-primary' : 'bg-gray-800 border border-gray-700'}`}
          >
            <input
              type="radio"
              name="asset"
              value="redFlower"
              checked={orderForm.asset === 'redFlower'}
              onChange={handleFormChange}
              className="sr-only"
            />
            <span>小红花</span>
          </label>

          <label
            className={`flex items-center justify-center p-3 rounded-md cursor-pointer ${orderForm.asset === 'smToken' ? 'bg-primary/20 border border-primary' : 'bg-gray-800 border border-gray-700'}`}
          >
            <input
              type="radio"
              name="asset"
              value="smToken"
              checked={orderForm.asset === 'smToken'}
              onChange={handleFormChange}
              className="sr-only"
            />
            <span>SM代币</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2">
          单价 (人民币/单位)
          <span className="ml-1 text-xs text-gray-400">
            {orderForm.asset === 'redFlower' ? '每小红花' : '每SM'}
          </span>
        </label>
        <input
          type="number"
          name="price"
          value={orderForm.price}
          onChange={handleFormChange}
          step="0.01"
          min="0.01"
          className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
          placeholder="设置单价"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-300 mb-2">最小数量</label>
          <input
            type="number"
            name="minAmount"
            value={orderForm.minAmount}
            onChange={handleFormChange}
            min="1"
            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
            placeholder="最小交易数量"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">最大数量</label>
          <input
            type="number"
            name="maxAmount"
            value={orderForm.maxAmount}
            onChange={handleFormChange}
            min="1"
            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
            placeholder="最大交易数量"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2">可用数量</label>
        <input
          type="number"
          name="availableAmount"
          value={orderForm.availableAmount}
          onChange={handleFormChange}
          min="0"
          max={orderForm.maxAmount}
          className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
          placeholder="可交易数量"
        />
        <p className="text-xs text-gray-400 mt-1">
          {orderForm.type === 'sell'
            ? '您要出售的数量，不能超过最大数量'
            : '您要收购的数量，不能超过最大数量'}
        </p>
      </div>

      {renderPaymentMethodsSelection()}
      {renderQRCodeUploads()}
    </>
  );

  // 渲染已有订单列表
  const renderOrders = () => {
    // 过滤掉已取消的订单
    const activeOrders = orders.filter((order) => order.status !== 'canceled');

    if (activeOrders.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed border-gray-700 rounded-md">
          <p className="text-gray-400">您还没有创建任何订单</p>
          <button
            onClick={handleCreateOrder}
            className="mt-4 neon-button py-2 px-4"
          >
            创建第一个订单
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activeOrders.map((order) => (
          <div
            key={order.id}
            className={`tech-card p-4 border ${order.status === 'active' ? 'border-primary/50' : 'border-gray-700'}`}
          >
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${order.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}
                ></span>
                <span className="font-medium">
                  {order.type === 'sell' ? '出售' : '收购'}
                  {order.asset === 'redFlower' ? ' 小红花' : ' SM代币'}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleOrderStatus(order)}
                  className="text-gray-400 hover:text-white p-1"
                  title={order.status === 'active' ? '暂停订单' : '激活订单'}
                >
                  {order.status === 'active' ? '暂停' : '激活'}
                </button>

                <button
                  onClick={() => handleEditOrder(order)}
                  className="text-gray-400 hover:text-white p-1"
                  title="编辑订单"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => handleCancelOrder(order)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="取消订单"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-gray-800/40 rounded-md">
                <div className="text-xs text-gray-400">单价</div>
                <div className="font-medium">¥{order.price.toFixed(2)}</div>
                <div className="text-xs text-gray-400">
                  {order.asset === 'redFlower' ? '每小红花' : '每SM'}
                </div>
              </div>

              <div className="p-3 bg-gray-800/40 rounded-md">
                <div className="text-xs text-gray-400">可用/最大数量</div>
                <div className="font-medium">
                  {order.availableAmount}/{order.maxAmount}
                </div>
                <div className="text-xs text-gray-400">
                  最小交易: {order.minAmount}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">支付方式</div>
              <div className="flex space-x-2">
                {order.paymentMethods.includes('sm') && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center">
                    <FaCoins className="mr-1" size={10} /> SM代币
                  </span>
                )}

                {order.paymentMethods.includes('wechat') && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center">
                    <FaWeixin className="mr-1" size={10} /> 微信
                  </span>
                )}

                {order.paymentMethods.includes('alipay') && (
                  <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full flex items-center">
                    <FaAlipay className="mr-1" size={10} /> 支付宝
                  </span>
                )}

                {order.paymentMethods.includes('usdt') && (
                  <span className="text-xs bg-teal-500/20 text-teal-500 px-2 py-1 rounded-full flex items-center">
                    <FaEthereum className="mr-1" size={10} /> USDT
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              创建于: {order.createdAt.toLocaleDateString()}
              {order.status === 'paused' && (
                <span className="ml-2 text-yellow-500">(已暂停)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-10">
      {/* 商人订单管理区域 */}
      <div className="tech-card mb-8">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaWallet className="w-6 h-6 text-primary" />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">我的订单管理</h2>
              <button
                onClick={handleCreateOrder}
                className="neon-button py-2 px-4 flex items-center"
              >
                <FaPlus className="mr-1" /> 创建订单
              </button>
            </div>

            {wallet.isConnected ? (
              renderOrders()
            ) : (
              <div className="text-center py-10 border border-dashed border-gray-700 rounded-md">
                <p className="text-gray-400">请先连接钱包</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建订单模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4">
          <div className="tech-card p-6 max-w-md w-full mx-auto relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-4">创建新订单</h3>

            {renderOrderForm()}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                取消
              </button>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 neon-button py-2.5"
              >
                {isSubmitting ? '提交中...' : '创建订单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑订单模态框 */}
      {showEditModal && currentOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4">
          <div className="tech-card p-6 max-w-md w-full mx-auto relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-4">编辑订单</h3>

            {renderOrderForm()}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                取消
              </button>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 neon-button py-2.5"
              >
                {isSubmitting ? '提交中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantOrders;
