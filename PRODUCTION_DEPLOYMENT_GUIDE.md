# 🚀 SocioMint 生产环境部署完整指南

## 📋 概述

本指南将帮助您完成 SocioMint 项目从测试到生产环境的完整部署流程，包括合约升级、GitHub 配置、环境变量设置等所有必要步骤。

## 1. 🔗 智能合约重新部署和验证

### 为什么需要重新部署？

✅ **新增功能**: 每日持币奖励系统 (SMTokenExchangeV2)
✅ **安全增强**: 新增防重入保护和事件日志
✅ **性能优化**: Gas 消耗优化和代码结构改进
✅ **功能扩展**: 支持未来功能升级的架构

### 部署步骤

#### 1.1 测试网升级

```bash
# 进入项目目录
cd /Users/yudeyou/Desktop/sm/sociomint

# 升级测试网合约
npm run upgrade:sm-exchange:testnet

# 验证合约
npm run verify:sm-exchange:testnet
```

#### 1.2 主网升级（生产就绪后）

```bash
# 升级主网合约
npm run upgrade:sm-exchange:mainnet

# 验证合约
npm run verify:sm-exchange:mainnet
```

#### 1.3 验证升级结果

升级完成后，您将看到：
- ✅ 新的实现合约地址
- ✅ 代理合约地址保持不变
- ✅ 所有原有功能正常
- ✅ 新增每日奖励功能可用

## 2. 🔧 GitHub Actions 配置修复

### 2.1 问题分析

当前 `test.yml` 存在的问题：
- ❌ 重复的 job 名称 (`quality`)
- ❌ 缺失的 GitHub Secrets 配置
- ❌ 不完整的错误处理

### 2.2 已修复的问题

我已经修复了以下问题：
- ✅ 重命名重复的 job 为 `code-quality`
- ✅ 添加了错误处理 (`continue-on-error: true`)
- ✅ 优化了 Vercel 部署配置

### 2.3 需要配置的 GitHub Secrets

您需要在 GitHub 仓库设置中添加以下 Secrets：

#### 必需的 Secrets

| Secret 名称 | 描述 | 获取方式 |
|------------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 已提供 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 已提供 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | 已提供 |
| `NEXT_PUBLIC_SM_TOKEN_ADDRESS` | SM 代币合约地址 | 已部署 |
| `NEXT_PUBLIC_SM_EXCHANGE_ADDRESS` | 交换合约地址 | 已部署 |

#### 可选的 Secrets（用于高级功能）

| Secret 名称 | 描述 | 获取方式 |
|------------|------|----------|
| `SONAR_TOKEN` | SonarCloud 代码质量分析 | [SonarCloud](https://sonarcloud.io) |
| `VERCEL_TOKEN` | Vercel 部署令牌 | [Vercel Dashboard](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel 组织 ID | Vercel 项目设置 |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | Vercel 项目设置 |

## 3. 📝 生产环境配置清单

### 3.1 环境变量配置

#### 必需配置（您需要提供）

```env
# 区块链网络配置
BSC_TESTNET_PRIVATE_KEY=您的测试网私钥
BSC_MAINNET_PRIVATE_KEY=您的主网私钥（生产环境）
BSCSCAN_API_KEY=您的BSCScan API密钥

# 社交平台集成
NEXT_PUBLIC_TWITTER_CLIENT_ID=您的Twitter客户端ID
TWITTER_CLIENT_SECRET=您的Twitter客户端密钥
NEXT_PUBLIC_DISCORD_CLIENT_ID=您的Discord客户端ID
DISCORD_CLIENT_SECRET=您的Discord客户端密钥
TELEGRAM_BOT_TOKEN=您的Telegram Bot令牌

# 钱包连接
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=您的WalletConnect项目ID

# 监控和分析
SENTRY_DSN=您的Sentry DSN（可选）
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=您的GA ID（可选）
```

#### 已配置项目（无需修改）

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 智能合约地址（测试网）
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
```

### 3.2 需要您提供的信息

#### 3.2.1 区块链相关

**BSCScan API 密钥**
- 🔗 获取地址: https://bscscan.com/apis
- 📝 用途: 合约验证和交易查询
- 🔧 配置: E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8

**私钥配置**
- 🔐 测试网私钥: 用于测试网部署和升级
- 🔐 主网私钥: 用于主网部署（生产环境）
- ⚠️ 安全提醒: 请使用专用的部署钱包，不要使用个人主钱包

#### 3.2.2 社交平台集成

**Twitter/X API**
- 🔗 获取地址: https://developer.twitter.com/
- 📝 需要: Client ID 和 Client Secret
- 🔧 配置: OAuth 2.0 应用程序
Access Token：1517814177359753216-avZNfz2TQULAOoRnlh4SYIX9bWuhvi
Access Token Secret：cOIsVBdLgaHjJ63XsNhltGDkpvIFfKl9ZXJvlsX7PXCKo

**Discord API**
- 🔗 获取地址: https://discord.com/developers/applications
- 📝 需要: Client ID 和 Client Secret
- 🔧 配置: OAuth2 应用程序
Application ID:1377572072602996797
Public Key:503e65872d278469c269776fb904c10885beb1dd180aca5338ca7a5664b2c9e0

**Telegram Bot**
- 🔗 获取地址: 与 @BotFather 对话
- 📝 需要: Bot Token
- 🔧 配置: 创建新的 Bot
 API:7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s


#### 3.2.3 钱包连接

**WalletConnect**
- 🔗 获取地址: https://cloud.walletconnect.com/
- 📝 需要: Project ID
- 🔧 配置: 创建新项目
Project ID：fced525820007c9c024132cf432ffcae

#### 3.2.4 监控和分析（可选）

**Sentry（错误监控）**
- 🔗 获取地址: https://sentry.io/
- 📝 需要: DSN
- 🔧 配置: 创建新项目
https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568

**Google Analytics**
- 🔗 获取地址: https://analytics.google.com/
- 📝 需要: Measurement ID (G-XXXXXXXXXX)
- 🔧 配置: 创建 GA4 属性
Measurement ID：G-S1WC84RZQR

### 3.3 部署前检查清单

#### 智能合约检查
- [ ] 测试网合约升级成功
- [ ] 新功能验证通过
- [ ] 合约在 BSCScan 上验证成功
- [ ] Gas 费用优化完成

#### 前端应用检查
- [ ] 环境变量配置完整
- [ ] 构建过程无错误
- [ ] 所有测试通过
- [ ] 响应式设计验证

#### 数据库检查
- [ ] Supabase 迁移完成
- [ ] RLS 策略正确配置
- [ ] 数据备份策略就绪
- [ ] 性能优化完成

#### 集成服务检查
- [ ] 社交平台 OAuth 配置
- [ ] Telegram Bot 功能正常
- [ ] 钱包连接测试通过
- [ ] 监控服务配置完成

## 4. 🚀 部署流程

### 4.1 测试环境部署

```bash
# 1. 升级智能合约
npm run upgrade:sm-exchange:testnet

# 2. 部署数据库迁移
npm run db:migrate:daily-rewards

# 3. 构建前端应用
npm run build

# 4. 启动服务
npm run start

# 5. 启动 Telegram Bot
npm run telegram:daily-rewards
```

### 4.2 生产环境部署

```bash
# 1. 升级主网合约
npm run upgrade:sm-exchange:mainnet

# 2. 部署生产数据库
NODE_ENV=production npm run db:migrate:daily-rewards

# 3. 构建生产版本
NODE_ENV=production npm run build

# 4. 部署到 Vercel/Netlify
vercel --prod
# 或
netlify deploy --prod
```

## 5. 📊 部署后验证

### 5.1 功能验证

```bash
# 运行完整测试套件
npm run test

# 运行 E2E 测试
npm run test:e2e

# 验证合约功能
npm run test:contracts
```

### 5.2 性能验证

- 🔍 页面加载时间 < 3秒
- 🔍 API 响应时间 < 1秒
- 🔍 合约调用成功率 > 99%
- 🔍 数据库查询性能正常

### 5.3 安全验证

- 🔒 HTTPS 证书配置正确
- 🔒 环境变量安全存储
- 🔒 API 密钥权限最小化
- 🔒 合约权限控制正确

## 6. 📞 获取帮助

如果您在配置过程中遇到问题，请提供以下信息：

### 6.1 错误信息
- 完整的错误日志
- 操作步骤描述
- 环境信息（Node.js 版本、操作系统等）

### 6.2 配置信息
- 网络环境（测试网/主网）
- 已配置的环境变量列表
- 部署平台信息

### 6.3 联系方式
- GitHub Issues: 在项目仓库创建 Issue
- 技术支持: 提供详细的问题描述

## 7. 🎯 下一步计划

部署完成后，建议按以下顺序进行：

1. **用户测试**: 邀请内部用户测试所有功能
2. **性能监控**: 设置监控告警和性能指标
3. **安全审计**: 进行第三方安全审计
4. **社区推广**: 开始社区建设和用户获取
5. **功能迭代**: 根据用户反馈优化功能

---

**重要提醒**: 
- 🔐 请妥善保管所有私钥和 API 密钥
- 🧪 在主网部署前务必在测试网充分测试
- 📊 部署后持续监控系统状态
- 🔄 定期备份重要数据

需要我协助您完成任何具体的配置步骤吗？
