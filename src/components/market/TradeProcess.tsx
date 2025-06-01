'use client';

import { useState, useEffect } from 'react';
import {
  FaCoins,
  FaArrowRight,
  FaWallet,
  FaWeixin,
  FaAlipay,
  FaEthereum,
  FaCheck,
  FaTimes,
  FaUpload,
  FaMoneyBill,
  FaClock,
  FaFileImage,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/contexts/WalletContext';

// 类型定义
type PaymentMethod = 'sm' | 'wechat' | 'alipay' | 'usdt';
type TradeType = 'buy' | 'sell';
type AssetType = 'redFlower' | 'smToken';
type OrderStatus =
  | 'active'
  | 'processing'
  | 'completed'
  | 'canceled'
  | 'disputed';
type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'completed'
  | 'canceled'
  | 'disputed';

// 交易订单接口
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
  status: TransactionStatus;
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

interface TradeProcessProps {
  order: TradeOrder;
  onClose: () => void;
  onSuccess: () => void;
}

const TradeProcess = ({ order, onClose, onSuccess }: TradeProcessProps) => {
  const { wallet, balance } = useWallet();
  const [amount, setAmount] = useState<number>(order.minAmount);
  const [totalPrice, setTotalPrice] = useState<number>(
    order.minAmount * order.price,
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(900); // 15分钟倒计时
  const [countdownInterval, setCountdownInterval] =
    useState<NodeJS.Timeout | null>(null);

  // 处理金额变更
  const handleAmountChange = (value: number) => {
    // 限制在最小和最大数量范围内
    const newAmount = Math.min(
      Math.max(value, order.minAmount),
      order.availableAmount,
    );
    setAmount(newAmount);
    setTotalPrice(newAmount * order.price);
  };

  // 处理支付方式选择
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  // 开始交易
  const handleStartTrade = () => {
    if (!selectedPaymentMethod) {
      toast.error('请选择支付方式');
      return;
    }

    setIsProcessing(true);

    // 模拟交易创建
    setTimeout(() => {
      const now = new Date();

      // 创建交易
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        orderId: order.id,
        buyerId: wallet.address || '',
        sellerId: order.merchantId,
        asset: order.asset,
        amount: amount,
        price: order.price,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          qrCodeUrl: `https://placeholder.pics/svg/300x300/DEDEDE/555555/${selectedPaymentMethod === 'wechat' ? 'WeChat' : selectedPaymentMethod === 'alipay' ? 'Alipay' : 'USDT'}%20QR`,
        },
      };

      setTransaction(newTransaction);
      setCurrentStep(2);
      setIsProcessing(false);

      // 启动倒计时
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // 超时自动取消
            handleCancelTransaction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setCountdownInterval(interval);
    }, 1500);
  };

  // 直接使用SM支付
  const handleDirectPayment = () => {
    if (selectedPaymentMethod !== 'sm') return;

    // 检查余额
    if (balance.sm < totalPrice) {
      toast.error('SM余额不足');
      return;
    }

    setIsProcessing(true);

    // 模拟支付过程
    setTimeout(() => {
      if (transaction) {
        setTransaction({
          ...transaction,
          status: 'paid',
          updatedAt: new Date(),
        });
        setCurrentStep(3);
      }

      setIsProcessing(false);

      // 重置倒计时
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdown(900);

        // 启动新的倒计时
        const newInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(newInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setCountdownInterval(newInterval);
      }

      toast.success('支付成功！等待商家确认');
    }, 2000);
  };

  // 上传支付凭证
  const handleUploadProof = () => {
    if (!paymentProof) {
      toast.error('请先上传支付凭证');
      return;
    }

    setIsProcessing(true);

    // 模拟上传过程
    setTimeout(() => {
      if (transaction) {
        setTransaction({
          ...transaction,
          status: 'paid',
          paymentProofUrl: paymentProofUrl,
          updatedAt: new Date(),
        });
        setCurrentStep(3);
      }

      setIsProcessing(false);

      // 重置倒计时
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdown(900);

        // 启动新的倒计时
        const newInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(newInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setCountdownInterval(newInterval);
      }

      toast.success('凭证已上传！等待商家确认');
    }, 2000);
  };

  // 确认收到资产
  const handleConfirmReceived = () => {
    setIsProcessing(true);

    // 模拟确认过程
    setTimeout(() => {
      if (transaction) {
        setTransaction({
          ...transaction,
          status: 'completed',
          updatedAt: new Date(),
        });
      }

      setIsProcessing(false);

      // 清除倒计时
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      toast.success('交易完成！');

      // 延迟关闭并刷新
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  // 取消交易
  const handleCancelTransaction = () => {
    if (!window.confirm('确定要取消此交易吗？')) return;

    setIsProcessing(true);

    // 模拟取消过程
    setTimeout(() => {
      if (transaction) {
        setTransaction({
          ...transaction,
          status: 'canceled',
          updatedAt: new Date(),
        });
      }

      setIsProcessing(false);

      // 清除倒计时
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      toast.success('交易已取消');

      // 延迟关闭
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1500);
  };

  // 发起争议
  const handleDispute = () => {
    const reason = prompt('请简要描述争议原因:');
    if (!reason) return;

    setIsProcessing(true);

    // 模拟争议过程
    setTimeout(() => {
      if (transaction) {
        setTransaction({
          ...transaction,
          status: 'disputed',
          disputeReason: reason,
          updatedAt: new Date(),
        });
      }

      setIsProcessing(false);

      // 清除倒计时
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      toast.success('争议已提交，等待处理');

      // 延迟关闭
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1500);
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 检查文件类型
      if (!file.type.includes('image')) {
        toast.error('请上传图片格式的凭证');
        return;
      }

      // 检查文件大小 (2MB限制)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片大小不能超过2MB');
        return;
      }

      setPaymentProof(file);

      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setPaymentProofUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除倒计时（组件卸载时）
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // 格式化倒计时
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 渲染第一步：交易信息确认
  const renderStep1 = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">确认交易详情</h3>

      <div className="mb-4 p-4 bg-gray-800/40 rounded-md border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">交易类型</span>
          <span className="font-medium">
            {order.type === 'sell' ? '购买' : '出售'}
            {order.asset === 'redFlower' ? '小红花' : 'SM代币'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">商家</span>
          <span className="font-medium flex items-center">
            {order.merchantName}
            {order.isMedalist && (
              <FaCheck className="ml-1 text-yellow-400" size={12} />
            )}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">单价</span>
          <span className="font-medium">¥{order.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-300 mb-2">交易数量</label>
        <div className="flex">
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            min={order.minAmount}
            max={order.availableAmount}
            className="flex-1 p-3 rounded-l-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
          />
          <div className="bg-gray-700 p-3 rounded-r-md flex items-center justify-center min-w-20">
            {order.asset === 'redFlower' ? '小红花' : 'SM'}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">最小: {order.minAmount}</span>
          <span className="text-xs text-gray-400">
            最大: {order.availableAmount}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-300 mb-2">支付方式</label>
        <div className="grid grid-cols-2 gap-3">
          {order.paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleSelectPaymentMethod(method)}
              className={`p-3 rounded-md border transition-colors flex items-center justify-center ${
                selectedPaymentMethod === method
                  ? 'border-primary bg-primary/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              {method === 'sm' && <FaCoins className="mr-2 text-primary" />}
              {method === 'wechat' && (
                <FaWeixin className="mr-2 text-green-500" />
              )}
              {method === 'alipay' && (
                <FaAlipay className="mr-2 text-blue-500" />
              )}
              {method === 'usdt' && (
                <FaEthereum className="mr-2 text-teal-500" />
              )}

              {method === 'sm' && 'SM代币'}
              {method === 'wechat' && '微信'}
              {method === 'alipay' && '支付宝'}
              {method === 'usdt' && 'USDT'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-800/40 rounded-md border border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-300">总金额</span>
          <span className="font-bold text-xl text-primary">
            ¥{totalPrice.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {amount} {order.asset === 'redFlower' ? '小红花' : 'SM'} × ¥
          {order.price.toFixed(2)}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
        >
          取消
        </button>

        <button
          onClick={handleStartTrade}
          disabled={!selectedPaymentMethod || isProcessing}
          className="flex-1 neon-button py-2.5 flex items-center justify-center"
        >
          {isProcessing ? '处理中...' : '确认交易'}
        </button>
      </div>
    </div>
  );

  // 渲染第二步：支付
  const renderStep2 = () => {
    if (!transaction) return null;

    if (transaction.paymentMethod === 'sm') {
      return (
        <div>
          <h3 className="text-xl font-bold mb-4">支付SM代币</h3>

          <div className="mb-4 p-4 bg-gray-800/40 rounded-md border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">支付方式</span>
              <span className="font-medium flex items-center">
                <FaCoins className="mr-1 text-primary" /> SM代币
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">交易数量</span>
              <span className="font-medium">
                {transaction.amount}{' '}
                {transaction.asset === 'redFlower' ? '小红花' : 'SM'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">需支付金额</span>
              <span className="font-bold text-primary">
                {transaction.totalPrice.toFixed(2)} SM
              </span>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gray-800/40 rounded-md border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">当前钱包余额</span>
              <span className="font-medium">{balance.sm.toFixed(2)} SM</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">交易后余额</span>
              <span
                className={`font-medium ${balance.sm < transaction.totalPrice ? 'text-red-500' : 'text-green-500'}`}
              >
                {(balance.sm - transaction.totalPrice).toFixed(2)} SM
              </span>
            </div>
          </div>

          <div className="mb-6 text-center">
            <div className="text-sm flex items-center justify-center text-yellow-500 mb-2">
              <FaClock className="mr-1" /> 订单将在 {formatCountdown()}{' '}
              后自动取消
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCancelTransaction}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              取消交易
            </button>

            <button
              onClick={handleDirectPayment}
              disabled={isProcessing || balance.sm < transaction.totalPrice}
              className="flex-1 neon-button py-2.5 flex items-center justify-center"
            >
              {isProcessing ? '处理中...' : '确认支付'}
            </button>
          </div>

          {balance.sm < transaction.totalPrice && (
            <div className="mt-3 text-red-500 text-sm text-center">
              余额不足，无法完成支付
            </div>
          )}
        </div>
      );
    } else {
      // 其他支付方式
      return (
        <div>
          <h3 className="text-xl font-bold mb-4">
            {transaction.paymentMethod === 'wechat'
              ? '微信支付'
              : transaction.paymentMethod === 'alipay'
                ? '支付宝支付'
                : 'USDT支付'}
          </h3>

          <div className="mb-4 p-4 bg-gray-800/40 rounded-md border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">交易数量</span>
              <span className="font-medium">
                {transaction.amount}{' '}
                {transaction.asset === 'redFlower' ? '小红花' : 'SM'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">需支付金额</span>
              <span className="font-bold text-primary">
                ¥{transaction.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-gray-300 mb-2">
                请使用
                {transaction.paymentMethod === 'wechat'
                  ? '微信'
                  : transaction.paymentMethod === 'alipay'
                    ? '支付宝'
                    : 'USDT钱包'}
                扫描以下二维码支付
              </p>

              <div className="mx-auto bg-white p-3 rounded-md inline-block">
                <img
                  src={transaction.paymentDetails?.qrCodeUrl || ''}
                  alt="Payment QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="border border-dashed border-gray-700 rounded-md p-4 mb-4">
              <h4 className="font-medium mb-2 text-center">
                支付完成后上传凭证
              </h4>

              {paymentProofUrl ? (
                <div className="relative w-full h-40 border border-gray-700 rounded-md overflow-hidden mb-3">
                  <img
                    src={paymentProofUrl}
                    alt="Payment Proof"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setPaymentProof(null);
                      setPaymentProofUrl('');
                    }}
                    className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-md h-40 cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FaUpload className="mb-2 text-gray-400" size={24} />
                  <span className="text-gray-400">点击上传支付凭证</span>
                  <span className="text-xs text-gray-500 mt-1">
                    支持JPG、PNG格式，不超过2MB
                  </span>
                </label>
              )}
            </div>

            <div className="text-sm flex items-center justify-center text-yellow-500 mb-2">
              <FaClock className="mr-1" /> 订单将在 {formatCountdown()}{' '}
              后自动取消
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCancelTransaction}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              取消交易
            </button>

            <button
              onClick={handleUploadProof}
              disabled={isProcessing || !paymentProof}
              className="flex-1 neon-button py-2.5 flex items-center justify-center"
            >
              {isProcessing ? '处理中...' : '确认已支付'}
            </button>
          </div>
        </div>
      );
    }
  };

  // 渲染第三步：等待确认
  const renderStep3 = () => {
    if (!transaction) return null;

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">等待商家确认</h3>

        <div className="mb-6 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <FaCheck className="text-green-500" size={36} />
          </div>

          <p className="text-gray-300 mb-2">
            {transaction.paymentMethod === 'sm'
              ? 'SM支付成功'
              : '支付凭证已提交'}
          </p>

          <p className="text-gray-400 text-sm mb-4">
            正在等待商家确认并释放资产，请耐心等待
          </p>

          <div className="p-4 bg-gray-800/40 rounded-md border border-gray-700 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">交易数量</span>
              <span className="font-medium">
                {transaction.amount}{' '}
                {transaction.asset === 'redFlower' ? '小红花' : 'SM'}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300">支付金额</span>
              <span className="font-medium">
                {transaction.paymentMethod === 'sm'
                  ? `${transaction.totalPrice.toFixed(2)} SM`
                  : `¥${transaction.totalPrice.toFixed(2)}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">支付方式</span>
              <span className="font-medium flex items-center">
                {transaction.paymentMethod === 'sm' && (
                  <FaCoins className="mr-1 text-primary" />
                )}
                {transaction.paymentMethod === 'wechat' && (
                  <FaWeixin className="mr-1 text-green-500" />
                )}
                {transaction.paymentMethod === 'alipay' && (
                  <FaAlipay className="mr-1 text-blue-500" />
                )}
                {transaction.paymentMethod === 'usdt' && (
                  <FaEthereum className="mr-1 text-teal-500" />
                )}

                {transaction.paymentMethod === 'sm' && 'SM代币'}
                {transaction.paymentMethod === 'wechat' && '微信'}
                {transaction.paymentMethod === 'alipay' && '支付宝'}
                {transaction.paymentMethod === 'usdt' && 'USDT'}
              </span>
            </div>
          </div>

          <div className="text-sm flex items-center justify-center text-yellow-500">
            <FaClock className="mr-1" /> 预计确认时间: {formatCountdown()}
          </div>
        </div>

        {/* 这里模拟我们是买家，所以有确认收到的按钮 */}
        {order.type === 'buy' && (
          <div className="mb-4">
            <button
              onClick={handleConfirmReceived}
              disabled={isProcessing}
              className="w-full neon-button py-2.5 flex items-center justify-center"
            >
              {isProcessing ? '处理中...' : '确认已收到资产'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              确认前请检查资产是否已到账
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleDispute}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-md transition-colors flex items-center justify-center"
          >
            <FaTimes className="mr-1" /> 提出争议
          </button>
        </div>
      </div>
    );
  };

  // 根据当前步骤渲染内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4">
      <div className="tech-card p-6 max-w-md w-full mx-auto relative max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <FaTimes />
        </button>

        {/* 步骤指示器 */}
        <div className="flex items-center mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1
                ? 'bg-primary text-black'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            1
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-primary' : 'bg-gray-700'
            }`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2
                ? 'bg-primary text-black'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            2
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${
              currentStep >= 3 ? 'bg-primary' : 'bg-gray-700'
            }`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3
                ? 'bg-primary text-black'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            3
          </div>
        </div>

        {/* 步骤内容 */}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default TradeProcess;
