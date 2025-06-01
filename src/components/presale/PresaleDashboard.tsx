'use client';

import { useState, useEffect, ReactNode, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { parseEther, formatEther } from 'viem';
import { FaArrowDown, FaExchangeAlt } from 'react-icons/fa';
import XPlatformVerification from '../../components/presale/XPlatformVerification';
import { usePresaleContract } from '../../hooks/contracts/usePresaleContracts';
import { useWallet } from '../../contexts/WalletContext';

// 添加Wallet类型定义
interface WalletType {
  isConnected?: boolean;
  address?: string;
  balance?: {
    bnb: number;
    sm?: number;
  };
  connect?: () => void;
  updateBalances?: () => Promise<void>;
}

// 添加合约数据类型
interface PresaleContractData {
  purchaseTokens: (amount: bigint) => Promise<void>;
  isLoading: boolean;
  presaleEnded?: boolean;
  currentPrice?: bigint;
  soldTokens?: bigint;
  totalPresaleTokens?: bigint;
  minPurchaseAmount?: bigint;
  maxPurchaseAmount?: bigint;
  userPurchase?: bigint[];
}

// 添加UI组件接口定义
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'md' | 'lg';
}

// 简化UI组件实现，避免依赖外部库
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className = "", 
  variant = "default", 
  size = "md" 
}: ButtonProps) => {
  const baseClass = "rounded-md font-medium transition-colors";
  const sizeClass = size === "lg" ? "py-3 px-6 text-lg" : "py-2 px-4";
  const variantClass = variant === "default" ? "bg-primary hover:bg-primary/90 text-white" : "border border-gray-600 hover:bg-gray-800 text-white";
  
  return (
    <button 
      className={`${baseClass} ${sizeClass} ${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface ProgressProps {
  value: number;
  className?: string;
}

const Progress = ({ value, className = "" }: ProgressProps) => {
  return (
    <div className={`w-full bg-gray-800 rounded-full ${className}`}>
      <div 
        className="bg-primary rounded-full h-full transition-all duration-500"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};

interface AlertProps {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
}

const Alert = ({ children, variant = "default", className = "" }: AlertProps) => {
  const variantClass = variant === "destructive" 
    ? "bg-red-900/30 border-red-500 text-red-200" 
    : variant === "success" 
      ? "bg-green-900/30 border-green-500 text-green-200" 
      : "bg-gray-800 border-gray-700 text-gray-200";
  
  return (
    <div className={`border rounded-md p-4 ${variantClass} ${className}`}>
      {children}
    </div>
  );
};

interface AlertTitleProps {
  children: ReactNode;
}

const AlertTitle = ({ children }: AlertTitleProps) => (
  <h5 className="font-bold mb-1">{children}</h5>
);

interface AlertDescriptionProps {
  children: ReactNode;
}

const AlertDescription = ({ children }: AlertDescriptionProps) => (
  <div className="text-sm">{children}</div>
);

export default function PresaleDashboard() {
  const { t } = useTranslation();
  const { wallet } = useWallet();
  const typedWallet = wallet as unknown as WalletType;
  const isConnected = typedWallet?.isConnected || false;
  
  // 预售合约Hooks - 添加默认值解决类型问题
  const contractData = usePresaleContract() as unknown as PresaleContractData;
  
  const { 
    purchaseTokens, 
    isLoading,
    presaleEnded = false
  } = contractData;

  // 将BigInt字面量改为BigInt函数调用
  const defaultBigInt = BigInt(0);
  const safeCurrentPrice = contractData.currentPrice || defaultBigInt;
  const safeSoldTokens = contractData.soldTokens || defaultBigInt;
  const safeTotalPresaleTokens = contractData.totalPresaleTokens || defaultBigInt;
  const safeMinPurchaseAmount = contractData.minPurchaseAmount || defaultBigInt;
  const safeMaxPurchaseAmount = contractData.maxPurchaseAmount || defaultBigInt;
  const safeUserPurchase = contractData.userPurchase || [defaultBigInt, defaultBigInt, defaultBigInt, false];

  // 状态变量
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('0');
  const [presaleProgress, setPresaleProgress] = useState(0);
  const [transactionError, setTransactionError] = useState('');
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  // 计算兑换率和输出金额
  useEffect(() => {
    if (safeCurrentPrice > defaultBigInt) {
      try {
        const rate = Number(formatEther(safeCurrentPrice));
        setExchangeRate(rate.toLocaleString());
        
        // 计算用户将获得的SM代币数量
        if (inputAmount && !isNaN(Number(inputAmount))) {
          const bnbAmount = Number(inputAmount);
          const smAmount = bnbAmount * rate;
          setOutputAmount(smAmount.toLocaleString());
        } else {
          setOutputAmount('0');
        }
      } catch (error) {
        console.error("计算兑换率错误:", error);
      }
    }
  }, [safeCurrentPrice, inputAmount, defaultBigInt]);

  // 计算预售进度
  useEffect(() => {
    if (safeSoldTokens > defaultBigInt && safeTotalPresaleTokens > defaultBigInt) {
      try {
        const sold = Number(formatEther(safeSoldTokens));
        const total = Number(formatEther(safeTotalPresaleTokens));
        const progress = (sold / total) * 100;
        setPresaleProgress(Math.min(progress, 100));
      } catch (error) {
        console.error("计算进度错误:", error);
      }
    }
  }, [safeSoldTokens, safeTotalPresaleTokens, defaultBigInt]);

  // 处理输入金额变化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || (/^\d*\.?\d*$/.test(value) && !isNaN(Number(value)))) {
      setInputAmount(value);
    }
  };

  // 处理最大金额按钮
  const handleMaxAmount = () => {
    if (typedWallet?.isConnected && typedWallet?.balance && typedWallet.balance.bnb > 0) {
      // 保留一点BNB用于支付gas费用
      const maxBnb = Math.max(0, typedWallet.balance.bnb - 0.01);
      setInputAmount(maxBnb.toString());
    }
  };

  // 处理钱包连接
  const handleConnectWallet = () => {
    if (typedWallet && typeof typedWallet.connect === 'function') {
      typedWallet.connect();
    }
  };

  // 处理代币购买
  const handlePurchase = async () => {
    if (!isConnected) {
      handleConnectWallet();
      return;
    }
    
    if (!inputAmount || Number(inputAmount) <= 0) {
      setTransactionError(t('exchange.insufficientBalance'));
      return;
    }
    
    try {
      setIsProcessing(true);
      setTransactionError('');
      
      // 转换为Wei单位
      const bnbAmount = parseEther(inputAmount);
      
      // 检查是否在购买范围内
      if (safeMinPurchaseAmount > defaultBigInt && bnbAmount < safeMinPurchaseAmount) {
        throw new Error(`${t('presale.minPurchase')}: ${formatEther(safeMinPurchaseAmount)} BNB`);
      }
      
      if (safeMaxPurchaseAmount > defaultBigInt && bnbAmount > safeMaxPurchaseAmount) {
        throw new Error(`${t('presale.maxPurchase')}: ${formatEther(safeMaxPurchaseAmount)} BNB`);
      }
      
      // 调用合约购买函数
      await purchaseTokens(bnbAmount);
      
      // 更新钱包余额
      if (typedWallet && typeof typedWallet.updateBalances === 'function') {
        await typedWallet.updateBalances();
      }
      
      // 显示成功消息
      setTransactionSuccess(true);
      setInputAmount('');
      setOutputAmount('0');
      
      // 5秒后隐藏成功消息
      setTimeout(() => {
        setTransactionSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Purchase error:', error);
      setTransactionError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const safeFormatEther = (value: unknown): string => {
    try {
      if (typeof value === 'bigint') {
        return formatEther(value);
      }
    } catch (error) {
      console.error("formatEther error:", error);
    }
    return '0';
  };

  const getArrayItemSafely = (arr: unknown, index: number): bigint => {
    if (Array.isArray(arr) && index < arr.length && typeof arr[index] === 'bigint') {
      return arr[index] as bigint;
    }
    return defaultBigInt;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：预售信息 */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">{t('presale.title')}</h2>
            
            {/* 预售状态 */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('presale.soldTokens')}</span>
                <span className="font-medium">
                  {safeFormatEther(safeSoldTokens)} SM
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('presale.totalSupply')}</span>
                <span className="font-medium">
                  {safeFormatEther(safeTotalPresaleTokens)} SM
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('presale.exchangeRate')}</span>
                <span className="text-primary font-medium">
                  1 BNB = {exchangeRate} SM
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('presale.progress')}</span>
                  <span className="font-medium">{presaleProgress.toFixed(2)}%</span>
                </div>
                <Progress value={presaleProgress} className="h-2" />
              </div>
            </div>
            
            {/* 验证组件 */}
            <XPlatformVerification />
          </div>
          
          {/* 用户参与信息 */}
          {isConnected && Array.isArray(safeUserPurchase) && safeUserPurchase.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">{t('presale.purchaseTitle')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">{t('exchange.bnbToSm')}</span>
                  <span>{safeFormatEther(getArrayItemSafely(safeUserPurchase, 0))} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">{t('presale.purchaseTitle')}</span>
                  <span>{safeFormatEther(getArrayItemSafely(safeUserPurchase, 2))} SM</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧：兑换模块 */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">{t('exchange.bnbToSm')}</h2>

          {/* 汇率显示 */}
          <div className="flex items-center justify-between mb-6 p-3 bg-black/30 rounded-lg border border-gray-800">
            <div className="flex items-center gap-2">
              <FaExchangeAlt className="text-primary" />
              <span className="text-sm text-gray-300">{t('exchange.currentRate')}</span>
            </div>
            <div className="font-medium">
              1 BNB = <span className="text-primary">{exchangeRate}</span> SM
            </div>
          </div>

          {/* 兑换表单 */}
          <div className="space-y-4">
            {/* 输入框 - BNB */}
            <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">{t('exchange.from')}</label>
                {typedWallet?.isConnected && typedWallet?.balance && (
                  <div className="text-xs text-gray-400">
                    {t('exchange.balance')}: {typedWallet.balance.bnb.toFixed(4) || '0.0000'} BNB
                    <button
                      onClick={handleMaxAmount}
                      className="ml-2 text-primary text-xs hover:underline"
                    >
                      {t('exchange.max')}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="text"
                  value={inputAmount}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  className="bg-transparent text-white text-xl w-full focus:outline-none"
                  disabled={isProcessing || !isConnected}
                />
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                    B
                  </div>
                  BNB
                </div>
              </div>
            </div>

            {/* 箭头 */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <FaArrowDown className="text-primary" />
              </div>
            </div>

            {/* 输出框 - SM */}
            <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">{t('exchange.to')}</label>
              </div>

              <div className="flex items-center">
                <input
                  type="text"
                  value={outputAmount}
                  placeholder="0.0"
                  className="bg-transparent text-white text-xl w-full focus:outline-none"
                  disabled={true}
                />
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-black">
                    SM
                  </div>
                  SM
                </div>
              </div>
            </div>

            {/* 错误消息 */}
            {transactionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{transactionError}</AlertDescription>
              </Alert>
            )}

            {/* 成功消息 */}
            {transactionSuccess && (
              <Alert variant="success" className="mt-4">
                <AlertTitle>{t('common.success')}</AlertTitle>
                <AlertDescription>{t('exchange.exchangeSuccess')}</AlertDescription>
              </Alert>
            )}

            {/* 兑换按钮 */}
            <Button
              variant="default"
              size="lg"
              className="w-full mt-4 neon-button"
              disabled={isProcessing || !isConnected || !inputAmount || Number(inputAmount) <= 0}
              onClick={handlePurchase}
            >
              {!isConnected 
                ? t('exchange.connectWalletRequired')
                : isProcessing 
                  ? t('common.loading') 
                  : t('presale.purchaseButton')}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-2">
              {t('exchange.gasRequired')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 