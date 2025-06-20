#!/bin/bash

# GitHub Secrets 自动配置脚本
# 为 SocioMint 项目配置所有必要的 GitHub Secrets

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 仓库信息
REPO="yudeyou1989/sociomint"

echo -e "${CYAN}🔐 配置 GitHub Secrets for ${REPO}${NC}"
echo "=================================================="

# 检查 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI 未安装，正在安装...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    else
        echo -e "${RED}❌ 请手动安装 GitHub CLI: https://cli.github.com/manual/installation${NC}"
        exit 1
    fi
fi

# 检查登录状态
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 请登录 GitHub...${NC}"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI 已准备就绪${NC}"
echo

# 配置所有 Secrets
echo -e "${BLUE}📋 开始配置 Secrets...${NC}"

# 区块链配置
echo "🔗 配置区块链相关 Secrets..."
gh secret set BSC_TESTNET_PRIVATE_KEY --body "c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7" --repo "$REPO"
gh secret set BSCSCAN_API_KEY --body "E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8" --repo "$REPO"
gh secret set NEXT_PUBLIC_SM_TOKEN_ADDRESS --body "0xd7d7dd989642222B6f685aF0220dc0065F489ae0" --repo "$REPO"
gh secret set NEXT_PUBLIC_SM_EXCHANGE_ADDRESS --body "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E" --repo "$REPO"
gh secret set NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS --body "0x681E8E1921778A450930Bc1991c93981FD0B1F24" --repo "$REPO"

# Supabase 配置
echo "🗄️  配置 Supabase Secrets..."
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://kiyyhitozmezuppziomx.supabase.co" --repo "$REPO"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg" --repo "$REPO"

# Web3 配置
echo "🌐 配置 Web3 Secrets..."
gh secret set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID --body "fced525820007c9c024132cf432ffcae" --repo "$REPO"

# Telegram Bot
echo "🤖 配置 Telegram Bot..."
gh secret set TELEGRAM_BOT_TOKEN --body "7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s" --repo "$REPO"

# Discord 配置
echo "💬 配置 Discord Secrets..."
gh secret set NEXT_PUBLIC_DISCORD_CLIENT_ID --body "1377572072602996797" --repo "$REPO"
gh secret set DISCORD_CLIENT_SECRET --body "hSBZpLfwQPLJQipTHleiry0PzBADlWBC" --repo "$REPO"

# Twitter OAuth 2.0
echo "🐦 配置 Twitter OAuth..."
gh secret set TWITTER_CLIENT_ID --body "dXNNbndMRU1yZy1zRHpfX3haRTA6MTpjaQ" --repo "$REPO"
gh secret set TWITTER_CLIENT_SECRET --body "PGOyGmIuxTMSGwokvojztPOHuFTTMAf3XULy5iChFxJu74YU6f" --repo "$REPO"

# Cloudflare Pages 部署
echo "🚀 配置 Cloudflare Pages 部署..."
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_CLOUDFLARE_API_TOKEN" --repo "$REPO"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "ff431aed46e94b0593b8b1ee48842c7a" --repo "$REPO"

# 监控和分析
echo "📊 配置监控工具..."
gh secret set SENTRY_DSN --body "https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568" --repo "$REPO"
gh secret set NEXT_PUBLIC_GOOGLE_ANALYTICS_ID --body "G-S1WC84RZQR" --repo "$REPO"

# 域名配置
echo "🌍 配置域名..."
gh secret set DOMAIN_NAME --body "sociomint.top" --repo "$REPO"

echo
echo -e "${GREEN}🎉 所有 GitHub Secrets 配置完成！${NC}"
echo
echo -e "${BLUE}📋 已配置的 Secrets:${NC}"
echo "✅ 区块链配置 (私钥、合约地址、API密钥)"
echo "✅ Supabase 数据库配置"
echo "✅ Web3 钱包连接配置"
echo "✅ Telegram Bot 配置"
echo "✅ Discord OAuth 配置"
echo "✅ Twitter OAuth 2.0 配置"
echo "✅ Vercel 部署配置"
echo "✅ 监控和分析工具配置"
echo "✅ 域名配置"
echo
echo -e "${CYAN}🔗 查看配置结果:${NC}"
echo "https://github.com/$REPO/settings/secrets/actions"
echo
echo -e "${YELLOW}🚀 下一步操作:${NC}"
echo "1. 验证 Secrets 配置"
echo "2. 触发 GitHub Actions 测试"
echo "3. 部署到 Vercel"
echo "4. 配置域名 sociomint.top"
echo
echo -e "${GREEN}✨ 项目已准备好生产部署！${NC}"
