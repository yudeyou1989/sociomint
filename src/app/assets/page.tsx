'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaWallet,
  FaExchangeAlt,
  FaHistory,
  FaArrowRight,
  FaCopy,
  FaTimes,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function AssetsPage() {
  const { wallet, connect, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<'assets' | 'exchange' | 'history'>(
    'assets',
  );
  const [exchangeModal, setExchangeModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<
    'bnb_to_sm' | 'rf_to_sm'
  >('bnb_to_sm');

  // 模拟余额数据 - 在实际应用中，这些数据应该从区块链获取
  const balances = {
    sm: wallet?.isConnected ? 1250.75 : 0,
    bnb: wallet?.isConnected ? 0.5432 : 0,
    redFlower: wallet?.isConnected ? 350 : 0,
  };

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard
        .writeText(wallet.address)
        .then(() => {
          toast.success('地址已复制到剪贴板');
        })
        .catch(() => {
          toast.error('复制失败');
        });
    }
  };

  const openExchangeModal = (type: 'bnb_to_sm' | 'rf_to_sm') => {
    setSelectedExchange(type);
    setExchangeModal(true);
  };

  // 处理连接钱包
  const handleConnect = async () => {
    try {
      if (!wallet?.isConnected) {
        await connect();
      }
    } catch (error) {
      console.error('连接钱包失败', error);
      toast.error('连接钱包失败');
    }
  };

  // 处理断开连接
  const handleDisconnect = async () => {
    try {
      if (wallet?.isConnected) {
        await disconnect();
      }
    } catch (error) {
      console.error('断开钱包失败', error);
      toast.error('断开钱包失败');
    }
  };

  // 获取简短的钱包地址显示
  const shortAddress = wallet?.account?.address
    ? `${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(38)}`
    : '';

  // 资产标签
  const AssetsTab = () => (
    <div className="space-y-6">
      {wallet?.isConnected ? (
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                <FaWallet className="w-4 h-4" />
              </div>
              <div className="font-medium">{formatAddress(wallet?.address)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAddress}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                title="复制地址"
              >
                <FaCopy className="w-4 h-4 text-gray-400" />
              </button>
              <a
                href={`https://bscscan.com/address/${wallet?.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                title="在BSCScan上查看"
              >
                <FaExternalLinkAlt className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-yellow-400 mb-4">请连接钱包以查看您的资产</p>
        </div>
      )}

      <h2 className="text-xl font-bold">代币资产</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SM代币 */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold">SM</span>
              </div>
              <div>
                <div className="font-semibold">SocioMint</div>
                <div className="text-gray-400 text-sm">SM</div>
              </div>
            </div>
            <button
              onClick={() => openExchangeModal('bnb_to_sm')}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              title="兑换SM"
            >
              <FaExchangeAlt className="w-4 h-4 text-primary" />
            </button>
          </div>
          <div className="text-2xl font-bold">{balances.sm.toFixed(2)}</div>
        </div>

        {/* 小红花 */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">🌸</span>
              </div>
              <div>
                <div className="font-semibold">平台积分</div>
                <div className="text-gray-400 text-sm">小红花</div>
              </div>
            </div>
            <button
              onClick={() => openExchangeModal('rf_to_sm')}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              title="兑换SM"
            >
              <FaExchangeAlt className="w-4 h-4 text-primary" />
            </button>
          </div>
          <div className="text-2xl font-bold">
            {balances.redFlower.toFixed(0)}
          </div>
        </div>

        {/* BNB */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <div className="font-semibold">BNB</div>
                <div className="text-gray-400 text-sm">BNB Chain</div>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold">{balances.bnb.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );

  // 兑换标签
  const ExchangeTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">代币兑换</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BNB兑换SM */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold">SM</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">BNB兑换SM</h3>
          <p className="text-gray-400 text-sm mb-4">
            将您的BNB兑换为SocioMint代币
          </p>
          <button
            onClick={() => openExchangeModal('bnb_to_sm')}
            className="neon-button py-2 px-4 w-full"
            disabled={!wallet?.isConnected}
          >
            兑换
          </button>
        </div>

        {/* 小红花兑换SM */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold">🌸</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold">SM</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">小红花兑换SM</h3>
          <p className="text-gray-400 text-sm mb-4">
            将平台积分小红花兑换为SM代币
          </p>
          <button
            onClick={() => openExchangeModal('rf_to_sm')}
            className="neon-button py-2 px-4 w-full"
            disabled={!wallet?.isConnected}
          >
            兑换
          </button>
        </div>
      </div>
    </div>
  );

  // 交易历史标签
  const HistoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">交易历史</h2>

      {wallet?.isConnected ? (
        <div className="glass-card p-5">
          <div className="text-center text-gray-400 py-10">
            <p>暂无交易记录</p>
          </div>
        </div>
      ) : (
        <div className="glass-card p-5">
          <div className="text-center text-yellow-400 py-10">
            请先连接钱包以查看交易历史
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">资产管理</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'assets' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              <FaWallet />
              <span>资产</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'exchange' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              <FaExchangeAlt />
              <span>兑换</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'history' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              <FaHistory />
              <span>历史</span>
            </div>
          </button>
        </div>
      </div>

      <div className="mb-8">
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'exchange' && <ExchangeTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>

      {/* 兑换模态框 */}
      {exchangeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md w-full mx-4 relative">
            {/* 关闭按钮 */}
            <button
              onClick={() => setExchangeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-semibold mb-6">
              {selectedExchange === 'bnb_to_sm' ? 'BNB兑换SM' : '小红花兑换SM'}
            </h3>

            <div className="text-center p-10 text-gray-300">
              <p>此功能正在开发中，敬请期待！</p>
            </div>
          </div>
        </div>
      )}

      {!wallet?.isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                请连接钱包以查看您的资产详情和进行交易。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
