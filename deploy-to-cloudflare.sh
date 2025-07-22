#!/bin/bash

# SocioMint Cloudflare Pages 自动部署脚本
# 使用 Wrangler CLI 直接部署

set -e

echo "🚀 SocioMint Cloudflare Pages 自动部署"
echo "======================================"

# 检查 out 目录
if [ ! -d "out" ]; then
    echo "❌ out 目录不存在，请先运行构建："
    echo "   npm run build"
    exit 1
fi

echo "✅ 找到 out 目录，包含以下文件："
ls -la out/ | head -10

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 Wrangler CLI..."
    npm install -g wrangler
fi

echo ""
echo "🔐 请确保已登录 Cloudflare："
echo "   如果未登录，请运行: wrangler login"
echo ""

# 部署到 Cloudflare Pages
echo "🚀 开始部署到 Cloudflare Pages..."
echo "项目名称: sociomint008"
echo "部署目录: $(pwd)/out"
echo ""

# 执行部署
wrangler pages deploy out --project-name=sociomint008 --compatibility-date=2024-01-01

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: https://sociomint008.pages.dev"
echo "🌐 自定义域名: https://sociomint.top"
echo ""
echo "📋 如果需要配置自定义域名："
echo "1. 在 Cloudflare Dashboard 中进入 Pages 项目"
echo "2. 点击 'Custom domains' 标签"
echo "3. 添加 sociomint.top 域名"
