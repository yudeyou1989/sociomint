import Link from 'next/link';
import { useState } from 'react';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import ConnectWalletButton from '../wallet/ConnectWalletButton';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <header className="py-4 px-4 md:px-8 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-white flex items-center"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            SocioMint
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/tasks"
            className="text-gray-300 hover:text-white transition-colors"
          >
            任务中心
          </Link>
          <Link
            href="/exchange"
            className="text-gray-300 hover:text-white transition-colors"
          >
            代币兑换
          </Link>
          <Link
            href="/market"
            className="text-gray-300 hover:text-white transition-colors"
          >
            小红花市场
          </Link>
          <Link
            href="/profile"
            className="text-gray-300 hover:text-white transition-colors"
          >
            我的账户
          </Link>
          <Link
            href="/about"
            className="text-gray-300 hover:text-white transition-colors"
          >
            关于我们
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {/* 语言切换器 */}
          <LanguageSwitcher />
          
          {/* 钱包连接按钮 */}
          <ConnectWalletButton />

          <Link href="/profile">
            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
              <FaUser className="text-gray-300" />
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white"
          onClick={toggleMenu}
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
        >
          {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute left-0 right-0 top-full bg-gray-900 border-b border-gray-800 transition-all duration-300 ${menuOpen ? 'max-h-96 py-4' : 'max-h-0 overflow-hidden'}`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex flex-col space-y-4 mb-6">
            <Link
              href="/tasks"
              className="text-gray-300 hover:text-white transition-colors py-2"
            >
              任务中心
            </Link>
            <Link
              href="/exchange"
              className="text-gray-300 hover:text-white transition-colors py-2"
            >
              代币兑换
            </Link>
            <Link
              href="/market"
              className="text-gray-300 hover:text-white transition-colors py-2"
            >
              小红花市场
            </Link>
            <Link
              href="/profile"
              className="text-gray-300 hover:text-white transition-colors py-2"
            >
              我的账户
            </Link>
            <Link
              href="/about"
              className="text-gray-300 hover:text-white transition-colors py-2"
            >
              关于我们
            </Link>
          </nav>

          <div className="flex items-center justify-between py-2">
            {/* 移动端语言切换器 */}
            <LanguageSwitcher />
            
            <div className="flex items-center space-x-3">
              <ConnectWalletButton />

              <Link href="/profile">
                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                  <FaUser className="text-gray-300" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
