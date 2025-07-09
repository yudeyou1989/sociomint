#!/bin/bash

# 生产环境构建脚本
echo "🚀 开始生产环境构建..."

# 设置环境变量
export NODE_ENV=production

# 清理缓存
echo "🧹 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "📦 安装项目依赖..."
  npm install --legacy-peer-deps
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 生产环境构建完成！"
