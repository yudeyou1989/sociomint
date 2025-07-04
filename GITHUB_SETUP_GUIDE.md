# GitHub Secrets 和 Variables 设置指南

## 🔐 需要设置的 GitHub Secrets（敏感信息）

请在 GitHub 仓库设置中添加以下 Secrets：
**路径**: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 必需的 Secrets：
```
CLOUDFLARE_API_TOKEN=XpccrkCXCftioZiaheAr56SycITGqn5Yu7fDOsRS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c
PRIVATE_KEY=c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7
BSCSCAN_API_KEY=E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8
DISCORD_PUBLIC_KEY=503e65872d278469c269776fb904c10885beb1dd180aca5338ca7a5664b2c9e0
TWITTER_ACCESS_TOKEN=1517814177359753216-avZNfz2TQULAOoRnlh4SYIX9bWuhvi
TWITTER_ACCESS_TOKEN_SECRET=cOIsVBdLgaHjJ63XsNhltGDkpvIFfKl9ZXJvlsX7PXCKo
TELEGRAM_BOT_TOKEN=7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s
```

## 🌐 需要设置的 GitHub Variables（公开信息）

请在 GitHub 仓库设置中添加以下 Variables：
**路径**: `Settings` → `Secrets and variables` → `Actions` → `Variables` → `New repository variable`

### 必需的 Variables：
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS=0x681E8E1921778A450930Bc1991c93981FD0B1F24
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
NEXT_PUBLIC_DISCORD_CLIENT_ID=1377572072602996797
CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

## 📋 设置步骤

### 1. 设置 Secrets
1. 访问 https://github.com/yudeyou1989/sociomint/settings/secrets/actions
2. 点击 "New repository secret"
3. 逐一添加上述每个 Secret：
   - Name: 输入变量名（如 `CLOUDFLARE_API_TOKEN`）
   - Secret: 输入对应的值
   - 点击 "Add secret"

### 2. 设置 Variables
1. 访问 https://github.com/yudeyou1989/sociomint/settings/variables/actions
2. 点击 "New repository variable"
3. 逐一添加上述每个 Variable：
   - Name: 输入变量名（如 `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`）
   - Value: 输入对应的值
   - 点击 "Add variable"

## ✅ 验证设置

设置完成后，您应该看到：
- **Secrets**: 8个已设置
- **Variables**: 10个已设置

## 🚀 下一步

设置完成后，请告诉我，我将继续：
1. 更新项目环境配置
2. 配置 Cloudflare Pages 部署
3. 部署测试网版本
4. 部署主网智能合约
5. 更新主网配置并重新部署

## ⚠️ 重要提醒

- 请确保所有 Secret 值都正确复制，不要有多余的空格
- Variables 中的值会在构建日志中可见，所以只放公开信息
- 如果设置错误，可以随时编辑或删除重新添加
