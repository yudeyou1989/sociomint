#!/bin/bash

# Cloudflare Pages 部署脚本
# 用于自动化部署到 Cloudflare Pages

set -e

echo "🚀 开始部署到 Cloudflare Pages..."

# 检查必需的环境变量
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ 错误: CLOUDFLARE_API_TOKEN 环境变量未设置"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ 错误: CLOUDFLARE_ACCOUNT_ID 环境变量未设置"
    exit 1
fi

# 设置项目变量
PROJECT_NAME="sociomint"
DOMAIN="sociomint.top"
BUILD_DIR="out"

echo "📦 安装依赖..."
npm ci

echo "🔧 构建项目..."
npm run build

echo "📤 部署到 Cloudflare Pages..."

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📥 安装 Wrangler CLI..."
    npm install -g wrangler
fi

# 认证 Cloudflare
echo "🔐 认证 Cloudflare..."
echo "$CLOUDFLARE_API_TOKEN" | wrangler auth login --api-token

# 部署到 Cloudflare Pages
echo "🚀 执行部署..."
wrangler pages deploy $BUILD_DIR --project-name=$PROJECT_NAME --compatibility-date=2024-01-01

echo "✅ 部署完成!"
echo "🌐 网站地址: https://$DOMAIN"
echo "📊 Cloudflare 控制台: https://dash.cloudflare.com/"

# 验证部署
echo "🔍 验证部署状态..."
sleep 10

# 检查网站是否可访问
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo "✅ 网站部署成功，可以正常访问!"
else
    echo "⚠️  网站部署完成，但可能需要几分钟才能完全生效"
fi

echo "🎉 部署流程完成!"
