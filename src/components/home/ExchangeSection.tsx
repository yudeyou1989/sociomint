'use client';

import { useState, useEffect } from 'react';
import { FaExchangeAlt, FaGasPump } from 'react-icons/fa';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaArrowDown,
  FaArrowUp
} from 'react-icons/fa';
import { InputValidator, SecurityConfig } from '@/lib/security';
import { ExchangeSectionProps } from '@/types/components';
import { ExchangeStats } from '@/types/global';

export default function ExchangeSection(props: Partial<ExchangeSectionProps> = {}) {
  const { stats, onExchange, isLoading: externalLoading, className, ...otherProps } = props;
  const { wallet, updateBalances } = useWallet();

  // 输入值
  const [inputAmount, setInputAmount] = useState<string>('');
  // 输出值
  const [outputAmount, setOutputAmount] = useState<string>('0');
  // 模拟汇率 (1 BNB = ? SM)
  const [exchangeRate, setExchangeRate] = useState<number>(1200);
  // 处理状态
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 模拟获取汇率
  useEffect(() => {
    // 在实际应用中，这里应该从预言机或API获取实时汇率
    const fetchExchangeRate = async () => {
      try {
        // 模拟API请求延迟
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // 随机生成1100-1300之间的汇率
        const rate = 1100 + Math.floor(Math.random() * 200);
        setExchangeRate(rate);
      } catch (error) {
        console.error('获取汇率失败:', error);
      }
    };

    fetchExchangeRate();
    // 每30秒更新一次汇率
    const interval = setInterval(fetchExchangeRate, 30000);

    return () => clearInterval(interval as NodeJS.Timeout);
  }, []);

  // 根据输入计算输出
  const calculateOutput = (input: string) => {
    if (!input || isNaN(Number(input))) {
      return '0';
    }

    const bnbAmount = parseFloat(input);
    const smAmount = bnbAmount * exchangeRate;

    return smAmount.toFixed(2);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 使用安全的输入验证
    if (value === '' || InputValidator.validateNumber(value)) {
      // 检查数值范围
      const numValue = parseFloat(value);
      if (value !== '' && !InputValidator.validateRange(numValue, SecurityConfig.numberLimits.minAmount, SecurityConfig.numberLimits.maxAmount)) {
        return; // 超出范围，不更新
      }

      setInputAmount(value);
      setOutputAmount(calculateOutput(value));
    }
  };

  // 处理兑换操作
  const handleExchange = async () => {
    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      alert('请输入有效的BNB数量');
      return;
    }

    const bnbAmount = parseFloat(inputAmount);
    const currentBnbBalance = wallet.balance ? parseFloat(wallet.balance.bnb) : 0;
    if (bnbAmount > currentBnbBalance) {
      alert('BNB余额不足');
      return;
    }

    setIsProcessing(true);

    try {
      // 在实际应用中，这里应该调用智能合约进行实际兑换
      // 模拟交易延迟
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 计算SM数量
      const smAmount = bnbAmount * exchangeRate;

      // 更新余额 - 调用钱包服务重新获取余额
      await updateBalances();

      // 重置表单
      setInputAmount('');
      setOutputAmount('0');

      // 显示成功消息
      alert(
        `兑换成功！您已将 ${bnbAmount} BNB 兑换为 ${smAmount.toFixed(2)} SM`,
      );
    } catch (error) {
      console.error('兑换失败:', error);
      alert('兑换失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 最大可兑换金额
  const handleMaxAmount = () => {
    if (wallet.isConnected && wallet.balance) {
      const bnbBalance = parseFloat(wallet.balance.bnb);
      if (bnbBalance > 0) {
        // 保留4位小数
        const maxAmount = Math.max(0, bnbBalance).toFixed(4);
        setInputAmount(maxAmount);
        setOutputAmount(calculateOutput(maxAmount));
      }
    }
  };

  return (
    <div className={`glass-card p-6 ${className || ''}`} {...otherProps}>
      <h2 className="text-2xl font-bold mb-6">BNB兑换SM</h2>

      {/* 汇率显示 */}
      <div className="flex items-center justify-between mb-6 p-3 bg-black/30 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <FaExchangeAlt className="text-primary" />
          <span className="text-sm text-gray-300">当前汇率</span>
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
            <label className="text-sm text-gray-400">从</label>
            {wallet.isConnected && wallet.balance && (
              <div className="text-xs text-gray-400">
                余额: {parseFloat(wallet.balance.bnb).toFixed(4)} BNB
                <button
                  onClick={handleMaxAmount}
                  className="ml-2 text-primary text-xs hover:underline"
                >
                  最大
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
              disabled={isProcessing}
            />
            <div className="flex items-center gap-2 font-medium">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                B
              </div>
              BNB
            </div>
          </div>
        </div>

        {/* 输出框 - SM */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-400">至</label>
            {wallet.isConnected && wallet.balance && wallet.balance.sm && (
              <div className="text-xs text-gray-400">
                余额: {parseFloat(wallet.balance.sm).toFixed(2)} SM
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="text"
              value={outputAmount}
              readOnly
              className="bg-transparent text-white text-xl w-full focus:outline-none"
            />
            <div className="flex items-center gap-2 font-medium">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                SM
              </div>
              SM
            </div>
          </div>
        </div>
      </div>

      {/* Gas费提示 */}
      <div className="flex items-center gap-2 mt-4 mb-6 text-sm text-gray-400">
        <FaGasPump className="text-yellow-500" />
        <span>您需要支付少量BNB作为Gas费用</span>
      </div>

      {/* 兑换按钮 */}
      <button
        onClick={handleExchange}
        disabled={
          isProcessing ||
          !wallet.isConnected ||
          !inputAmount ||
          parseFloat(inputAmount) <= 0
        }
        className={`w-full py-3 px-4 rounded-md flex items-center justify-center gap-2 ${
          isProcessing ||
          !wallet.isConnected ||
          !inputAmount ||
          parseFloat(inputAmount) <= 0
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'neon-button'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            处理中...
          </>
        ) : (
          '兑换'
        )}
      </button>

      {!wallet.isConnected && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-400">
          <p>请先连接钱包以使用兑换功能</p>
        </div>
      )}
    </div>
  );
}
