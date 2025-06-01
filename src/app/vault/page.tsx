'use client';

import { useState, useEffect } from 'react';
import {
  FaDatabase,
  FaCoins,
  FaChartLine,
  FaLock,
  FaHistory,
  FaInfoCircle,
  FaClock,
} from 'react-icons/fa';
import { useWallet } from '@/contexts/WalletContext';

// 质押期限选项
type StakePeriod =
  | 'flexible'
  | '15days'
  | '30days'
  | '60days'
  | '90days'
  | '180days';

// 不同期限对应的年化收益率
const periodToAPY: Record<StakePeriod, number> = {
  flexible: 8, // 活期：8%
  '15days': 10, // 15天：10%
  '30days': 12, // 30天：12%
  '60days': 15, // 60天：15%
  '90days': 17.5, // 90天：17.5%
  '180days': 20, // 180天：20%
};

// 模拟区块链连接钩子
const useBlockchainConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [account, setAccount] = useState<string | null>(null);

  // 模拟连接钱包函数
  const connect = async () => {
    try {
      setStatus('connecting');

      // 模拟连接延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模拟成功连接
      setStatus('connected');
      setAccount('0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t');
    } catch (error) {
      console.error('连接钱包失败:', error);
      setStatus('error');
    }
  };

  // 断开连接
  const disconnect = () => {
    setStatus('disconnected');
    setAccount(null);
  };

  return { status, account, connect, disconnect };
};

export default function VaultPage() {
  const { wallet } = useWallet();
  const [tvl, setTvl] = useState(725000);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [myStake, setMyStake] = useState(0);
  const [myRewards, setMyRewards] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // 质押期限选择
  const [selectedPeriod, setSelectedPeriod] = useState<StakePeriod>('flexible');
  const [estimatedReward, setEstimatedReward] = useState(0);

  // 我的质押记录
  const [myStakes, setMyStakes] = useState<
    Array<{
      amount: number;
      period: StakePeriod;
      startDate: Date;
      endDate: Date | null;
      reward: number;
      claimed: boolean;
      isEnded: boolean;
    }>
  >([]);

  // 计算当前选择的质押期限的APY
  const currentAPY = periodToAPY[selectedPeriod];

  // 更新质押奖励
  const updateStakeRewards = () => {
    if (myStakes.length === 0) return;

    const now = new Date();
    let totalReward = 0;

    const updatedStakes = myStakes.map((stake) => {
      // 如果已结束或已领取，不再增加奖励
      if (stake.isEnded || stake.claimed) return stake;

      // 计算已经过去的时间（以天为单位）
      const startTime = stake.startDate.getTime();
      const currentTime = now.getTime();
      const daysPassed = (currentTime - startTime) / (1000 * 60 * 60 * 24);

      // 固定期限质押检查是否已到期
      let isEnded = false;
      if (
        stake.period !== 'flexible' &&
        stake.endDate &&
        now >= stake.endDate
      ) {
        isEnded = true;
      }

      // 计算奖励
      const apy = periodToAPY[stake.period];
      const reward = stake.amount * (apy / 100) * (daysPassed / 365);

      totalReward += reward;

      return {
        ...stake,
        reward,
        isEnded,
      };
    });

    setMyStakes(updatedStakes);
    setMyRewards(totalReward);
  };

  // 模拟数据获取
  useEffect(() => {
    // 每隔30秒更新一次TVL
    const interval = setInterval(() => {
      // 随机增加或减少TVL (±1.5%)
      const tvlChange = tvl * (Math.random() * 0.03 - 0.015);
      setTvl((prevTvl) => Math.max(700000, prevTvl + tvlChange));

      // 更新质押奖励
      updateStakeRewards();
    }, 30000);

    return () => clearInterval(interval);
  }, [tvl, myStakes]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setStakeAmount(value);

      // 计算预估奖励
      if (value) {
        const amount = parseFloat(value);
        const period =
          selectedPeriod === 'flexible'
            ? 365
            : selectedPeriod === '15days'
              ? 15
              : selectedPeriod === '30days'
                ? 30
                : selectedPeriod === '60days'
                  ? 60
                  : selectedPeriod === '90days'
                    ? 90
                    : 180;

        const apy = periodToAPY[selectedPeriod];
        const estimatedReward = amount * (apy / 100) * (period / 365);
        setEstimatedReward(estimatedReward);
      } else {
        setEstimatedReward(0);
      }
    }
  };

  // 设置最大金额
  const handleMaxAmount = () => {
    if (wallet.isConnected) {
      setStakeAmount(wallet.balance.sm.toString());

      // 计算预估奖励
      const amount = wallet.balance.sm;
      const period =
        selectedPeriod === 'flexible'
          ? 365
          : selectedPeriod === '15days'
            ? 15
            : selectedPeriod === '30days'
              ? 30
              : selectedPeriod === '60days'
                ? 60
                : selectedPeriod === '90days'
                  ? 90
                  : 180;

      const apy = periodToAPY[selectedPeriod];
      const estimatedReward = amount * (apy / 100) * (period / 365);
      setEstimatedReward(estimatedReward);
    }
  };

  // 处理质押期限变更
  const handlePeriodChange = (period: StakePeriod) => {
    setSelectedPeriod(period);

    // 重新计算预估奖励
    if (stakeAmount) {
      const amount = parseFloat(stakeAmount);
      const days =
        period === 'flexible'
          ? 365
          : period === '15days'
            ? 15
            : period === '30days'
              ? 30
              : period === '60days'
                ? 60
                : period === '90days'
                  ? 90
                  : 180;

      const apy = periodToAPY[period];
      const estimatedReward = amount * (apy / 100) * (days / 365);
      setEstimatedReward(estimatedReward);
    }
  };

  // 处理质押
  const handleStake = async () => {
    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    const amount = parseFloat(stakeAmount);

    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (amount > wallet.balance.sm) {
      alert(`SM余额不足。需要: ${amount}, 当前余额: ${wallet.balance.sm}`);
      return;
    }

    setIsStaking(true);

    try {
      // 模拟质押过程
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 计算结束日期（如果是固定期限）
      const startDate = new Date();
      let endDate = null;

      if (selectedPeriod !== 'flexible') {
        endDate = new Date(startDate);
        const days =
          selectedPeriod === '15days'
            ? 15
            : selectedPeriod === '30days'
              ? 30
              : selectedPeriod === '60days'
                ? 60
                : selectedPeriod === '90days'
                  ? 90
                  : 180;
        endDate.setDate(endDate.getDate() + days);
      }

      // 添加新的质押记录
      const newStake = {
        amount,
        period: selectedPeriod,
        startDate,
        endDate,
        reward: 0,
        claimed: false,
        isEnded: false,
      };

      setMyStakes([...myStakes, newStake]);

      // 更新总质押金额
      setMyStake((prev) => prev + amount);

      // 更新TVL
      setTvl((prev) => prev + amount);

      // 清空输入
      setStakeAmount('');
      setEstimatedReward(0);

      alert(`成功质押 ${amount} SM，奖励将以小红花形式发放`);
    } catch (error) {
      console.error('质押失败:', error);
      alert('质押失败，请稍后重试');
    } finally {
      setIsStaking(false);
    }
  };

  // 处理提取奖励
  const handleHarvest = async () => {
    if (myRewards <= 0) return;

    try {
      // 模拟提取过程
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 更新质押记录，标记已领取
      const updatedStakes = myStakes.map((stake) => ({
        ...stake,
        claimed: stake.isEnded ? true : stake.claimed,
      }));

      setMyStakes(updatedStakes);

      alert(`成功提取 ${myRewards.toFixed(2)} 小红花奖励`);

      // 重置奖励
      setMyRewards(0);
    } catch (error) {
      console.error('提取失败:', error);
      alert('提取失败，请稍后重试');
    }
  };

  const { status, account, connect, disconnect } = useBlockchainConnection();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <FaDatabase className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">钱库</h1>
        <button
          onClick={() => setShowInfoModal(true)}
          className="ml-2 text-gray-400 hover:text-white"
        >
          <FaInfoCircle className="w-5 h-5" />
        </button>
      </div>

      {!wallet.isConnected && (
        <div className="glass-card p-5 text-yellow-400 mb-8">
          <p>请先连接钱包以使用资金库功能</p>
        </div>
      )}

      {/* 资金库数据 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <FaLock className="text-primary" />
            <h2 className="text-lg font-medium text-gray-300">总锁仓价值</h2>
          </div>
          <p className="text-3xl font-bold">
            {tvl.toLocaleString()} <span className="text-primary">SM</span>
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine className="text-primary" />
            <h2 className="text-lg font-medium text-gray-300">
              当前年化收益率
            </h2>
          </div>
          <p className="text-3xl font-bold">{currentAPY.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">质押SM，奖励小红花</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <FaCoins className="text-primary" />
            <h2 className="text-lg font-medium text-gray-300">我的质押</h2>
          </div>
          <p className="text-3xl font-bold">
            {myStake.toLocaleString()} <span className="text-primary">SM</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            累计奖励: {myRewards.toFixed(2)} 小红花
          </p>
        </div>
      </div>

      {/* 质押面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">质押 SM</h2>

          {/* 质押期限选择 */}
          <div className="mb-4">
            <label className="text-gray-300 mb-2 block">选择质押期限</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePeriodChange('flexible')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === 'flexible' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                活期 (8%)
              </button>
              <button
                onClick={() => handlePeriodChange('15days')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === '15days' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                15天 (10%)
              </button>
              <button
                onClick={() => handlePeriodChange('30days')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === '30days' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                30天 (12%)
              </button>
              <button
                onClick={() => handlePeriodChange('60days')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === '60days' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                60天 (15%)
              </button>
              <button
                onClick={() => handlePeriodChange('90days')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === '90days' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                90天 (17.5%)
              </button>
              <button
                onClick={() => handlePeriodChange('180days')}
                className={`p-2 rounded-md text-center text-sm ${selectedPeriod === '180days' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-300'}`}
              >
                180天 (20%)
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300">输入质押金额</label>
              {wallet.isConnected && (
                <span className="text-sm text-gray-400">
                  余额: {wallet.balance.sm.toLocaleString()} SM
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={stakeAmount}
                onChange={handleInputChange}
                disabled={!wallet.isConnected}
                className="w-full bg-black/50 border border-gray-800 rounded-md py-3 px-4 text-white"
                placeholder="输入质押金额"
              />

              <button
                onClick={handleMaxAmount}
                disabled={!wallet.isConnected}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded"
              >
                最大
              </button>
            </div>

            {stakeAmount && (
              <div className="mt-3 p-3 bg-gray-800/30 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">预估奖励</span>
                  <span className="text-primary font-medium">
                    {estimatedReward.toFixed(2)} 小红花
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedPeriod === 'flexible'
                    ? '按活期年化8%计算，随时可提取'
                    : `按${
                        selectedPeriod === '15days'
                          ? '15天'
                          : selectedPeriod === '30days'
                            ? '30天'
                            : selectedPeriod === '60days'
                              ? '60天'
                              : selectedPeriod === '90days'
                                ? '90天'
                                : '180天'
                      }期限计算，到期后可提取`}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStake}
            disabled={!wallet.isConnected || isStaking || !stakeAmount}
            className={`w-full py-3 rounded-md flex items-center justify-center gap-2 ${
              !wallet.isConnected || isStaking || !stakeAmount
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'neon-button'
            }`}
          >
            {isStaking ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                处理中...
              </>
            ) : (
              <>
                <FaLock className="w-4 h-4" />
                <span>质押 SM</span>
              </>
            )}
          </button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">我的奖励</h2>

          <div className="flex flex-col items-center justify-center h-[calc(100%-56px)] gap-4">
            <div className="text-center">
              <p className="text-gray-400 mb-1">累计小红花奖励</p>
              <p className="text-3xl font-bold text-primary">
                {myRewards.toFixed(4)}
              </p>
            </div>

            <button
              onClick={handleHarvest}
              disabled={!wallet.isConnected || myRewards <= 0}
              className={`py-2 px-6 rounded-md ${
                !wallet.isConnected || myRewards <= 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'neon-button'
              }`}
            >
              提取小红花奖励
            </button>
          </div>
        </div>
      </div>

      {/* 资金库说明 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaInfoCircle className="text-primary" />
          <h2 className="text-xl font-semibold">关于钱库</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">质押特点</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>质押SM代币，获得小红花奖励，提高生态价值</div>
              </li>
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>活期质押：随时可提取，年化收益率8%</div>
              </li>
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>固定期限质押：15/30/60/90/180天，最高年化20%</div>
              </li>
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>质押期限越长，收益率越高</div>
              </li>
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>固定期限质押到期后可领取全部奖励</div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">资金用途</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>
                  50%（5000万SM）用于投资同平台旗下生态项目，促进价值共享
                </div>
              </li>
              <li className="flex items-start">
                <div className="text-primary mr-2 mt-0.5">•</div>
                <div>50%（5000万SM）分批卖出兑换稳定币，用于价格调节：</div>
              </li>
              <li className="flex items-start pl-4">
                <div className="text-gray-400 mr-2 mt-0.5">-</div>
                <div>
                  代币0.05美元时卖出1000万枚，价格低于0.025美元时自动买入
                </div>
              </li>
              <li className="flex items-start pl-4">
                <div className="text-gray-400 mr-2 mt-0.5">-</div>
                <div>
                  代币0.25美元时卖出1000万枚，价格低于0.125美元时自动买入
                </div>
              </li>
              <li className="flex items-start pl-4">
                <div className="text-gray-400 mr-2 mt-0.5">-</div>
                <div>代币1.5美元时卖出2000万枚，价格低于0.75美元时自动买入</div>
              </li>
              <li className="flex items-start pl-4">
                <div className="text-gray-400 mr-2 mt-0.5">-</div>
                <div>代币9美元时卖出1000万枚，价格低于4.5美元时自动买入</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-800/30 rounded-md">
          <p className="text-sm text-gray-300">
            钱库是项目重要的生态系统组成部分，旨在稳定代币经济体系的同时，让持有SM代币的用户可参与项目方其他平台的早期项目，共享生态价值增长。
          </p>
        </div>
      </div>

      {/* 信息模态框 */}
      {showInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              &times;
            </button>

            <h3 className="text-xl font-semibold mb-4">SM钱库详情</h3>

            <div className="mb-4">
              <h4 className="text-lg font-medium text-primary mb-2">
                质押机制
              </h4>
              <p className="text-sm text-gray-300 mb-2">
                SM钱库允许用户质押SM代币，获取小红花奖励。质押期限越长，收益率越高。
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 活期质押：灵活存取，年化收益率8%</li>
                <li>• 15天定期：年化收益率10%</li>
                <li>• 30天定期：年化收益率12%</li>
                <li>• 60天定期：年化收益率15%</li>
                <li>• 90天定期：年化收益率17.5%</li>
                <li>• 180天定期：年化收益率20%</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-medium text-primary mb-2">
                价格稳定机制
              </h4>
              <p className="text-sm text-gray-300 mb-2">
                钱库设计了有效的价格稳定机制，通过自动调节SM代币的供需平衡：
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 当代币价格上涨到预设阈值时，钱库会释放一定数量的代币</li>
                <li>• 当代币价格下跌到预设阈值时，钱库会自动回购代币</li>
                <li>• 这种机制确保了代币价格的相对稳定，防止过度波动</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-primary mb-2">
                生态投资
              </h4>
              <p className="text-sm text-gray-300">
                钱库的一部分资金将用于投资平台旗下的其他生态项目，持有SM代币的用户可以提前参与这些早期项目，分享生态系统的整体价值增长。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
