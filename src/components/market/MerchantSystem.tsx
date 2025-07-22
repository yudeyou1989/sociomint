'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaUser,
  FaMedal,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// 商人状态接口
interface MerchantStatus {
  isMerchant: boolean;
  pledgeAmount: number;
  startDate: string;
  expiryDate: string;
  tradeCount: number;
  avgCompletionTime: number;
  isMedalist: boolean;
  cancelCount: number;
  disputeLoss: number;
  remaining: number; // 剩余天数
}

// 默认质押数量
const DEFAULT_PLEDGE_AMOUNT = 5000;

// 商人管理组件
const MerchantSystem = () => {
  const { wallet, balance } = useWallet();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPledgeAmount, setCurrentPledgeAmount] = useState(
    DEFAULT_PLEDGE_AMOUNT,
  );
  const [totalPledgedAmount, setTotalPledgedAmount] = useState(0); // 添加总质押数统计

  // 商人状态 - 实际应用中从API获取
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(
    null,
  );

  // 获取动态质押数量
  const fetchDynamicPledgeAmount = async () => {
    try {
      // 实际应用中应从API获取流通量
      // 这里模拟API调用
      setTimeout(() => {
        // 模拟获取流通量数据
        const circulationAmount =
          Math.floor(Math.random() * 100000000) + 20000000; // 模拟2千万-1.2亿之间的流通量

        // 计算质押数量：流通量的万分之一
        const newPledgeAmount = Math.ceil(circulationAmount / 10000);

        // 模拟总质押数
        const totalPledged = Math.floor(circulationAmount * 0.05); // 假设流通量的5%被质押
        setTotalPledgedAmount(totalPledged);

        console.log(
          `流通量: ${circulationAmount}, 新质押数量: ${newPledgeAmount}`,
        );

        // 更新质押数量要求（仅对新商人有效）
        if (!merchantStatus) {
          setCurrentPledgeAmount(newPledgeAmount);
        }
      }, 1000);
    } catch (error) {
      console.error('获取质押数量失败', error);
    }
  };

  // 模拟获取商人状态
  useEffect(() => {
    if (wallet.isConnected) {
      // 获取动态质押数量
      fetchDynamicPledgeAmount();

      // 设置每日更新计时器
      const dailyUpdate = setInterval(
        () => {
          fetchDynamicPledgeAmount();
        },
        24 * 60 * 60 * 1000,
      ); // 24小时更新一次

      // 模拟API调用获取商人状态
      // 实际应用中应从Supabase获取
      setTimeout(() => {
        // 假设用户已经是商人
        const isMerchantUser = Math.random() > 0.5;

        if (isMerchantUser) {
          const expiryDate = new Date();
          expiryDate.setDate(
            expiryDate.getDate() + Math.floor(Math.random() * 90) + 1,
          );

          const startDate = new Date();
          startDate.setDate(
            startDate.getDate() - Math.floor(Math.random() * 30),
          );

          const remaining = Math.floor(
            (expiryDate.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );

          setMerchantStatus({
            isMerchant: true,
            pledgeAmount: DEFAULT_PLEDGE_AMOUNT,
            startDate: startDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            tradeCount: Math.floor(Math.random() * 2000),
            avgCompletionTime: Math.floor(Math.random() * 30) + 5,
            isMedalist: Math.random() > 0.7,
            cancelCount: Math.floor(Math.random() * 3),
            disputeLoss: Math.floor(Math.random() * 2),
            remaining: remaining,
          });
        } else {
          setMerchantStatus(null);
        }
      }, 1000);

      return () => clearInterval(dailyUpdate);
    }
  }, [wallet.isConnected]);

  // 申请成为商人
  const handleBecomeMerchant = () => {
    if (!wallet.isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    if (balance.sm < currentPledgeAmount) {
      toast.error('SM余额不足');
      return;
    }

    setIsProcessing(true);

    // 模拟质押过程 - 实际项目中只在Supabase记录状态
    setTimeout(() => {
      setIsProcessing(false);
      setShowStakeModal(false);

      // 创建新的商人状态 - 90天有效期
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      setMerchantStatus({
        isMerchant: true,
        pledgeAmount: currentPledgeAmount,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        tradeCount: 0,
        avgCompletionTime: 0,
        isMedalist: false,
        cancelCount: 0,
        disputeLoss: 0,
        remaining: 90,
      });

      toast.success('恭喜！您已成功质押SM代币，成为平台商人');
    }, 2000);
  };

  // 取消商人资格
  const handleCancelMerchant = () => {
    if (!merchantStatus) return;

    setIsProcessing(true);

    // 模拟取消过程
    setTimeout(() => {
      setIsProcessing(false);
      setShowCancelModal(false);

      // 更新状态
      setMerchantStatus(null);

      toast.success('商人资格已取消，质押的SM代币将在72小时内返回您的账户');
    }, 2000);
  };

  // 渲染商人统计信息
  const renderMerchantStats = () => {
    if (!merchantStatus) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="tech-card p-4">
          <div className="text-gray-400 text-xs mb-1">交易笔数</div>
          <div className="text-lg font-bold">{merchantStatus.tradeCount}</div>
          {merchantStatus.tradeCount >= 10000 && (
            <div className="text-xs text-yellow-400 mt-1">
              已达成金牌商人标准
            </div>
          )}
        </div>

        <div className="tech-card p-4">
          <div className="text-gray-400 text-xs mb-1">平均完成时间</div>
          <div className="text-lg font-bold">
            {merchantStatus.avgCompletionTime} 分钟
          </div>
        </div>

        <div className="tech-card p-4">
          <div className="text-gray-400 text-xs mb-1">取消订单数</div>
          <div className="text-lg font-bold">{merchantStatus.cancelCount}</div>
          {merchantStatus.cancelCount >= 2 && (
            <div className="text-xs text-yellow-500 mt-1">
              注意：24小时内超过3次将取消商人资格
            </div>
          )}
        </div>

        <div className="tech-card p-4">
          <div className="text-gray-400 text-xs mb-1">纠纷失败数</div>
          <div className="text-lg font-bold">{merchantStatus.disputeLoss}</div>
          {merchantStatus.disputeLoss > 0 && (
            <div className="text-xs text-yellow-500 mt-1">
              纠纷裁决失败可能导致商人资格被取消
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-10">
      {/* 商人状态区域 */}
      <div className="tech-card mb-8">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaUser />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">商人</h2>
            {merchantStatus ? (
              <div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-green-400">
                    您当前是活跃商人
                    {merchantStatus.isMedalist && (
                      <span className="ml-2 inline-flex items-center">
                        <FaMedal className="text-yellow-400 mr-1" />
                        <span className="text-yellow-400">金牌商人</span>
                      </span>
                    )}
                  </span>
                  <div className="ml-auto">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="text-red-400 text-sm hover:text-red-300 flex items-center"
                    >
                      取消商人资格
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                    <div className="flex items-center text-gray-400 text-sm mb-1">
                      质押数量
                    </div>
                    <div className="font-bold">
                      {merchantStatus.pledgeAmount} SM
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                    <div className="flex items-center text-gray-400 text-sm mb-1">
                      到期日期
                    </div>
                    <div className="font-bold">{merchantStatus.expiryDate}</div>
                    <div className="text-xs mt-1 text-gray-400">
                      还剩 {merchantStatus.remaining} 天
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                    <div className="flex items-center text-gray-400 text-sm mb-1">
                      开始日期
                    </div>
                    <div className="font-bold">{merchantStatus.startDate}</div>
                  </div>
                </div>

                {renderMerchantStats()}

                <div className="mt-6 p-4 border border-gray-700 rounded-md bg-gray-800/30">
                  <h4 className="font-medium text-yellow-400 mb-2">
                    商人规则提醒
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• 商人资格有效期为90天，到期后自动取消</li>
                    <li>• 取消商人资格后，质押的SM代币将在72小时后返回账户</li>
                    <li>• 24小时内取消订单超过3次，将取消商人资格</li>
                    <li>• 纠纷裁决中失败，可能导致商人资格被取消</li>
                    <li>• 完成10,000笔交易可获得金牌商人称号</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">
                  您当前不是商人。成为商人可以创建买单和卖单，用人民币与用户交易小红花和SM代币。
                </p>
                <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700 mb-4">
                  <span className="block mb-2 text-gray-300">
                    需要质押:{' '}
                    <span className="text-primary">
                      {currentPledgeAmount} SM
                    </span>
                  </span>
                  <span className="block text-xs text-gray-400">
                    质押金额为SM流通代币数量的万分之一（取整数），每天更新一次。
                  </span>
                  <span className="block text-xs text-gray-400 mt-1">
                    质押在系统中记录，有效期90天。
                  </span>
                  <span className="block text-xs text-gray-400 mt-1">
                    取消商人资格后，质押的SM代币将在72小时后返回账户。
                  </span>
                </div>
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="neon-button"
                  disabled={!wallet.isConnected}
                >
                  成为商人
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 质押模态框 */}
      {showStakeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowStakeModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-4">成为商人</h3>
            <p className="text-gray-300 mb-6">
              通过质押SM代币成为平台认证商人，参与小红花和SM代币的买卖交易，获取交易佣金收益。
            </p>

            <div className="mb-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">平台总质押量</span>
                <span className="text-primary">
                  {totalPledgedAmount.toLocaleString()} SM
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">质押金额</span>
                <span className="text-primary">{currentPledgeAmount} SM</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                质押要求: {currentPledgeAmount} SM
                (动态计算为SM流通量的万分之一)
              </p>
            </div>

            <div className="mb-6 p-3 bg-gray-800/40 rounded-md">
              <h4 className="font-medium text-primary mb-2">商人资格说明</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 质押金额根据SM流通量动态调整，为代币流通量的万分之一</li>
                <li>• 质押记录在系统中，商人资格有效期为90天</li>
                <li>
                  • 解除商人资格后，质押的SM代币将在72小时内自动返回您的账户
                </li>
                <li>• 作为商人，您可创建小红花和SM代币的买卖订单</li>
                <li>• 完成10,000笔交易后获得金牌商人认证，提升交易信任度</li>
              </ul>
            </div>

            <button
              onClick={handleBecomeMerchant}
              disabled={isProcessing || balance?.sm < currentPledgeAmount}
              className={`w-full py-2.5 rounded-md ${
                isProcessing || balance?.sm < currentPledgeAmount
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'neon-button'
              }`}
            >
              {isProcessing ? '处理中...' : '确认质押并成为商人'}
            </button>

            {balance?.sm < currentPledgeAmount && (
              <p className="text-red-400 text-xs mt-2 text-center">
                SM余额不足，需要 {currentPledgeAmount} SM
              </p>
            )}
          </div>
        </div>
      )}

      {/* 取消商人模态框 */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="tech-card p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-4 text-red-400">
              取消商人资格
            </h3>
            <p className="text-gray-300 mb-6">
              您确定要取消商人资格吗？取消后，质押的{' '}
              {merchantStatus?.pledgeAmount} SM 代币将在72小时后返回您的账户。
            </p>

            <div className="mb-6 p-3 bg-red-900/20 border border-red-900 rounded-md">
              <h4 className="font-medium text-red-400 mb-2">注意事项</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 商人资格取消后无法恢复，需要重新质押</li>
                <li>• 所有进行中的交易将需要尽快完成</li>
                <li>• 取消后将无法创建新的交易订单</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                再考虑一下
              </button>

              <button
                onClick={handleCancelMerchant}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-md transition-colors"
              >
                {isProcessing ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantSystem;
