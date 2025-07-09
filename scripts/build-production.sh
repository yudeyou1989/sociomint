#!/bin/bash

# 生产环境构建脚本
echo "🚀 开始生产环境构建..."

# 设置环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 清理所有缓存和临时文件
echo "🧹 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache
rm -rf cache
rm -rf out

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "📦 安装项目依赖..."
  npm install --legacy-peer-deps
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 清理构建后的大文件
echo "🧹 清理构建后的大文件..."
find .next -name "*.pack" -size +20M -delete 2>/dev/null || true
find .next -name "cache" -type d -exec rm -rf {} + 2>/dev/null || true
find .next -path "*/webpack/*" -name "*.pack" -delete 2>/dev/null || true

echo "✅ 生产环境构建完成！"
