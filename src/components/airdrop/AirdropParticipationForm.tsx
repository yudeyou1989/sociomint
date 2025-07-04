/**
 * 空投池参与表单组件
 * 用户参与小红花空投池的表单
 */

import React, { useState, useEffect } from 'react';
import { AirdropParticipationFormProps } from '@/types/components';
import { NumberInput } from '@/components/ui/SecureInput';
import { useWallet } from '@/contexts/WalletContext';
import { secureHttpClient } from '@/lib/secureHttpClient';

export default function AirdropParticipationForm({
  pool,
  userFlowerBalance,
  onSubmit,
  isSubmitting = false,
  className,
  ...props
}: AirdropParticipationFormProps) {
  const { wallet } = useWallet();
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 验证输入
  useEffect(() => {
    const amount = parseInt(entryAmount);
    
    if (!entryAmount || isNaN(amount)) {
      setIsValid(false);
      setError('');
      return;
    }

    if (amount < pool.entryFee) {
      setIsValid(false);
      setError(`最少需要 ${pool.entryFee} 小红花`);
      return;
    }

    if (amount > userFlowerBalance) {
      setIsValid(false);
      setError('小红花余额不足');
      return;
    }

    setIsValid(true);
    setError('');
  }, [entryAmount, pool.entryFee, userFlowerBalance]);

  // 设置最小金额
  const handleMinAmount = () => {
    setEntryAmount(pool.entryFee.toString());
  };

  // 设置最大金额
  const handleMaxAmount = () => {
    setEntryAmount(userFlowerBalance.toString());
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || isSubmitting) return;

    try {
      await onSubmit(parseInt(entryAmount));
      setEntryAmount('');
    } catch (error) {
      console.error('参与空投池失败:', error);
    }
  };

  // 计算预期奖励比例
  const calculateRewardRatio = (): string => {
    if (!entryAmount || isNaN(parseInt(entryAmount))) return '0';
    
    const amount = parseInt(entryAmount);
    const totalPool = pool.currentParticipants * pool.entryFee + amount;
    const ratio = (amount / totalPool) * 100;
    
    return ratio.toFixed(2);
  };

  // 计算预期奖励
  const calculateExpectedReward = (): string => {
    if (!entryAmount || isNaN(parseInt(entryAmount))) return '0';
    
    const ratio = parseFloat(calculateRewardRatio()) / 100;
    const expectedReward = parseFloat(pool.totalReward) * ratio;
    
    return expectedReward.toFixed(6);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`} {...props}>
      <h3 className="text-lg font-semibold mb-4">参与空投池</h3>
      
      {/* 空投池信息 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-2">{pool.name}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">总奖励:</span>
            <span className="ml-2 font-medium">{pool.totalReward} {pool.tokenType}</span>
          </div>
          <div>
            <span className="text-gray-600">最低入场:</span>
            <span className="ml-2 font-medium">🌺 {pool.entryFee}</span>
          </div>
          <div>
            <span className="text-gray-600">参与人数:</span>
            <span className="ml-2 font-medium">{pool.currentParticipants}/{pool.maxParticipants}</span>
          </div>
          <div>
            <span className="text-gray-600">结束时间:</span>
            <span className="ml-2 font-medium">
              {new Date(pool.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* 用户余额 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">您的小红花余额:</span>
          <span className="font-medium">🌺 {userFlowerBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* 参与表单 */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投入小红花数量
          </label>
          <div className="relative">
            <NumberInput
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              placeholder={`最少 ${pool.entryFee} 小红花`}
              minValue={pool.entryFee}
              maxValue={userFlowerBalance}
              className="w-full"
              disabled={isSubmitting}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-red-500">🌺</span>
            </div>
          </div>
          
          {/* 快速选择按钮 */}
          <div className="flex space-x-2 mt-2">
            <button
              type="button"
              onClick={handleMinAmount}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isSubmitting}
            >
              最小
            </button>
            <button
              type="button"
              onClick={handleMaxAmount}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isSubmitting}
            >
              全部
            </button>
          </div>
          
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* 预期奖励 */}
        {entryAmount && isValid && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-medium text-blue-800 mb-2">预期奖励</h5>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>奖励比例:</span>
                <span>{calculateRewardRatio()}%</span>
              </div>
              <div className="flex justify-between">
                <span>预期获得:</span>
                <span className="font-medium">
                  {calculateExpectedReward()} {pool.tokenType}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              * 实际奖励根据最终参与总额按比例分配
            </p>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting || !wallet.isConnected}
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            !isValid || isSubmitting || !wallet.isConnected
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? '参与中...' : wallet.isConnected ? '确认参与' : '请连接钱包'}
        </button>
      </form>

      {/* 风险提示 */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <h5 className="text-sm font-medium text-yellow-800 mb-1">风险提示</h5>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• 参与后无法退出，请谨慎投入</li>
          <li>• 奖励按最终参与比例分配</li>
          <li>• 分发时间为空投池结束后</li>
          <li>• 请确保钱包地址正确</li>
        </ul>
      </div>
    </div>
  );
}
