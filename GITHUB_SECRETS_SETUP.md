# 🔐 GitHub Secrets 配置指南

## 📋 概述

本指南将帮助您在 GitHub 仓库中正确配置所有必需的 Secrets，以确保 CI/CD 流程正常运行。

## 🚀 快速配置

### 1. 访问 GitHub Secrets 设置

1. 打开您的 GitHub 仓库
2. 点击 **Settings** 标签
3. 在左侧菜单中选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 添加新的 Secret

## 📝 必需的 Secrets 配置

### 🔗 区块链相关 Secrets

#### NEXT_PUBLIC_SM_TOKEN_ADDRESS
```
名称: NEXT_PUBLIC_SM_TOKEN_ADDRESS
值: 0xd7d7dd989642222B6f685aF0220dc0065F489ae0
描述: SM 代币合约地址（测试网）
```

#### NEXT_PUBLIC_SM_EXCHANGE_ADDRESS
```
名称: NEXT_PUBLIC_SM_EXCHANGE_ADDRESS
值: 0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
描述: SM 代币交换合约地址（测试网）
```

#### BSC_TESTNET_PRIVATE_KEY
```
名称: BSC_TESTNET_PRIVATE_KEY
值: [您需要提供] - 您的 BSC 测试网私钥（不包含 0x 前缀）
描述: 用于测试网合约部署和升级
获取方式: 从您的 MetaMask 或其他钱包导出私钥
安全提醒: 请使用专用的部署钱包，不要使用个人主钱包
```

#### BSCSCAN_API_KEY
```
名称: BSCSCAN_API_KEY
值: [您需要提供] - 您的 BSCScan API 密钥
描述: 用于合约验证和交易查询
获取方式: 
1. 访问 https://bscscan.com/apis
2. 注册账户并登录
3. 创建新的 API Key
4. 复制 API Key
```

### 🗄️ 数据库相关 Secrets

#### NEXT_PUBLIC_SUPABASE_URL
```
名称: NEXT_PUBLIC_SUPABASE_URL
值: https://kiyyhitozmezuppziomx.supabase.co
描述: Supabase 项目 URL（已配置）
```

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
名称: NEXT_PUBLIC_SUPABASE_ANON_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
描述: Supabase 匿名密钥（已配置）
```

#### SUPABASE_SERVICE_ROLE_KEY
```
名称: SUPABASE_SERVICE_ROLE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c
描述: Supabase 服务角色密钥（已配置）
```

### 🌐 社交平台集成 Secrets

#### NEXT_PUBLIC_TWITTER_CLIENT_ID
```
名称: NEXT_PUBLIC_TWITTER_CLIENT_ID
值: [您需要提供] - 您的 Twitter/X 客户端 ID
描述: 用于 Twitter OAuth 认证
获取方式:
1. 访问 https://developer.twitter.com/
2. 创建新的应用程序
3. 在 OAuth 2.0 设置中获取 Client ID
```

#### TWITTER_CLIENT_SECRET
```
名称: TWITTER_CLIENT_SECRET
值: [您需要提供] - 您的 Twitter/X 客户端密钥
描述: 用于 Twitter OAuth 认证
获取方式: 与 Client ID 一起在 Twitter Developer Portal 获取
```

#### NEXT_PUBLIC_DISCORD_CLIENT_ID
```
名称: NEXT_PUBLIC_DISCORD_CLIENT_ID
值: [您需要提供] - 您的 Discord 客户端 ID
描述: 用于 Discord OAuth 认证
获取方式:
1. 访问 https://discord.com/developers/applications
2. 创建新的应用程序
3. 在 OAuth2 设置中获取 Client ID
```

#### DISCORD_CLIENT_SECRET
```
名称: DISCORD_CLIENT_SECRET
值: [您需要提供] - 您的 Discord 客户端密钥
描述: 用于 Discord OAuth 认证
获取方式: 与 Client ID 一起在 Discord Developer Portal 获取
```

#### TELEGRAM_BOT_TOKEN
```
名称: TELEGRAM_BOT_TOKEN
值: [您需要提供] - 您的 Telegram Bot 令牌
描述: 用于 Telegram Bot 功能
获取方式:
1. 在 Telegram 中搜索 @BotFather
2. 发送 /newbot 命令
3. 按照指示创建新的 Bot
4. 获取 Bot Token
```

### 💼 钱包连接 Secrets

#### NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
```
名称: NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
值: [您需要提供] - 您的 WalletConnect 项目 ID
描述: 用于 WalletConnect 钱包连接
获取方式:
1. 访问 https://cloud.walletconnect.com/
2. 注册并登录
3. 创建新项目
4. 获取 Project ID
```

## 🔧 可选的 Secrets 配置

### 📊 代码质量和部署

#### SONAR_TOKEN
```
名称: SONAR_TOKEN
值: [可选] - 您的 SonarCloud 令牌
描述: 用于代码质量分析
获取方式:
1. 访问 https://sonarcloud.io/
2. 使用 GitHub 账户登录
3. 创建新项目
4. 获取 Token
```

#### VERCEL_TOKEN
```
名称: VERCEL_TOKEN
值: [可选] - 您的 Vercel 部署令牌
描述: 用于自动部署到 Vercel
获取方式:
1. 访问 https://vercel.com/account/tokens
2. 创建新的 Token
3. 复制 Token
```

#### VERCEL_ORG_ID
```
名称: VERCEL_ORG_ID
值: [可选] - 您的 Vercel 组织 ID
描述: 用于 Vercel 部署
获取方式: 在 Vercel 项目设置中查看
```

#### VERCEL_PROJECT_ID
```
名称: VERCEL_PROJECT_ID
值: [可选] - 您的 Vercel 项目 ID
描述: 用于 Vercel 部署
获取方式: 在 Vercel 项目设置中查看
```

### 📈 监控和分析

#### SENTRY_DSN
```
名称: SENTRY_DSN
值: [可选] - 您的 Sentry DSN
描述: 用于错误监控和性能追踪
获取方式:
1. 访问 https://sentry.io/
2. 创建新项目
3. 获取 DSN
```

#### NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
```
名称: NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
值: [可选] - 您的 Google Analytics Measurement ID
描述: 用于网站分析
获取方式:
1. 访问 https://analytics.google.com/
2. 创建 GA4 属性
3. 获取 Measurement ID (格式: G-XXXXXXXXXX)
```

## 🎯 配置优先级

### 🔴 高优先级（必须配置）
1. `BSC_TESTNET_PRIVATE_KEY` - 合约部署必需
2. `BSCSCAN_API_KEY` - 合约验证必需
3. `TELEGRAM_BOT_TOKEN` - Bot 功能必需
4. `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - 钱包连接必需

### 🟡 中优先级（推荐配置）
1. `NEXT_PUBLIC_TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET` - 社交功能
2. `NEXT_PUBLIC_DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET` - 社交功能
3. `SENTRY_DSN` - 错误监控

### 🟢 低优先级（可选配置）
1. `SONAR_TOKEN` - 代码质量分析
2. `VERCEL_*` - 自动部署
3. `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - 网站分析

## 📋 配置检查清单

### 配置前检查
- [ ] 已有 GitHub 仓库管理员权限
- [ ] 已准备好所有必需的 API 密钥
- [ ] 已创建专用的部署钱包

### 配置后验证
- [ ] 所有必需的 Secrets 已添加
- [ ] Secret 名称拼写正确
- [ ] Secret 值格式正确（无多余空格）
- [ ] 私钥不包含 0x 前缀

### 测试验证
- [ ] GitHub Actions 工作流运行成功
- [ ] 构建过程无错误
- [ ] 测试套件通过
- [ ] 部署预览正常

## 🔒 安全最佳实践

### 私钥安全
1. **专用钱包**: 使用专门的部署钱包，不要使用个人主钱包
2. **最小权限**: 部署钱包只保留必要的资金
3. **定期轮换**: 定期更换私钥和 API 密钥
4. **访问控制**: 限制仓库访问权限

### API 密钥安全
1. **最小权限**: 只授予必要的 API 权限
2. **定期检查**: 定期检查 API 密钥使用情况
3. **及时撤销**: 不再使用的密钥及时撤销
4. **监控使用**: 监控 API 密钥的使用情况

## 🆘 故障排除

### 常见问题

#### 1. GitHub Actions 失败
**症状**: CI/CD 流程失败，提示 Secret 未找到
**解决方案**: 
- 检查 Secret 名称是否正确
- 确认 Secret 值已正确设置
- 验证仓库权限设置

#### 2. 合约部署失败
**症状**: 合约部署或升级失败
**解决方案**:
- 检查私钥格式（不包含 0x）
- 确认钱包有足够的 BNB
- 验证网络配置正确

#### 3. API 调用失败
**症状**: 社交平台集成失败
**解决方案**:
- 检查 API 密钥有效性
- 确认 OAuth 配置正确
- 验证回调 URL 设置

### 获取帮助

如果遇到配置问题，请提供：
1. 错误信息截图
2. 已配置的 Secret 列表（不包含实际值）
3. GitHub Actions 日志
4. 具体的操作步骤

---

**重要提醒**: 
- 🔐 永远不要在代码中硬编码敏感信息
- 📝 定期审查和更新 Secrets
- 🔍 监控 Secrets 的使用情况
- 🚨 发现泄露立即更换相关密钥

配置完成后，您的 CI/CD 流程将自动运行，确保代码质量和部署流程的自动化！
