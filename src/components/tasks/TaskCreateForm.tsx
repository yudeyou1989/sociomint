'use client';

import { useState } from 'react';
// // import { "🐦", "📱", "💬" } from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建

const TaskCreateForm = () => {
  const [platform, setPlatform] = useState<'x' | 'telegram' | 'discord'>('x');
  const [rewards, setRewards] = useState({
    follow: 0,
    like: 0,
    retweet: 0,
    comment: 0,
  });
  const [targetUsers, setTargetUsers] = useState<number>(100);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [fee, setFee] = useState<string>('0.1 - 10 SM');
  const [error, setError] = useState<string>('');

  // 平台切换
  const handlePlatformChange = (newPlatform: 'x' | 'telegram' | 'discord') => {
    setPlatform(newPlatform);
  };

  // 奖励变更
  const handleRewardChange = (type: keyof typeof rewards, value: string) => {
    const numValue = parseInt(value) || 0;
    setRewards((prev) => ({
      ...prev,
      [type]: numValue,
    }));

    // 重新计算总成本
    calculateTotalCost({
      ...rewards,
      [type]: numValue,
    });
  };

  // 目标用户变更
  const handleTargetUsersChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setTargetUsers(numValue);
    calculateTotalCost(rewards, numValue);
  };

  // 计算总成本
  const calculateTotalCost = (
    currentRewards = rewards,
    users = targetUsers,
  ) => {
    const totalRewardPerUser = Object.values(currentRewards).reduce(
      (a, b) => a + b,
      0,
    );
    const total = totalRewardPerUser * users;
    setTotalCost(total);

    // 假设的手续费计算
    if (total > 0) {
      setFee('0.1 - 10 SM');
    } else {
      setFee('0 SM');
    }
  };

  // 提交任务
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 简单验证
    if (totalCost <= 0) {
      setError('请设置至少一项奖励');
      return;
    }

    if (targetUsers <= 0) {
      setError('目标用户数必须大于0');
      return;
    }

    // 模拟余额检查
    const mockBalance = 5000; // 假设的小红花余额
    if (totalCost > mockBalance) {
      setError('小红花余额不足，请前往市场');
      return;
    }

    setError('');
    console.log('任务创建：', { platform, rewards, targetUsers, totalCost });
    // 这里可以添加实际的提交逻辑
  };

  return (
    <div className="tech-card">
      <h2 className="text-2xl font-bold mb-6">创建社交曝光任务</h2>

      <form onSubmit={handleSubmit}>
        {/* 平台选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            选择平台
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handlePlatformChange('x')}
              className={`flex items-center px-4 py-2 rounded-md ${
                platform === 'x'
                  ? 'bg-blue-500 bg-opacity-20 border border-blue-500/50 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}
            >
              🐦X (Twitter)
            </button>

            <button
              type="button"
              onClick={() => handlePlatformChange('telegram')}
              className={`flex items-center px-4 py-2 rounded-md ${
                platform === 'telegram'
                  ? 'bg-cyan-500 bg-opacity-20 border border-cyan-500/50 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}
            >
              📱
              Telegram
            </button>

            <button
              type="button"
              onClick={() => handlePlatformChange('discord')}
              className={`flex items-center px-4 py-2 rounded-md ${
                platform === 'discord'
                  ? 'bg-purple-500 bg-opacity-20 border border-purple-500/50 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}
            >
              💬
              Discord
            </button>
          </div>
        </div>

        {/* 奖励设置 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">奖励设置 (小红花)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="follow-reward"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                关注奖励
              </label>
              <input
                id="follow-reward"
                type="number"
                min="0"
                value={rewards.follow}
                onChange={(e) => handleRewardChange('follow', e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label
                htmlFor="like-reward"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                点赞奖励
              </label>
              <input
                id="like-reward"
                type="number"
                min="0"
                value={rewards.like}
                onChange={(e) => handleRewardChange('like', e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label
                htmlFor="retweet-reward"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                转发奖励
              </label>
              <input
                id="retweet-reward"
                type="number"
                min="0"
                value={rewards.retweet}
                onChange={(e) => handleRewardChange('retweet', e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label
                htmlFor="comment-reward"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                评论奖励
              </label>
              <input
                id="comment-reward"
                type="number"
                min="0"
                value={rewards.comment}
                onChange={(e) => handleRewardChange('comment', e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* 目标受众 */}
        <div className="mb-6">
          <label
            htmlFor="target-users"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            需要用户数
          </label>
          <input
            id="target-users"
            type="number"
            min="1"
            value={targetUsers}
            onChange={(e) => handleTargetUsersChange(e.target.value)}
            className="input-field w-full"
          />
        </div>

        {/* 成本计算 */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-md border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">总小红花成本:</span>
            <span className="text-xl font-bold text-primary">{totalCost}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">预计手续费:</span>
            <span className="text-secondary">{fee}</span>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <button type="submit" className="neon-button w-full">
          创建曝光任务
        </button>
      </form>
    </div>
  );
};

export default TaskCreateForm;
