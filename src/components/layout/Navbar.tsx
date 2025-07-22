'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaStore, FaWallet, FaShieldAlt } from 'react-icons/fa';
import { GiGoldBar } from 'react-icons/gi';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { MdAdminPanelSettings } from 'react-icons/md';
import { BsFlower1 } from 'react-icons/bs';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccount } from 'wagmi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  // 多签钱包地址
  const MULTISIG_WALLET_ADDRESS = process.env.NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS?.toLowerCase();

  // 检查当前用户是否是多签钱包所有者（管理员）
  const [isAdmin, setIsAdmin] = useState(false);

  // 用于客户端渲染
  useEffect(() => {
    setMounted(true);

    // 检查当前用户是否是管理员
    if (isConnected && address && MULTISIG_WALLET_ADDRESS) {
      // 这里简化处理，实际应该从多签钱包合约获取所有者列表
      // 暂时假设多签钱包地址本身就是管理员
      setIsAdmin(address.toLowerCase() === MULTISIG_WALLET_ADDRESS);
    } else {
      setIsAdmin(false);
    }
  }, [isConnected, address, MULTISIG_WALLET_ADDRESS]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 基本导航链接配置
  const baseNavLinks = [
    { name: t('navigation.home'), href: '/', icon: "🏠" },
    { name: t('navigation.tasks'), href: '/tasks', icon: "📋" },
    { name: t('navigation.socialTasks'), href: '/social-tasks', icon: <BsFlower1 className="w-5 h-5" /> },
    { name: t('navigation.market'), href: '/market', icon: <FaStore className="w-5 h-5" /> },
    { name: t('navigation.assets'), href: '/assets', icon: <FaWallet className="w-5 h-5" /> },
    { name: t('navigation.vault'), href: '/vault', icon: <GiGoldBar className="w-5 h-5" /> },
    { name: t('navigation.referralSystem'), href: '/social-tasks?tab=referrals', icon: "👤" },
  ];

  // 管理员导航链接
  const adminNavLinks = [
    { name: '多签钱包', href: '/admin/multisig', icon: "🛡️" },
    { name: '管理仪表板', href: '/admin/dashboard', icon: "📈" },
    { name: '管理面板', href: '/admin', icon: <MdAdminPanelSettings className="w-5 h-5" /> },
  ];

  // 合并导航链接
  const navLinks = isAdmin ? [...baseNavLinks, ...adminNavLinks] : baseNavLinks;

  // 如果组件还未挂载，显示占位内容以避免闪烁
  if (!mounted) {
    return (
      <nav className="fixed top-0 w-full bg-black/40 border-b border-gray-800/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 占位内容 */}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 w-full bg-black/40 border-b border-gray-800/50 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                SM
              </div>
              <div className="text-white font-bold text-xl">SocioMint</div>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors hover:bg-white/5"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect wallet button and language switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-20">
              <LanguageSwitcher />
            </div>
            <ConnectWalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-16 mr-2">
              <LanguageSwitcher />
            </div>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              aria-label={isOpen ? t('common.closeMenu') : t('common.openMenu')}
            >
              {isOpen ? (
                <RiCloseLine className="block h-6 w-6" />
              ) : (
                <RiMenu3Line className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/60 backdrop-blur-lg border-t border-gray-800/30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
          <div className="flex items-center justify-end px-3 py-2">
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
