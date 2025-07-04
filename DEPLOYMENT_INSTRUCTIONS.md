# SocioMint 部署指导手册

## 📋 部署前准备清单

### ✅ 您需要完成的手动操作

#### 1. 修复Cloudflare API权限 (必需)

**操作步骤**:
1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token" → "Custom token"
3. 设置权限:
   ```
   Permissions:
   - Zone:Read (All zones)
   - Page:Edit (All accounts) 
   - Account:Read (Your account)
   
   Account Resources: Include - Your account
   Zone Resources: Include - sociomint.top
   ```
4. 复制新Token并保存

#### 2. 配置GitHub Secrets (必需)

**访问地址**: https://github.com/yudeyou1989/sociomint/settings/secrets/actions

**添加Secrets** (点击 "New repository secret"):
```
CLOUDFLARE_API_TOKEN=[您的新Token]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c
PRIVATE_KEY=c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7
BSCSCAN_API_KEY=E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8
DISCORD_PUBLIC_KEY=503e65872d278469c269776fb904c10885beb1dd180aca5338ca7a5664b2c9e0
TWITTER_ACCESS_TOKEN=1517814177359753216-avZNfz2TQULAOoRnlh4SYIX9bWuhvi
TWITTER_ACCESS_TOKEN_SECRET=cOIsVBdLgaHjJ63XsNhltGDkpvIFfKl9ZXJvlsX7PXCKo
TELEGRAM_BOT_TOKEN=7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s
```

**添加Variables** (点击 "Variables" 标签):
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS=0x681E8E1921778A450930Bc1991c93981FD0B1F24
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
NEXT_PUBLIC_DISCORD_CLIENT_ID=1377572072602996797
CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a
```

## 🚀 自动化部署流程

### 方法1: 使用自动化脚本 (推荐)

完成上述手动操作后，运行:
```bash
cd sociomint
./scripts/deploy-production.sh
```

### 方法2: 手动部署步骤

```bash
# 1. 设置环境变量
export CLOUDFLARE_API_TOKEN=your_new_token
export CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a

# 2. 安装依赖
npm ci

# 3. 构建项目
npm run build

# 4. 部署到Cloudflare
npx wrangler pages deploy --commit-dirty=true

# 5. 验证部署
node scripts/verify-deployment.js
```

## 🔧 故障排除

### 常见问题及解决方案

#### 1. Cloudflare认证失败
```bash
# 验证Token权限
npx wrangler whoami

# 如果失败，重新设置Token
export CLOUDFLARE_API_TOKEN=your_new_token
```

#### 2. 构建文件过大
```bash
# 清理缓存
rm -rf .next/cache cache
find .next -name "*.pack" -delete

# 重新构建
npm run build
```

#### 3. RPC连接问题
```bash
# 测试RPC连接
node scripts/test-rpc-connection.js

# 如果失败，检查网络或使用VPN
```

## 📊 部署后验证

### 必须验证的功能

1. **网站访问**: https://sociomint.top
2. **钱包连接**: MetaMask连接功能
3. **代币交换**: SM代币购买/出售
4. **社交任务**: 任务列表加载
5. **空投池**: 空投池功能
6. **响应式**: 移动端适配

### 验证命令
```bash
# 运行完整验证
node scripts/verify-deployment.js

# 测试特定功能
curl https://sociomint.top/api/social-tasks
curl https://sociomint.top/api/airdrop-pools
```

## 🎯 主网合约部署 (后续)

### 准备工作
1. 确保钱包有足够BNB (约0.05 BNB)
2. 测试RPC连接
3. 验证合约代码

### 部署命令
```bash
# 测试RPC连接
node scripts/test-rpc-connection.js

# 部署主网合约
npx hardhat run scripts/deploy-mainnet.js --network bsc

# 验证合约
npx hardhat verify --network bsc [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
```

### 部署后更新
1. 更新环境变量中的合约地址
2. 重新部署前端
3. 全面测试功能

## 📞 支持联系

如遇问题，请检查:
1. [项目完成报告](./PROJECT_COMPLETION_REPORT.md)
2. [问题解决指南](./ISSUE_RESOLUTION_GUIDE.md)
3. [部署检查清单](./DEPLOYMENT_CHECKLIST.md)

## 🎉 部署成功标志

- ✅ https://sociomint.top 可正常访问
- ✅ 钱包连接功能正常
- ✅ 所有API端点响应正常
- ✅ 移动端适配正常
- ✅ 社交功能正常

完成以上验证后，SocioMint项目即可正式上线运营！
