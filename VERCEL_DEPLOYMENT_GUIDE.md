# 🚀 Vercel 部署指南

## 📋 前置条件

✅ GitHub Secrets 已配置完成  
✅ 域名 sociomint.top 已注册  
✅ 代码已推送到 GitHub 仓库

## 🔧 步骤 1：导入 GitHub 项目到 Vercel

1. **访问 Vercel 控制台**
   - 打开 https://vercel.com/dashboard
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 找到并选择 `yudeyou1989/sociomint` 仓库
   - 点击 "Import"

3. **配置项目设置**
   - Project Name: `sociomint`
   - Framework Preset: `Next.js`
   - Root Directory: `./` (默认)
   - Build Command: `npm run build` (默认)
   - Output Directory: `.next` (默认)
   - Install Command: `npm ci` (默认)

## ⚙️ 步骤 2：配置环境变量

在 Vercel 项目设置中添加以下环境变量：

### 🔐 必需的环境变量

```bash
# 数据库配置
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg

# 区块链配置
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS=0x681E8E1921778A450930Bc1991c93981FD0B1F24
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
BSC_TESTNET_PRIVATE_KEY=c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7
BSCSCAN_API_KEY=E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8

# 社交登录配置
NEXT_PUBLIC_DISCORD_CLIENT_ID=1377572072602996797
DISCORD_CLIENT_SECRET=hSBZpLfwQPLJQipTHleiry0PzBADlWBC
TWITTER_CLIENT_ID=dXNNbndMRU1yZy1zRHpfX3haRTA6MTpjaQ
TWITTER_CLIENT_SECRET=PGOyGmIuxTMSGwokvojztPOHuFTTMAf3XULy5iChFxJu74YU6f

# Telegram Bot
TELEGRAM_BOT_TOKEN=7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s

# 监控和分析
SENTRY_DSN=https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-S1WC84RZQR

# 域名配置
DOMAIN_NAME=sociomint.top
```

## 🌐 步骤 3：配置自定义域名

1. **在 Vercel 项目中添加域名**
   - 进入项目设置 → Domains
   - 添加 `sociomint.top`
   - 添加 `www.sociomint.top`

2. **配置 DNS 记录**
   - 登录 GoDaddy DNS 管理
   - 更新 A 记录：`@` → `76.76.19.61`
   - 确认 CNAME 记录：`www` → `cname.vercel-dns.com`

## 🚀 步骤 4：部署项目

1. **触发部署**
   - 在 Vercel 控制台点击 "Deploy"
   - 或推送代码到 GitHub 触发自动部署

2. **验证部署**
   - 检查构建日志
   - 访问 Vercel 提供的预览 URL
   - 等待域名 DNS 传播

## ✅ 步骤 5：验证功能

### 🔍 基本功能检查
- [ ] 网站可以访问 (https://sociomint.top)
- [ ] SSL 证书正常
- [ ] 页面加载正常
- [ ] 钱包连接功能
- [ ] 数据库连接正常

### 🔐 社交登录测试
- [ ] Discord 登录：https://discord.com/api/oauth2/authorize?client_id=1377572072602996797&redirect_uri=https%3A%2F%2Fsociomint.top%2Fapi%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify+email
- [ ] Twitter 登录：https://twitter.com/i/oauth2/authorize?client_id=dXNNbndMRU1yZy1zRHpfX3haRTA6MTpjaQ&redirect_uri=https%3A%2F%2Fsociomint.top%2Fapi%2Fauth%2Ftwitter%2Fcallback&response_type=code&scope=tweet.read+users.read

### ⛓️ 区块链功能测试
- [ ] SM Token 合约交互
- [ ] SM Exchange 功能
- [ ] 钱包连接和交易

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查 package.json 依赖
   - 查看构建日志错误信息
   - 确认环境变量配置正确

2. **域名无法访问**
   - 检查 DNS 记录配置
   - 等待 DNS 传播（24-48小时）
   - 验证 SSL 证书状态

3. **API 错误**
   - 检查环境变量配置
   - 验证数据库连接
   - 查看 Vercel 函数日志

## 📞 支持资源

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 部署指南**: https://nextjs.org/docs/deployment
- **GitHub 仓库**: https://github.com/yudeyou1989/sociomint
- **项目状态检查**: 运行 `./scripts/deployment-status.sh`

## 🎯 部署完成检查清单

- [ ] Vercel 项目创建成功
- [ ] 环境变量配置完成
- [ ] 自定义域名添加
- [ ] DNS 记录更新
- [ ] 首次部署成功
- [ ] 网站可正常访问
- [ ] 社交登录功能正常
- [ ] 区块链功能正常
- [ ] 监控工具配置

完成以上步骤后，SocioMint 项目将成功部署到生产环境！🎉

## 📋 项目配置信息

### Vercel 项目详情
- **Project ID**: `prj_RqumjDOALyEZZx6aDFjmungZMl1C`
- **Team ID**: `team_KiW6xdXGylcFvjyC1wxH6WcF`
- **域名**: `sociomint.top`
- **DNS A 记录**: `76.76.19.61` ✅

### GitHub Secrets 状态
- `VERCEL_TOKEN`: ✅ 已配置
- `VERCEL_ORG_ID`: ✅ 已配置 (team_KiW6xdXGylcFvjyC1wxH6WcF)
- `VERCEL_PROJECT_ID`: ✅ 已配置 (prj_RqumjDOALyEZZx6aDFjmungZMl1C)

### DNS 验证状态
- **GoDaddy DNS**: ✅ 已更新为 76.76.19.61
- **全球 DNS 传播**: ✅ 已生效
- **Vercel 检测**: ⏳ 等待自动验证（通常需要几分钟）
