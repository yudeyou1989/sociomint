import React from 'react';
import Link from 'next/link';

/**
 * 全局 404 页面
 *
 * 当访问不存在的路径时显示此页面
 * 在 Next.js App Router 中，这个文件必须命名为 not-found.tsx
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <h1 className="text-8xl font-bold text-yellow-400 mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-white mb-4">
          页面未找到
        </h2>

        <p className="text-gray-400 mb-8">
          您访问的页面不存在或已被移除。请检查URL是否正确，或使用下面的按钮返回首页。
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🏠 返回首页
          </Link>

          <Link
            href="/market"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🔍 浏览市场
          </Link>
        </div>
      </div>
    </div>
  );
}
