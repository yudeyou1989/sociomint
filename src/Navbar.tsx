'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center" onClick={closeMenu}>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">SocioMint</span>
            </Link>
          </div>
          
          {/* 桌面导航 */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
            >
              {t('navigation.home')}
            </Link>
            <Link 
              href="/exchange" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/exchange') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
            >
              {t('navigation.exchange')}
            </Link>
            <Link 
              href="/verify" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/verify') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
            >
              {t('navigation.verify')}
            </Link>
            <Link 
              href="/history" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/history') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
            >
              {t('navigation.history')}
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            <LanguageSwitcher />
            <ConnectWalletButton />
          </div>
          
          {/* 移动端菜单按钮 */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 移动端导航菜单 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={closeMenu}
            >
              {t('navigation.home')}
            </Link>
            <Link
              href="/exchange"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/exchange') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={closeMenu}
            >
              {t('navigation.exchange')}
            </Link>
            <Link
              href="/verify"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/verify') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={closeMenu}
            >
              {t('navigation.verify')}
            </Link>
            <Link
              href="/history"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/history') 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={closeMenu}
            >
              {t('navigation.history')}
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-5 space-x-4">
              <LanguageSwitcher />
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
