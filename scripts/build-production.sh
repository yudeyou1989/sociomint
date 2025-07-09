#!/bin/bash

# 生产环境构建脚本
echo "🚀 开始生产环境构建..."

# 备份原始package.json
cp package.json package.json.backup

# 使用生产环境package.json
cp package.production.json package.json

# 清理node_modules
rm -rf node_modules

# 安装生产依赖
echo "📦 安装生产依赖..."
npm install --legacy-peer-deps --production

# 构建项目
echo "🔨 构建项目..."
npm run build

# 恢复原始package.json
mv package.json.backup package.json

echo "✅ 生产环境构建完成！"
