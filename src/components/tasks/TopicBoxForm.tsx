'use client';

import { useState } from 'react';
import { FaTwitter } from 'react-icons/fa';

const TopicBoxForm = () => {
  const [postUrl, setPostUrl] = useState<string>('');
  const [hashtag, setHashtag] = useState<string>('');
  const [boxCount, setBoxCount] = useState<number>(10);
  const [rewardPerBox, setRewardPerBox] = useState<number>(50);
  const [totalCost, setTotalCost] = useState<number>(500);
  const [fee, setFee] = useState<string>('0.1 - 5 SM');
  const [error, setError] = useState<string>('');

  // 链接变更
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostUrl(e.target.value);
  };

  // 话题标签变更
  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 自动添加#号前缀
    if (value && !value.startsWith('#')) {
      setHashtag(`#${value}`);
    } else {
      setHashtag(value);
    }
  };

  // 宝箱数量变更
  const handleBoxCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setBoxCount(value);
    calculateTotalCost(value, rewardPerBox);
  };

  // 奖励变更
  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setRewardPerBox(value < 50 ? 50 : value); // 最低50小红花
    calculateTotalCost(boxCount, value < 50 ? 50 : value);
  };

  // 计算总成本
  const calculateTotalCost = (boxes: number, reward: number) => {
    const total = boxes * reward;
    setTotalCost(total);

    // 假设的手续费计算
    if (total > 0) {
      if (total < 1000) {
        setFee('0.1 - 5 SM');
      } else if (total < 5000) {
        setFee('5 - 20 SM');
      } else {
        setFee('20+ SM');
      }
    } else {
      setFee('0 SM');
    }
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 简单验证
    if (!postUrl) {
      setError('请输入有效的X帖子/话题链接');
      return;
    }

    if (!hashtag) {
      setError('请输入话题标签');
      return;
    }

    if (boxCount <= 0) {
      setError('宝箱数量必须大于0');
      return;
    }

    if (rewardPerBox < 50) {
      setError('每个宝箱奖励至少50小红花');
      return;
    }

    // 模拟余额检查
    const mockBalance = 5000; // 假设的小红花余额
    if (totalCost > mockBalance) {
      setError('小红花余额不足，请前往市场');
      return;
    }

    setError('');
    console.log('宝箱任务创建：', {
      postUrl,
      hashtag,
      boxCount,
      rewardPerBox,
      totalCost,
    });
    // 这里可以添加实际的提交逻辑
  };

  return (
    <div className="tech-card">
      <h2 className="text-2xl font-bold mb-6">创建 X 话题宝箱</h2>

      <form onSubmit={handleSubmit}>
        {/* 平台显示 */}
        <div className="mb-6 flex items-center">
          <FaTwitter className="text-primary w-5 h-5 mr-2" />
          <span className="text-lg">平台: X (Twitter)</span>
        </div>

        {/* X帖子/话题链接 */}
        <div className="mb-6">
          <label
            htmlFor="post-url"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            X 帖子/话题链接
          </label>
          <input
            id="post-url"
            type="text"
            placeholder="https://twitter.com/..."
            value={postUrl}
            onChange={handleUrlChange}
            className="input-field w-full"
          />
        </div>

        {/* 话题标签 */}
        <div className="mb-6">
          <label
            htmlFor="hashtag"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            话题标签 (#)
          </label>
          <input
            id="hashtag"
            type="text"
            placeholder="#SocioMint"
            value={hashtag}
            onChange={handleHashtagChange}
            className="input-field w-full"
          />
        </div>

        {/* 宝箱数量 */}
        <div className="mb-6">
          <label
            htmlFor="box-count"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            宝箱数量
          </label>
          <input
            id="box-count"
            type="number"
            min="1"
            value={boxCount}
            onChange={handleBoxCountChange}
            className="input-field w-full"
          />
        </div>

        {/* 每个宝箱奖励 */}
        <div className="mb-6">
          <label
            htmlFor="reward-per-box"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            每个宝箱奖励小红花 (最低 50)
          </label>
          <input
            id="reward-per-box"
            type="number"
            min="50"
            value={rewardPerBox}
            onChange={handleRewardChange}
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
          创建宝箱任务
        </button>
      </form>
    </div>
  );
};

export default TopicBoxForm;
