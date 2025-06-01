'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';
import { useWallet } from '@/contexts/WalletContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletSelectModal = ({ isOpen, onClose }: WalletSelectModalProps) => {
  const { connectWallet, isConnecting, availableWallets } = useWallet();
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const [connectingIndex, setConnectingIndex] = useState<number | null>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // 处理连接钱包
  const handleWalletConnect = async (index: number) => {
    const wallet = availableWallets[index];
    setConnectingIndex(index);
    await connectWallet(wallet.type);
    setConnectingIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000000]"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full mx-4 shadow-2xl shadow-[#0de5ff]/10"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">{t('profile.connectWallet')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={t('common.cancel')}
          >
            <IoMdClose size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid gap-2">
            {Array.isArray(availableWallets) ? (
              availableWallets.map((wallet, index) => {
                const isCurrentConnecting = connectingIndex === index;
                const isWalletConnecting =
                  isConnecting && connectingIndex === index;

                return (
                  <button
                    key={wallet.type}
                    onClick={() => handleWalletConnect(index)}
                    disabled={isConnecting}
                    className={`
                      flex items-center justify-between p-3 rounded-lg transition-all
                      ${wallet.installed ? 'bg-gray-800 border border-gray-700 hover:border-[#0de5ff]/50' : 'bg-gray-800/50 border border-gray-800'}
                      ${isCurrentConnecting ? 'border-[#0de5ff]' : ''}
                      ${!wallet.installed && wallet.type !== 'walletconnect' ? 'opacity-60' : 'opacity-100'}
                    `}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md bg-gray-700 flex items-center justify-center mr-3 p-1">
                        <div className="relative w-full h-full">
                          <Image
                            src={wallet.icon}
                            alt={wallet.name}
                            width={32}
                            height={32}
                            className="object-contain"
                            onError={(e) => {
                              // 图片加载失败时的替代方案
                              (e.target as HTMLImageElement).src =
                                '/images/wallets/generic.svg';
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-left">{wallet.name}</div>
                        {!wallet.installed && wallet.type !== 'walletconnect' && (
                          <div className="text-xs text-gray-400 text-left">
                            {t('profile.notInstalled')}
                          </div>
                        )}
                      </div>
                    </div>

                    {isWalletConnecting && (
                      <div className="w-5 h-5 border-2 border-t-transparent border-[#0de5ff] rounded-full animate-spin"></div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-400">
                {t('common.loading')}...
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            {t('profile.walletTermsAgreement')}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <a
            href="https://docs.sociomint.com/help/wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0de5ff] hover:text-white text-sm flex items-center underline"
          >
            {t('common.needHelp')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletSelectModal;
