# 🚨 紧急用户行动指南

## ⚠️ 严重安全警告

**你的项目存在严重安全漏洞，必须立即采取行动！**

---

## 🔴 第一优先级：立即安全修复（今天必须完成）

### 1. 更换钱包私钥（15分钟内完成）

**当前风险**：你的私钥 `c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7` 已经暴露在代码库中

**立即行动**：
1. 打开MetaMask或你使用的钱包
2. 创建新钱包账户
3. **立即转移所有资金**到新钱包
4. 记录新的私钥（安全保存，不要写在任何代码文件中）

### 2. 重新生成所有API密钥（30分钟）

#### 2.1 Cloudflare API Token
**当前泄露的Token**：`XpccrkCXCftioZiaheAr56SycITGqn5Yu7fDOsRS`

**操作步骤**：
1. 登录 https://dash.cloudflare.com/
2. 进入 "My Profile" → "API Tokens"
3. 找到现有的token并删除
4. 点击 "Create Token"
5. 选择 "Custom token"
6. 设置权限：
   - Zone:Zone:Edit
   - Zone:DNS:Edit
   - Account:Cloudflare Pages:Edit
7. 复制新的token并安全保存

#### 2.2 BSCScan API Key
**当前泄露的Key**：`E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8`

**操作步骤**：
1. 登录 https://bscscan.com/
2. 进入 "API-KEYs" 页面
3. 删除现有的API Key
4. 创建新的API Key
5. 复制并安全保存

#### 2.3 Twitter API 密钥
**当前泄露的Token**：`1517814177359753216-avZNfz2TQULAOoRnlh4SYIX9bWuhvi`

**操作步骤**：
1. 登录 https://developer.twitter.com/
2. 进入你的应用设置
3. 在 "Keys and tokens" 页面
4. 点击 "Regenerate" 重新生成所有密钥
5. 复制新的密钥并安全保存

#### 2.4 Telegram Bot Token
**当前泄露的Token**：`7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s`

**操作步骤**：
1. 在Telegram中找到 @BotFather
2. 发送 `/revoke` 命令
3. 选择你的机器人
4. 发送 `/newbot` 创建新机器人（或使用 `/token` 重新生成token）
5. 复制新的token并安全保存

### 3. 创建安全的环境变量文件（10分钟）

**操作步骤**：
1. 在项目根目录创建 `.env.local` 文件
2. 添加以下内容（使用你的新密钥）：

```bash
# 区块链配置
PRIVATE_KEY=你的新私钥
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSCSCAN_API_KEY=你的新BSCScan密钥

# Cloudflare配置
CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a
CLOUDFLARE_API_TOKEN=你的新Cloudflare密钥

# 社交平台配置
TWITTER_ACCESS_TOKEN=你的新Twitter密钥
TWITTER_ACCESS_TOKEN_SECRET=你的新Twitter密钥
TELEGRAM_BOT_TOKEN=你的新Telegram密钥

# 其他配置（保持不变）
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
```

3. **重要**：确保 `.env.local` 文件不会被提交到Git

---

## 🟡 第二优先级：重新部署智能合约（1小时）

### 4. 使用新私钥重新部署合约

**操作步骤**：
1. 确保新钱包有足够的BNB（至少0.1 BNB用于gas费）
2. 在终端中运行：
```bash
cd /Users/yudeyou/Desktop/sm/sociomint
npm run deploy:contracts
```
3. 记录新的合约地址
4. 更新 `.env.local` 中的合约地址

---

## 🟠 第三优先级：测试网站功能（30分钟）

### 5. 本地测试

**操作步骤**：
1. 启动本地开发服务器：
```bash
npm run dev
```
2. 在浏览器中打开 http://localhost:3000
3. 测试以下功能并记录问题：
   - [ ] 页面加载速度
   - [ ] 钱包连接功能
   - [ ] 代币交换功能
   - [ ] 社交任务系统
   - [ ] 移动端显示
   - [ ] 错误处理

### 6. 记录发现的问题

**创建问题列表**：
在一个文档中记录你发现的所有问题，格式如下：
```
问题1：页面加载慢
- 具体表现：首页加载超过5秒
- 重现步骤：打开首页
- 影响程度：高

问题2：钱包连接失败
- 具体表现：点击连接钱包没有反应
- 重现步骤：点击"连接钱包"按钮
- 影响程度：严重
```

---

## 🔵 第四优先级：更新Cloudflare配置（20分钟）

### 7. 更新Cloudflare Pages环境变量

**操作步骤**：
1. 登录 https://dash.cloudflare.com/
2. 进入 Pages 项目 "sociomint"
3. 点击 "Settings" → "Environment variables"
4. 更新以下变量为新的值：
   - `CLOUDFLARE_API_TOKEN`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `BSCSCAN_API_KEY`
5. 如果重新部署了合约，还需要更新：
   - `NEXT_PUBLIC_SM_TOKEN_ADDRESS`
   - `NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS`

---

## ✅ 完成检查清单

完成以上步骤后，请确认：

- [ ] 新钱包已创建，资金已转移
- [ ] 所有API密钥已重新生成
- [ ] `.env.local` 文件已创建并包含新密钥
- [ ] 智能合约已重新部署（如果需要）
- [ ] 网站功能已测试，问题已记录
- [ ] Cloudflare环境变量已更新

---

## 🆘 如果遇到问题

如果在执行过程中遇到任何问题，请提供：
1. 具体的错误信息
2. 你执行的步骤
3. 错误发生的时间点

**记住：在完成所有安全修复之前，不要部署到生产环境！**
