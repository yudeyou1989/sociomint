# SocioMint 项目配置指南

## 🔧 需要您提供的配置信息

为了完成项目的自主开发和部署，我需要您提供以下配置信息：

### 1. 🌐 区块链配置

#### BSC主网合约地址（需要部署后提供）
```bash
# 主网SM代币合约地址
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0x...

# 主网SM代币交换合约地址  
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0x...

# 多签钱包地址
NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS=0x...
```

#### 钱包连接配置
```bash
# WalletConnect项目ID（从 https://cloud.walletconnect.com/ 获取）
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### 2. 🗄️ 数据库配置（Supabase）

```bash
# Supabase项目URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase匿名密钥（公开密钥）
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase服务角色密钥（私密密钥，仅服务端使用）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 🔗 社交平台API配置

#### Discord OAuth
```bash
# Discord应用客户端ID
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id

# Discord应用客户端密钥
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

#### Twitter/X OAuth
```bash
# Twitter OAuth 2.0客户端ID
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id

# Twitter OAuth 2.0客户端密钥
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

#### Telegram Bot
```bash
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token

# Telegram Bot用户名
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

### 4. ☁️ 部署配置（Cloudflare）

```bash
# Cloudflare账户ID
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Cloudflare API Token
CLOUDFLARE_API_TOKEN=your_api_token

# Cloudflare Pages项目名称
CLOUDFLARE_PROJECT_NAME=sociomint
```

### 5. 📊 监控和分析配置

#### Sentry错误监控
```bash
# Sentry DSN
SENTRY_DSN=your_sentry_dsn

# Sentry组织
SENTRY_ORG=your_org

# Sentry项目
SENTRY_PROJECT=your_project
```

#### Google Analytics（可选）
```bash
# Google Analytics测量ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 6. 📧 邮件服务配置（可选）

#### SendGrid
```bash
# SendGrid API密钥
SENDGRID_API_KEY=your_sendgrid_api_key

# 发件人邮箱
SENDGRID_FROM_EMAIL=noreply@sociomint.top
```

### 7. 🔐 安全配置

```bash
# JWT密钥（用于API认证）
JWT_SECRET=your_jwt_secret_key

# 加密密钥（用于敏感数据加密）
ENCRYPTION_KEY=your_encryption_key

# API速率限制密钥
RATE_LIMIT_SECRET=your_rate_limit_secret
```

## 📝 配置步骤

### 步骤1: 创建外部服务账户

1. **WalletConnect项目**
   - 访问 https://cloud.walletconnect.com/
   - 创建新项目
   - 获取项目ID

2. **Supabase数据库**
   - 访问 https://supabase.com/
   - 创建新项目
   - 获取URL和API密钥

3. **Discord应用**
   - 访问 https://discord.com/developers/applications
   - 创建新应用
   - 配置OAuth2重定向URL: `https://sociomint.top/api/auth/discord/callback`

4. **Twitter开发者账户**
   - 访问 https://developer.twitter.com/
   - 创建应用
   - 配置OAuth 2.0设置

5. **Telegram Bot**
   - 与 @BotFather 对话创建Bot
   - 获取Bot Token

6. **Cloudflare Pages**
   - 确保域名已添加到Cloudflare
   - 创建API Token（权限：Zone:Read, Page:Edit）

### 步骤2: 配置GitHub Secrets和Variables

#### GitHub Secrets（敏感信息）
在GitHub仓库设置中添加以下Secrets：
```
CLOUDFLARE_API_TOKEN
DISCORD_CLIENT_SECRET
TWITTER_CLIENT_SECRET
TELEGRAM_BOT_TOKEN
SUPABASE_SERVICE_ROLE_KEY
SENTRY_DSN
SENDGRID_API_KEY
JWT_SECRET
ENCRYPTION_KEY
```

#### GitHub Variables（公开信息）
在GitHub仓库设置中添加以下Variables：
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
NEXT_PUBLIC_SM_TOKEN_ADDRESS
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS
NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_DISCORD_CLIENT_ID
NEXT_PUBLIC_TWITTER_CLIENT_ID
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
CLOUDFLARE_ACCOUNT_ID
```

### 步骤3: 智能合约部署

1. **准备部署脚本**
   ```bash
   # 安装Hardhat依赖
   cd contracts
   npm install
   
   # 配置网络参数
   # 编辑 hardhat.config.js 添加BSC主网配置
   ```

2. **部署合约**
   ```bash
   # 部署SM代币合约
   npx hardhat run scripts/deploy-token.js --network bsc
   
   # 部署交换合约
   npx hardhat run scripts/deploy-exchange.js --network bsc
   
   # 验证合约
   npx hardhat verify --network bsc CONTRACT_ADDRESS
   ```

3. **配置多签钱包**
   - 使用Gnosis Safe创建多签钱包
   - 设置合约所有权转移到多签钱包

## 🚀 部署流程

### 自动部署（推荐）
1. 配置好所有环境变量
2. 推送代码到main分支
3. GitHub Actions自动构建和部署

### 手动部署
```bash
# 本地构建
npm run build

# 部署到Cloudflare Pages
npx wrangler pages publish out --project-name=sociomint
```

## ✅ 验证清单

部署完成后，请验证以下功能：

- [ ] 网站可正常访问 (https://sociomint.top)
- [ ] 钱包连接功能正常
- [ ] 代币交换功能正常
- [ ] 社交任务系统正常
- [ ] 空投池功能正常
- [ ] 监控系统正常运行

## 🆘 需要帮助？

如果您在配置过程中遇到问题，请提供：

1. **错误信息**：完整的错误日志
2. **配置状态**：已完成的配置项目
3. **环境信息**：使用的服务版本和配置

我将根据具体问题提供解决方案。

## 📞 下一步行动

请按以下优先级提供配置信息：

### 🔴 高优先级（必需）
1. Supabase数据库配置
2. WalletConnect项目ID
3. Cloudflare部署配置

### 🟡 中优先级（重要）
4. Discord OAuth配置
5. Twitter OAuth配置
6. 智能合约部署信息

### 🟢 低优先级（可选）
7. Telegram Bot配置
8. 监控服务配置
9. 邮件服务配置

提供这些信息后，我就可以完全自主地完成项目的开发和部署工作！
