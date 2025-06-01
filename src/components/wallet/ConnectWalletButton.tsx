'use client';

import { useState, useEffect } from 'react';
import { FaWallet } from 'react-icons/fa';
import { IoExitOutline } from 'react-icons/io5';
import { useWallet } from '@/contexts/WalletContext';
import WalletSelectModal from './WalletSelectModal';
import NetworkSwitcher from './NetworkSwitcher';
import { getNetworkInfo } from '@/services/walletService';
import ClientOnly from '../ClientOnly';

export default function ConnectWalletButton() {
  return (
    <ClientOnly>
      <ConnectWalletButtonInner />
    </ClientOnly>
  );
}

function ConnectWalletButtonInner() {
  const { wallet, disconnectWallet, isConnecting } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [networkName, setNetworkName] = useState<string>('');

  // 格式化地址显示，隐藏中间部分
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 获取并设置当前网络名称
  useEffect(() => {
    if (wallet.isConnected && wallet.chainId) {
      const network = getNetworkInfo(wallet.chainId);
      setNetworkName(network?.name || `Chain ${wallet.chainId}`);
    } else {
      setNetworkName('');
    }
  }, [wallet.isConnected, wallet.chainId]);

  // 打开钱包选择模态框
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // 关闭钱包选择模态框
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 鼠标悬停状态管理
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 网络切换器 */}
      {wallet.isConnected && <NetworkSwitcher />}

      {/* 连接按钮 */}
      {!wallet.isConnected ? (
        <button
          onClick={handleOpenModal}
          disabled={isConnecting}
          className="neon-button py-1.5 px-4 rounded-md flex items-center gap-2 transition-all duration-300 hover:shadow-[0_0_8px_2px_rgba(13,229,255,0.3)]"
          aria-label="连接钱包"
          title="连接区块链钱包"
        >
          {isConnecting ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : (
            <FaWallet className="w-4 h-4" />
          )}
          <span>{isConnecting ? '连接中...' : '连接钱包'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center bg-gray-800 rounded-md py-1.5 px-3 border transition-all duration-300 ${
              isHovered
                ? 'border-[#0de5ff]/70 shadow-[0_0_8px_1px_rgba(13,229,255,0.2)]'
                : 'border-gray-700'
            }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            title={`${wallet.address} (${networkName})`}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">
              {formatAddress(wallet.address!)}
            </span>
          </div>
          <button
            onClick={disconnectWallet}
            className="text-gray-400 hover:text-white p-1.5 rounded-md transition-colors hover:bg-gray-800"
            title="断开连接"
            aria-label="断开钱包连接"
          >
            <IoExitOutline className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 钱包选择模态框 */}
      <WalletSelectModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
