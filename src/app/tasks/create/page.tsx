'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaPlus,
  FaMinus,
  FaTwitter,
  FaInstagram,
  FaTiktok,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// 定义任务类型
type TaskType = 'exposure' | 'treasure' | 'lottery' | 'airdrop';
type SocialPlatform = 'twitter' | 'instagram' | 'tiktok';

export default function CreateTaskPage() {
  const router = useRouter();
  const { wallet } = useWallet();

  // 任务基本信息
  const [taskType, setTaskType] = useState<TaskType>('exposure');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState(100);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'twitter',
  ]);
  const [durationDays, setDurationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 模拟余额数据
  const balances = {
    sm: 1250.75,
    redFlower: 350,
  };

  // 计算任务成本
  const calculateCost = () => {
    let redFlowerCost = 0;

    // 基于任务类型和奖励计算成本
    switch (taskType) {
      case 'exposure':
        redFlowerCost = rewardAmount * 2;
        break;
      case 'treasure':
        redFlowerCost = rewardAmount * 3;
        break;
      case 'lottery':
        redFlowerCost = rewardAmount * 1.5;
        break;
      case 'airdrop':
        redFlowerCost = rewardAmount;
        break;
    }

    // 根据平台增加成本
    selectedPlatforms.forEach((platform) => {
      if (platform === 'twitter') redFlowerCost += 50;
      if (platform === 'instagram') redFlowerCost += 30;
      if (platform === 'tiktok') redFlowerCost += 40;
    });

    // 根据时长增加成本
    redFlowerCost += durationDays * 5;

    // 计算服务费
    const serviceFee = Math.ceil(redFlowerCost * 0.05);

    return {
      redFlower: Math.ceil(redFlowerCost),
      smFee: serviceFee,
    };
  };

  // 处理平台选择
  const togglePlatform = (platform: SocialPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // 增加/减少奖励
  const adjustReward = (amount: number) => {
    const newAmount = rewardAmount + amount;
    if (newAmount >= 10 && newAmount <= 10000) {
      setRewardAmount(newAmount);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    if (!taskTitle || !taskDescription || selectedPlatforms.length === 0) {
      toast.error('请填写完整的任务信息');
      return;
    }

    const cost = calculateCost();

    // 检查余额
    if (balances.redFlower < cost.redFlower) {
      toast.error(`小红花余额不足，需要 ${cost.redFlower} 朵`);
      return;
    }

    if (balances.sm < cost.smFee) {
      toast.error(`SM代币余额不足，需要 ${cost.smFee} SM`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 模拟任务创建过程
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('任务创建成功！');
      router.push('/tasks');
    } catch (error) {
      console.error('创建任务失败:', error);
      toast.error('创建任务失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 任务类型选项
  const taskTypes = [
    {
      id: 'exposure',
      name: '曝光任务',
      description: '让用户在社交媒体上宣传您的内容',
    },
    {
      id: 'treasure',
      name: '话题宝箱',
      description: '用户参与特定话题互动可获得奖励',
    },
    { id: 'lottery', name: '抽奖任务', description: '用户完成要求后参与抽奖' },
    {
      id: 'airdrop',
      name: '空投任务',
      description: '用户完成简单任务获得奖励',
    },
  ];

  // 计算当前成本
  const cost = calculateCost();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">创建新任务</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 任务类型选择 */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">选择任务类型</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taskTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setTaskType(type.id as TaskType)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  taskType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold">{type.name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {type.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 任务基本信息 */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">任务信息</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                任务标题
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                placeholder="例如：关注我们的Twitter账号获得奖励"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                任务描述
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 h-24"
                placeholder="详细描述您的任务要求和奖励..."
                maxLength={500}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                社交平台
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => togglePlatform('twitter')}
                  className={`py-2 px-4 rounded-md flex items-center gap-2 ${
                    selectedPlatforms.includes('twitter')
                      ? 'bg-blue-600/70'
                      : 'bg-gray-800'
                  }`}
                >
                  <FaTwitter />
                  <span>Twitter</span>
                </button>
                <button
                  type="button"
                  onClick={() => togglePlatform('instagram')}
                  className={`py-2 px-4 rounded-md flex items-center gap-2 ${
                    selectedPlatforms.includes('instagram')
                      ? 'bg-purple-600/70'
                      : 'bg-gray-800'
                  }`}
                >
                  <FaInstagram />
                  <span>Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => togglePlatform('tiktok')}
                  className={`py-2 px-4 rounded-md flex items-center gap-2 ${
                    selectedPlatforms.includes('tiktok')
                      ? 'bg-black border border-gray-400'
                      : 'bg-gray-800'
                  }`}
                >
                  <FaTiktok />
                  <span>TikTok</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                任务奖励 (小红花)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => adjustReward(-10)}
                  className="p-2 bg-gray-800 rounded-l-md hover:bg-gray-700"
                >
                  <FaMinus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) =>
                    setRewardAmount(parseInt(e.target.value) || 10)
                  }
                  className="w-24 text-center bg-gray-900 border-y border-gray-700 py-2"
                  min="10"
                  max="10000"
                />
                <button
                  type="button"
                  onClick={() => adjustReward(10)}
                  className="p-2 bg-gray-800 rounded-r-md hover:bg-gray-700"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
                <div className="ml-3 text-sm text-gray-400">小红花</div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                任务时长 (天)
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value={3}>3天</option>
                <option value={7}>7天</option>
                <option value={14}>14天</option>
                <option value={30}>30天</option>
              </select>
            </div>
          </div>
        </div>

        {/* 成本摘要 */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">费用摘要</h2>

          <div className="flex justify-between mb-2">
            <div>奖励小红花:</div>
            <div>{rewardAmount} 朵</div>
          </div>

          <div className="flex justify-between mb-2">
            <div>平台费用:</div>
            <div>{cost.redFlower - rewardAmount} 朵</div>
          </div>

          <div className="flex justify-between mb-2">
            <div>服务费 (SM代币):</div>
            <div>{cost.smFee} SM</div>
          </div>

          <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between font-semibold">
            <div>总计:</div>
            <div>
              {cost.redFlower} 朵小红花 + {cost.smFee} SM
            </div>
          </div>

          <div className="flex justify-between mt-3 text-sm">
            <div>您的余额:</div>
            <div>
              {balances.redFlower} 朵小红花 / {balances.sm} SM
            </div>
          </div>

          {(balances.redFlower < cost.redFlower ||
            balances.sm < cost.smFee) && (
            <div className="mt-3 text-red-400 text-sm">
              余额不足，无法创建任务
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 py-2 px-6 bg-gray-800 hover:bg-gray-700 rounded-md"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              balances.redFlower < cost.redFlower ||
              balances.sm < cost.smFee
            }
            className={`neon-button py-2 px-6 flex items-center ${
              isSubmitting ||
              balances.redFlower < cost.redFlower ||
              balances.sm < cost.smFee
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                处理中...
              </>
            ) : (
              '创建任务'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
