#!/bin/bash

# 域名配置脚本
# 为 sociomint.top 配置 DNS 记录指向 Cloudflare Pages

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🌐 配置域名 sociomint.top DNS 记录${NC}"
echo "=================================================="

echo -e "${BLUE}📋 需要在 GoDaddy 配置以下 DNS 记录:${NC}"
echo
echo -e "${GREEN}A 记录配置:${NC}"
echo "类型: A"
echo "名称: @"
echo "值: 76.76.19.61"
echo "TTL: 600"
echo
echo -e "${GREEN}CNAME 记录配置:${NC}"
echo "类型: CNAME"
echo "名称: www"
echo "值: sociomint.pages.dev"
echo "TTL: 600"
echo
echo -e "${YELLOW}⚠️  注意事项:${NC}"
echo "1. 删除所有现有的 A 记录和 CNAME 记录"
echo "2. 确保只有上述两条记录"
echo "3. DNS 传播可能需要 24-48 小时"
echo "4. 可以使用 dig 命令检查 DNS 状态"
echo
echo -e "${BLUE}🔍 DNS 检查命令:${NC}"
echo "dig sociomint.top"
echo "dig www.sociomint.top"
echo
echo -e "${CYAN}🔗 GoDaddy DNS 管理链接:${NC}"
echo "https://dcc.godaddy.com/manage/sociomint.top/dns"
echo
echo -e "${GREEN}✅ 配置完成后，域名将指向 Cloudflare Pages 部署${NC}"

# 检查当前 DNS 状态
echo -e "${BLUE}📊 当前 DNS 状态检查:${NC}"
echo "检查 sociomint.top A 记录..."
dig +short sociomint.top A || echo "无法解析"
echo
echo "检查 www.sociomint.top CNAME 记录..."
dig +short www.sociomint.top CNAME || echo "无法解析"
echo

echo -e "${YELLOW}🚀 下一步操作:${NC}"
echo "1. 登录 GoDaddy DNS 管理"
echo "2. 配置上述 DNS 记录"
echo "3. 等待 DNS 传播"
echo "4. 在 Cloudflare Pages 中添加自定义域名"
echo "5. 验证 SSL 证书自动配置"
