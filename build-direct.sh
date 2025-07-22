#!/bin/bash

echo "🚀 开始直接构建..."

# 清理旧文件
echo "🧹 清理旧文件..."
rm -rf out .next

# 设置环境变量
export NODE_ENV=production

# 直接运行Next.js构建
echo "🔨 运行Next.js构建..."
./node_modules/.bin/next build

# 检查构建结果
if [ -d "out" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件:"
    ls -la out/
else
    echo "❌ 构建失败，out目录不存在"
    exit 1
fi
