import { ReactNode, memo, useMemo } from 'react';
import Navbar from './Navbar';
import BackgroundEffect from '../ui/BackgroundEffect';

interface PageLayoutProps {
  children: ReactNode;
}

// 使用memo优化静态组件，避免不必要的重新渲染
const DecorativeElements = memo(() => (
  <>
    {/* 左侧装饰元素 */}
    <div className="hidden md:block fixed -left-10 top-1/4 w-56 h-80 rounded-full blur-[100px] bg-gradient-to-br from-primary/20 to-transparent"></div>

    {/* 右侧装饰元素 */}
    <div className="hidden md:block fixed -right-10 top-2/3 w-60 h-60 rounded-full blur-[100px] bg-gradient-to-br from-secondary/20 to-transparent"></div>
  </>
));

// 使用memo优化静态组件
const MainDecorativeElements = memo(() => (
  <>
    {/* 装饰元素 - 顶部模糊圆 */}
    <div className="blur-circle w-40 h-40 top-0 right-1/4 bg-primary/10"></div>
    {/* 装饰元素 - 底部模糊圆 */}
    <div className="blur-circle w-60 h-60 bottom-0 left-1/3 bg-secondary/10"></div>
  </>
));

// 使用memo优化页脚组件
const Footer = memo(() => {
  // 使用useMemo缓存年份计算
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="text-center text-gray-400 text-sm py-6 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <p>
          &copy; {currentYear} SocioMint. 连接社交，赋能加密。
        </p>
      </div>
    </footer>
  );
});

// 为了显式命名组件，便于调试
DecorativeElements.displayName = 'DecorativeElements';
MainDecorativeElements.displayName = 'MainDecorativeElements';
Footer.displayName = 'Footer';

// 主布局组件
function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* 背景效果 */}
      <BackgroundEffect />

      <DecorativeElements />

      <div className="relative z-10">
        <Navbar />
        <main className="pt-20 px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
          <MainDecorativeElements />
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

// 使用memo包装整个PageLayout组件
export default memo(PageLayout);
