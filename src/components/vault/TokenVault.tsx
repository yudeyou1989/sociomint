import { useState, useEffect } from 'react';
import {
  FaCoins,
  FaShieldAlt,
  FaUserCheck,
  FaCog,
  FaChartLine,
  FaHistory,
  FaExchangeAlt,
  FaPlus,
  FaTimes,
} from 'react-icons/fa';
import TokenChart from './TokenChart';
import StabilizationConfig from './StabilizationConfig';

// 通证状态类型
type TokenStatus = 'stable' | 'rising' | 'falling' | 'volatile';

// 白名单用户类型
interface WhitelistUser {
  id: string;
  address: string;
  name: string;
  addedAt: Date;
  status: 'active' | 'pending' | 'suspended';
  allowance: number;
}

// 价格稳定机制类型
interface StabilizationMechanism {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  impact: 'high' | 'medium' | 'low';
  lastTriggered?: Date;
}

// 钱库状态类型
interface VaultStats {
  totalTokens: number;
  circulatingSupply: number;
  reserveRatio: number;
  priceStability: TokenStatus;
  lastPrice: number;
  priceChange24h: number;
}

// 钱库系统主组件
const TokenVault = () => {
  // 活动标签状态
  const [activeTab, setActiveTab] = useState<
    'overview' | 'whitelist' | 'mechanisms' | 'config'
  >('overview');

  // 白名单状态
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistUser[]>([
    {
      id: 'WL001',
      address: '0x1a2b3c4d5e6f7g8h9i0j',
      name: '张三',
      addedAt: new Date(2025, 2, 15),
      status: 'active',
      allowance: 10000,
    },
    {
      id: 'WL002',
      address: '0x9i8h7g6f5e4d3c2b1a0',
      name: '李四',
      addedAt: new Date(2025, 2, 18),
      status: 'active',
      allowance: 5000,
    },
    {
      id: 'WL003',
      address: '0x2b4d6f8h0j2n4p6r8t0v',
      name: '王五',
      addedAt: new Date(2025, 3, 1),
      status: 'pending',
      allowance: 3000,
    },
  ]);

  // 价格稳定机制状态
  const [stabilizationMechanisms, setStabilizationMechanisms] = useState<
    StabilizationMechanism[]
  >([
    {
      id: 'SM001',
      name: '自动回购',
      description: '当通证价格低于设定阈值时，系统自动使用储备金回购通证',
      status: 'active',
      impact: 'high',
      lastTriggered: new Date(2025, 3, 10),
    },
    {
      id: 'SM002',
      name: '动态发行费率',
      description: '根据通证价格波动，动态调整新通证的发行费率',
      status: 'active',
      impact: 'medium',
    },
    {
      id: 'SM003',
      name: '锁仓挖矿激励',
      description: '激励用户锁定通证以减少流通量，提高通证价值',
      status: 'inactive',
      impact: 'medium',
    },
  ]);

  // 钱库统计数据状态
  const [vaultStats, setVaultStats] = useState<VaultStats>({
    totalTokens: 1000000,
    circulatingSupply: 450000,
    reserveRatio: 0.65,
    priceStability: 'stable',
    lastPrice: 12.8,
    priceChange24h: 0.5,
  });

  // 显示对话框状态
  const [showAddWhitelistModal, setShowAddWhitelistModal] = useState(false);

  // 新白名单用户表单状态
  const [newWhitelistUser, setNewWhitelistUser] = useState({
    address: '',
    name: '',
    allowance: 1000,
  });

  // 获取通证状态样式
  const getTokenStatusStyle = (status: TokenStatus) => {
    switch (status) {
      case 'stable':
        return 'text-green-400';
      case 'rising':
        return 'text-blue-400';
      case 'falling':
        return 'text-red-400';
      case 'volatile':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  // 获取通证状态文本
  const getTokenStatusText = (status: TokenStatus) => {
    switch (status) {
      case 'stable':
        return '稳定';
      case 'rising':
        return '上涨';
      case 'falling':
        return '下跌';
      case 'volatile':
        return '波动';
      default:
        return '未知';
    }
  };

  // 添加白名单用户
  const addWhitelistUser = () => {
    if (!newWhitelistUser.address || !newWhitelistUser.name) {
      alert('请填写完整信息');
      return;
    }

    const newUser: WhitelistUser = {
      id: `WL${Date.now().toString().substr(-6)}`,
      address: newWhitelistUser.address,
      name: newWhitelistUser.name,
      addedAt: new Date(),
      status: 'active',
      allowance: newWhitelistUser.allowance,
    };

    setWhitelistUsers([...whitelistUsers, newUser]);
    setNewWhitelistUser({ address: '', name: '', allowance: 1000 });
    setShowAddWhitelistModal(false);
  };

  // 切换机制状态
  const toggleMechanismStatus = (id: string) => {
    const updatedMechanisms = stabilizationMechanisms.map((mechanism) => {
      if (mechanism.id === id) {
        return {
          ...mechanism,
          status:
            mechanism.status === 'active'
              ? 'inactive'
              : ('active' as 'active' | 'inactive'),
        };
      }
      return mechanism;
    });

    setStabilizationMechanisms(updatedMechanisms);
  };

  // 模拟连接到区块链的效果
  useEffect(() => {
    // 每分钟更新一次统计数据，模拟实时数据
    const updateInterval = setInterval(() => {
      // 生成一个-0.5到+0.5的随机浮动
      const priceChange = (Math.random() - 0.5) * 0.2;
      const newPrice = Math.max(vaultStats.lastPrice + priceChange, 0);

      // 更新统计数据
      setVaultStats((prev) => ({
        ...prev,
        lastPrice: parseFloat(newPrice.toFixed(2)),
        priceChange24h: parseFloat(
          (prev.priceChange24h + (Math.random() - 0.5) * 0.2).toFixed(2),
        ),
        priceStability:
          Math.abs(priceChange) < 0.1
            ? 'stable'
            : priceChange > 0
              ? 'rising'
              : 'falling',
      }));
    }, 60000);

    return () => clearInterval(updateInterval);
  }, [vaultStats.lastPrice, vaultStats.priceChange24h]);

  return (
    <div className="mb-8">
      <div className="tech-card">
        <div className="flex items-start">
          <div className="p-3 rounded-md bg-gray-800/70 mr-4">
            <FaCoins className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-2">钱库系统与通证价值稳定</h2>
            </div>

            {/* 导航标签 */}
            <div className="mb-6 border-b border-gray-700">
              <div className="flex flex-wrap">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-4 flex items-center ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  <FaChartLine className="mr-2" />
                  <span>概览</span>
                </button>
                <button
                  onClick={() => setActiveTab('whitelist')}
                  className={`py-2 px-4 flex items-center ${activeTab === 'whitelist' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  <FaUserCheck className="mr-2" />
                  <span>白名单</span>
                </button>
                <button
                  onClick={() => setActiveTab('mechanisms')}
                  className={`py-2 px-4 flex items-center ${activeTab === 'mechanisms' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  <FaShieldAlt className="mr-2" />
                  <span>稳定机制</span>
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`py-2 px-4 flex items-center ${activeTab === 'config' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                >
                  <FaCog className="mr-2" />
                  <span>高级配置</span>
                </button>
              </div>
            </div>

            {/* 概览面板 */}
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-4">
                    <div className="text-gray-400 text-sm mb-1">总通证数量</div>
                    <div className="text-2xl font-bold">
                      {vaultStats.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">最大供应量</div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-4">
                    <div className="text-gray-400 text-sm mb-1">流通通证</div>
                    <div className="text-2xl font-bold">
                      {vaultStats.circulatingSupply.toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {(
                        (vaultStats.circulatingSupply /
                          vaultStats.totalTokens) *
                        100
                      ).toFixed(1)}
                      % 总量
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-4">
                    <div className="text-gray-400 text-sm mb-1">储备率</div>
                    <div className="text-2xl font-bold">
                      {(vaultStats.reserveRatio * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      最低阈值: 50%
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <TokenChart />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
                    <h3 className="font-medium mb-3">通证价值状态</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-3xl font-bold">
                          {vaultStats.lastPrice.toFixed(2)} SM
                        </div>
                        <div
                          className={`flex items-center mt-1 ${vaultStats.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {vaultStats.priceChange24h >= 0 ? '↑' : '↓'}{' '}
                          {Math.abs(vaultStats.priceChange24h).toFixed(2)}%
                          <span className="text-xs text-gray-400 ml-1">
                            24小时
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-block px-3 py-1 rounded-full ${getTokenStatusStyle(vaultStats.priceStability)} bg-opacity-20`}
                        >
                          {getTokenStatusText(vaultStats.priceStability)}
                        </div>
                        <div className="text-gray-400 text-xs mt-2">
                          上次更新: {new Date().toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
                    <h3 className="font-medium mb-3">系统状态</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FaShieldAlt className="text-primary mr-2" />
                          <span>价格稳定机制</span>
                        </div>
                        <div className="text-green-400">运行中</div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FaUserCheck className="text-primary mr-2" />
                          <span>白名单系统</span>
                        </div>
                        <div
                          className={
                            whitelistEnabled
                              ? 'text-green-400'
                              : 'text-gray-400'
                          }
                        >
                          {whitelistEnabled ? '已启用' : '已禁用'}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FaShieldAlt className="text-primary mr-2" />
                          <span>自动回购</span>
                        </div>
                        <div className="text-yellow-400">准备触发中</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 白名单面板 */}
            {activeTab === 'whitelist' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${whitelistEnabled ? 'bg-green-400' : 'bg-gray-400'} mr-2`}
                    ></div>
                    <span>
                      白名单状态: {whitelistEnabled ? '已启用' : '已禁用'}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setWhitelistEnabled(!whitelistEnabled)}
                      className={`text-sm px-3 py-1 rounded-md ${whitelistEnabled ? 'bg-gray-700 text-gray-300' : 'bg-primary text-white'}`}
                    >
                      {whitelistEnabled ? '禁用白名单' : '启用白名单'}
                    </button>
                    <button
                      onClick={() => setShowAddWhitelistModal(true)}
                      className="text-sm px-3 py-1 rounded-md bg-primary text-white"
                    >
                      添加用户
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700 rounded-md">
                  <div className="grid grid-cols-12 text-gray-400 text-sm p-3 border-b border-gray-700">
                    <div className="col-span-1">#</div>
                    <div className="col-span-3">用户</div>
                    <div className="col-span-4">地址</div>
                    <div className="col-span-2">授权额度</div>
                    <div className="col-span-2">状态</div>
                  </div>

                  {whitelistUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      暂无白名单用户
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {whitelistUsers.map((user, index) => (
                        <div
                          key={user.id}
                          className="grid grid-cols-12 p-3 hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="col-span-1 font-mono text-gray-500">
                            {index + 1}
                          </div>
                          <div className="col-span-3">{user.name}</div>
                          <div className="col-span-4 text-gray-400 text-sm truncate">
                            {user.address}
                          </div>
                          <div className="col-span-2">
                            {user.allowance.toLocaleString()} SM
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                user.status === 'active'
                                  ? 'bg-green-500/20 text-green-500'
                                  : user.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {user.status === 'active'
                                ? '活跃'
                                : user.status === 'pending'
                                  ? '待审核'
                                  : '已暂停'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 稳定机制面板 */}
            {activeTab === 'mechanisms' && (
              <div>
                <p className="text-gray-400 mb-4">
                  通证价值稳定机制用于维持通证价格的稳定性，减少市场波动对生态系统的影响。
                </p>

                <div className="space-y-4">
                  {stabilizationMechanisms.map((mechanism) => (
                    <div
                      key={mechanism.id}
                      className="bg-gray-800/30 border border-gray-700 rounded-md p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{mechanism.name}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {mechanism.description}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              mechanism.impact === 'high'
                                ? 'bg-red-500/20 text-red-500'
                                : mechanism.impact === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-500'
                                  : 'bg-blue-500/20 text-blue-500'
                            }`}
                          >
                            {mechanism.impact === 'high'
                              ? '高影响'
                              : mechanism.impact === 'medium'
                                ? '中等影响'
                                : '低影响'}
                          </span>

                          <button
                            onClick={() => toggleMechanismStatus(mechanism.id)}
                            className={`text-sm px-3 py-1 rounded-md ${
                              mechanism.status === 'active'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {mechanism.status === 'active'
                              ? '已启用'
                              : '已禁用'}
                          </button>
                        </div>
                      </div>

                      {mechanism.lastTriggered && (
                        <div className="text-xs text-gray-500 mt-2">
                          上次触发: {mechanism.lastTriggered.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 高级配置面板 */}
            {activeTab === 'config' && (
              <div>
                <StabilizationConfig />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加白名单用户对话框 */}
      {showAddWhitelistModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gray-800 border border-gray-700 rounded-md max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">添加白名单用户</h3>
              <button
                onClick={() => setShowAddWhitelistModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  value={newWhitelistUser.name}
                  onChange={(e) =>
                    setNewWhitelistUser({
                      ...newWhitelistUser,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                  placeholder="输入用户名称"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  钱包地址
                </label>
                <input
                  type="text"
                  value={newWhitelistUser.address}
                  onChange={(e) =>
                    setNewWhitelistUser({
                      ...newWhitelistUser,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                  placeholder="输入钱包地址"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  授权额度
                </label>
                <input
                  type="number"
                  value={newWhitelistUser.allowance}
                  onChange={(e) =>
                    setNewWhitelistUser({
                      ...newWhitelistUser,
                      allowance: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAddWhitelistModal(false)}
                className="mr-2 px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                取消
              </button>
              <button
                onClick={addWhitelistUser}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenVault;
