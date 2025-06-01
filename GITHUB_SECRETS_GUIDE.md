# GitHub Secrets 配置完整指南

## 🔐 概述

本指南详细说明了 SocioMint 项目在 GitHub Actions CI/CD 流程中需要配置的所有环境变量和 Secrets。

## 📋 必需的 GitHub Secrets

### 🔗 区块链相关

#### BSC 测试网配置
```
Name: BSC_TESTNET_PRIVATE_KEY
Value: 0x[您的测试网私钥]
Description: BSC 测试网部署私钥

Name: BSC_TESTNET_RPC_URL
Value: https://data-seed-prebsc-1-s1.binance.org:8545
Description: BSC 测试网 RPC 端点

Name: BSCSCAN_TESTNET_API_KEY
Value: [您的 BscScan 测试网 API Key]
Description: 用于合约验证
```

#### BSC 主网配置
```
Name: BSC_MAINNET_PRIVATE_KEY
Value: 0x[您的主网私钥]
Description: BSC 主网部署私钥（⚠️ 高度敏感）

Name: BSC_MAINNET_RPC_URL
Value: https://bsc-dataseed1.binance.org/
Description: BSC 主网 RPC 端点

Name: BSCSCAN_API_KEY
Value: [您的 BscScan API Key]
Description: 主网合约验证
```

### 🗄️ 数据库相关

#### Supabase 配置
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://kiyyhitozmezuppziomx.supabase.co
Description: Supabase 项目 URL

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
Description: Supabase 匿名密钥

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c
Description: Supabase 服务角色密钥（⚠️ 高度敏感）
```

### 🐦 社交平台 API

#### Twitter/X API
```
Name: TWITTER_CLIENT_ID
Value: [您的 Twitter Client ID]
Description: Twitter OAuth 2.0 客户端 ID

Name: TWITTER_CLIENT_SECRET
Value: [您的 Twitter Client Secret]
Description: Twitter OAuth 2.0 客户端密钥

Name: TWITTER_BEARER_TOKEN
Value: [您的 Twitter Bearer Token]
Description: Twitter API v2 Bearer Token

Name: TWITTER_API_KEY
Value: [您的 Twitter API Key]
Description: Twitter API v1.1 密钥

Name: TWITTER_API_SECRET
Value: [您的 Twitter API Secret]
Description: Twitter API v1.1 密钥
```

#### Discord API
```
Name: DISCORD_CLIENT_ID
Value: [您的 Discord Application ID]
Description: Discord OAuth 2.0 客户端 ID

Name: DISCORD_CLIENT_SECRET
Value: [您的 Discord Client Secret]
Description: Discord OAuth 2.0 客户端密钥

Name: DISCORD_BOT_TOKEN
Value: [您的 Discord Bot Token]
Description: Discord Bot 令牌

Name: DISCORD_GUILD_ID
Value: [您的 Discord 服务器 ID]
Description: SocioMint 官方 Discord 服务器 ID

Name: DISCORD_WEBHOOK_URL
Value: [您的 Discord Webhook URL]
Description: 用于发送通知的 Webhook
```

#### Telegram API
```
Name: TELEGRAM_BOT_TOKEN
Value: [您的 Telegram Bot Token]
Description: Telegram Bot API 令牌

Name: TELEGRAM_CHANNEL_ID
Value: [您的 Telegram 频道 ID]
Description: SocioMint 官方 Telegram 频道 ID

Name: TELEGRAM_GROUP_ID
Value: [您的 Telegram 群组 ID]
Description: SocioMint 官方 Telegram 群组 ID
```

### 🚀 部署相关

#### Vercel 部署
```
Name: VERCEL_TOKEN
Value: [您的 Vercel Token]
Description: Vercel 部署令牌

Name: VERCEL_ORG_ID
Value: [您的 Vercel 组织 ID]
Description: Vercel 组织标识符

Name: VERCEL_PROJECT_ID
Value: [您的 Vercel 项目 ID]
Description: Vercel 项目标识符
```

### 📧 邮件服务

#### SendGrid
```
Name: SENDGRID_API_KEY
Value: [您的 SendGrid API Key]
Description: SendGrid 邮件服务 API 密钥

Name: SENDGRID_FROM_EMAIL
Value: noreply@sociomint.com
Description: 发件人邮箱地址
```

#### Resend (替代方案)
```
Name: RESEND_API_KEY
Value: [您的 Resend API Key]
Description: Resend 邮件服务 API 密钥
```

### 📊 监控和分析

#### Sentry
```
Name: SENTRY_DSN
Value: [您的 Sentry DSN]
Description: Sentry 错误监控 DSN

Name: SENTRY_AUTH_TOKEN
Value: [您的 Sentry Auth Token]
Description: Sentry 部署集成令牌
```

#### Google Analytics
```
Name: GOOGLE_ANALYTICS_ID
Value: [您的 GA4 测量 ID]
Description: Google Analytics 4 测量 ID
```

### 🔍 代码质量

#### Codecov
```
Name: CODECOV_TOKEN
Value: [您的 Codecov Token]
Description: 代码覆盖率报告令牌

Name: SONAR_TOKEN
Value: [您的 SonarCloud Token]
Description: SonarCloud 代码质量分析令牌
```

## 🛠️ GitHub Actions 工作流配置

创建增强的 GitHub Actions 工作流：

```yaml
# .github/workflows/ci-cd.yml
name: SocioMint CI/CD Pipeline

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:
    inputs:
      deploy_environment:
        description: 'Deployment environment'
        required: true
        default: 'testnet'
        type: choice
        options:
        - testnet
        - mainnet

env:
  NODE_VERSION: '20.x'
  CACHE_VERSION: v2

jobs:
  # 代码质量检查
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Lint check
        run: npm run lint
        
      - name: Type check
        run: npm run type-check
        
      - name: Format check
        run: npm run format:check

  # 安全审计
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Security audit
        run: npm audit --audit-level=high
        
      - name: Dependency check
        run: npx audit-ci --config audit-ci.json

  # 测试套件
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-group: [unit, integration, e2e]
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:${{ matrix.test-group }}
        
      - name: Upload coverage
        if: matrix.test-group == 'unit'
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # 智能合约测试
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Compile contracts
        run: npx hardhat compile
        
      - name: Test contracts
        run: npx hardhat test
        
      - name: Contract size check
        run: npx hardhat size-contracts

  # 构建验证
  build:
    runs-on: ubuntu-latest
    needs: [quality, security, test]
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/

  # 部署到测试网
  deploy-testnet:
    runs-on: ubuntu-latest
    needs: [build, contracts]
    if: github.ref == 'refs/heads/develop' || github.event.inputs.deploy_environment == 'testnet'
    environment: testnet
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy contracts to testnet
        env:
          BSC_TESTNET_PRIVATE_KEY: ${{ secrets.BSC_TESTNET_PRIVATE_KEY }}
          BSC_TESTNET_RPC_URL: ${{ secrets.BSC_TESTNET_RPC_URL }}
          BSCSCAN_TESTNET_API_KEY: ${{ secrets.BSCSCAN_TESTNET_API_KEY }}
        run: npm run deploy:airdrop-pool:testnet
        
      - name: Verify contracts
        env:
          BSCSCAN_TESTNET_API_KEY: ${{ secrets.BSCSCAN_TESTNET_API_KEY }}
        run: npx hardhat verify --network bscTestnet $CONTRACT_ADDRESS
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./

  # 部署到主网
  deploy-mainnet:
    runs-on: ubuntu-latest
    needs: [build, contracts]
    if: github.ref == 'refs/heads/main' || github.event.inputs.deploy_environment == 'mainnet'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy contracts to mainnet
        env:
          BSC_MAINNET_PRIVATE_KEY: ${{ secrets.BSC_MAINNET_PRIVATE_KEY }}
          BSC_MAINNET_RPC_URL: ${{ secrets.BSC_MAINNET_RPC_URL }}
          BSCSCAN_API_KEY: ${{ secrets.BSCSCAN_API_KEY }}
        run: npm run deploy:airdrop-pool:mainnet
        
      - name: Verify contracts
        env:
          BSCSCAN_API_KEY: ${{ secrets.BSCSCAN_API_KEY }}
        run: npx hardhat verify --network bsc $CONTRACT_ADDRESS
        
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

  # 通知
  notify:
    runs-on: ubuntu-latest
    needs: [deploy-testnet, deploy-mainnet]
    if: always()
    
    steps:
      - name: Discord notification
        uses: Ilshidur/action-discord@master
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
        with:
          args: |
            🚀 SocioMint deployment completed!
            Environment: ${{ github.event.inputs.deploy_environment || 'auto' }}
            Status: ${{ job.status }}
            Commit: ${{ github.sha }}
```

## 🔧 配置步骤

### 1. 访问 GitHub Secrets

1. 打开您的 GitHub 仓库
2. 点击 "Settings" 标签
3. 在左侧菜单中选择 "Secrets and variables" > "Actions"
4. 点击 "New repository secret"

### 2. 批量添加 Secrets

建议按以下顺序添加：

1. **基础配置** (Supabase, 区块链)
2. **社交平台 API**
3. **部署相关**
4. **监控和分析**
5. **可选服务**

### 3. 环境分离

为不同环境创建不同的 Secret 前缀：

- `TESTNET_*`: 测试网专用
- `MAINNET_*`: 主网专用
- `DEV_*`: 开发环境专用

## ⚠️ 安全注意事项

### 高度敏感的 Secrets
- `BSC_MAINNET_PRIVATE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWITTER_CLIENT_SECRET`
- `DISCORD_CLIENT_SECRET`

### 安全最佳实践

1. **最小权限原则**: 只给必要的权限
2. **定期轮换**: 定期更新 API 密钥
3. **监控使用**: 监控 API 密钥使用情况
4. **备份恢复**: 安全备份重要密钥
5. **访问审计**: 定期审计访问权限

## 📋 验证清单

- [ ] 所有必需的 Secrets 已添加
- [ ] Secret 名称拼写正确
- [ ] 测试网和主网 Secrets 分离
- [ ] 工作流文件语法正确
- [ ] 环境变量在代码中正确引用
- [ ] 敏感信息未硬编码在代码中
- [ ] API 密钥权限设置正确
- [ ] 备份了重要的密钥信息

## 🆘 故障排除

### 常见问题

1. **Secret 未找到**: 检查名称拼写和大小写
2. **权限不足**: 检查 API 密钥权限设置
3. **网络错误**: 检查 RPC URL 和网络连接
4. **合约验证失败**: 检查 API 密钥和合约地址

### 调试技巧

1. 使用 `echo` 命令检查环境变量（注意不要输出敏感信息）
2. 检查 GitHub Actions 日志
3. 验证 API 密钥在对应平台的有效性
4. 测试网络连接和 RPC 端点

---

**重要提醒**: 请妥善保管所有 API 密钥和私钥，不要在公开场所分享或提交到代码仓库中。
