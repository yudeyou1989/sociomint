'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/contexts/WalletContext';
import XPlatformVerification from '../presale/XPlatformVerification';
import { formatEther, parseEther } from 'viem';

// 简化的UI组件
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
      disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
        : 'bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] hover:from-[#0bc9e0] hover:to-[#7a35e0] text-white'
    } ${className}`}
  >
    {children}
  </button>
);

interface InputProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({ value, onChange, placeholder, disabled = false, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${className}`}
  />
);

// 图标组件
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

// 代币兑换模式
type ExchangeMode = 'BNB_TO_SM' | 'SM_TO_BNB';

export default function TokenExchange() {
  const { t } = useTranslation();
  const { wallet } = useWallet();
  
  const [fromAmount, setFromAmount] = useState<string>('0.0');
  const [toAmount, setToAmount] = useState<string>('0');
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>('BNB_TO_SM');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // 转换钱包类型
  const typedWallet = wallet as any;
  const isConnected = typedWallet?.isConnected || false;
  const address = typedWallet?.address || '';

  // 汇率常量
  const exchangeRate = 100; // 1 BNB = 100 SM
  const feePercentage = 5; // 5% 手续费

  // 当输入金额变化时计算输出金额
  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setFromAmount(value);
    
    try {
      const numValue = parseFloat(value) || 0;
      if (exchangeMode === 'BNB_TO_SM') {
        // BNB → SM: 没有手续费
        setToAmount((numValue * exchangeRate).toString());
      } else {
        // SM → BNB: 扣除5%手续费
        const bnbAmount = numValue / exchangeRate;
        const feeAmount = bnbAmount * (feePercentage / 100);
        setToAmount((bnbAmount - feeAmount).toString());
      }
    } catch (error) {
      setToAmount('0');
    }
  };

  // 切换兑换模式
  const toggleExchangeMode = () => {
    setExchangeMode(prevMode => prevMode === 'BNB_TO_SM' ? 'SM_TO_BNB' : 'BNB_TO_SM');
    setFromAmount('0.0');
    setToAmount('0');
  };

  // 执行兑换操作
  const handleExchange = async () => {
    if (!isConnected) {
      if (typedWallet?.connect) {
        await typedWallet.connect();
      }
      return;
    }

    if (!isVerified) {
      setErrorMessage(t('exchange.pleaseVerify'));
      return;
    }

    const fromAmountNum = parseFloat(fromAmount);
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) {
      setErrorMessage(t('exchange.invalidAmount'));
      return;
    }

    // 检查最小兑换金额限制（根据模式不同）
    const minAmount = exchangeMode === 'BNB_TO_SM' ? 0.01 : 1;
    if (fromAmountNum < minAmount) {
      setErrorMessage(
        exchangeMode === 'BNB_TO_SM'
          ? t('exchange.minBnbAmount', { amount: minAmount })
          : t('exchange.minSmAmount', { amount: minAmount })
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // 模拟兑换过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 成功消息
      setSuccessMessage(
        exchangeMode === 'BNB_TO_SM'
          ? t('exchange.bnbToSmSuccess', { from: fromAmount, to: toAmount })
          : t('exchange.smToBnbSuccess', { from: fromAmount, to: toAmount })
      );

      // 重置输入
      setFromAmount('0.0');
      setToAmount('0');
    } catch (error: any) {
      console.error('兑换错误:', error);
      setErrorMessage(error.message || t('exchange.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 监听兑换模式变化
  useEffect(() => {
    // 重新计算兑换金额
    if (fromAmount && fromAmount !== '0.0') {
      handleFromAmountChange({ target: { value: fromAmount } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [exchangeMode]);

  // 自定义验证成功处理函数
  const handleVerificationSuccess = () => {
    setIsVerified(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 左侧：兑换面板 */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
          {t('exchange.title')}
        </h2>
        
        <div className="space-y-6">
          {/* 当前汇率显示 */}
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-400">{t('exchange.currentRate')}:</span>
              <span className="font-medium">1 BNB = {exchangeRate} SM</span>
            </div>
            {exchangeMode === 'SM_TO_BNB' && (
              <div className="text-xs text-yellow-500 mt-1">
                {t('exchange.feeWarning', { percentage: feePercentage })}
              </div>
            )}
          </div>
          
          {/* 从金额输入 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-400">
                {exchangeMode === 'BNB_TO_SM' ? t('exchange.fromBnb') : t('exchange.fromSm')}
              </label>
              {isConnected && (
                <button 
                  className="text-xs text-blue-400 hover:text-blue-300" 
                  onClick={() => {
                    // 模拟最大可用余额
                    const maxAmount = exchangeMode === 'BNB_TO_SM' ? '1.5' : '150';
                    setFromAmount(maxAmount);
                    handleFromAmountChange({ target: { value: maxAmount } } as React.ChangeEvent<HTMLInputElement>);
                  }}
                >
                  {t('exchange.max')}
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                value={fromAmount}
                onChange={handleFromAmountChange}
                placeholder="0.0"
                disabled={isLoading || !isConnected}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 font-medium">
                {exchangeMode === 'BNB_TO_SM' ? 'BNB' : 'SM'}
              </div>
            </div>
          </div>
          
          {/* 切换按钮 */}
          <div className="flex justify-center">
            <button 
              onClick={toggleExchangeMode}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <SwapIcon />
            </button>
          </div>
          
          {/* 到金额显示 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              {exchangeMode === 'BNB_TO_SM' ? t('exchange.toSm') : t('exchange.toBnb')}
            </label>
            <div className="relative">
              <Input
                value={toAmount}
                placeholder="0.0"
                disabled={true}
                className="opacity-80"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 font-medium">
                {exchangeMode === 'BNB_TO_SM' ? 'SM' : 'BNB'}
              </div>
            </div>
          </div>
          
          {/* 错误和成功消息 */}
          {errorMessage && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-900/30 text-green-400 p-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          
          {/* 兑换按钮 */}
          <Button
            onClick={handleExchange}
            disabled={isLoading || !isConnected || parseFloat(fromAmount) <= 0}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.loading')}
              </div>
            ) : !isConnected ? (
              t('wallet.connect')
            ) : (
              exchangeMode === 'BNB_TO_SM' 
                ? t('exchange.exchangeToSm') 
                : t('exchange.exchangeToBnb')
            )}
          </Button>
          
          {/* Gas费提醒 */}
          <div className="text-center text-xs text-gray-500">
            {t('exchange.gasFeeNotice')}
          </div>
        </div>
      </div>
      
      {/* 右侧：社交验证面板 */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
        <XPlatformVerification onVerificationSuccess={handleVerificationSuccess} />
      </div>
    </div>
  );
} 