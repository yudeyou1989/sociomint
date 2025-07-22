# 🔐 生产环境密钥更换清单

## 必需更换的密钥

### 1. 区块链相关
- [ ] **BSC主网私钥** (PRIVATE_KEY)
  - 用途：部署主网合约、执行交易
  - 安全级别：🔴 极高
  - 注意：确保钱包有足够BNB支付gas费

### 2. 第三方服务API
- [ ] **Supabase密钥** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - 当前：测试环境密钥
  - 需要：生产环境密钥
  
- [ ] **WalletConnect项目ID** (NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID)
  - 当前：测试项目ID
  - 需要：生产项目ID

### 3. 社交平台API（可选但建议）
- [ ] **Twitter API密钥**
  - TWITTER_CLIENT_ID
  - TWITTER_CLIENT_SECRET
  
- [ ] **Discord API密钥**
  - DISCORD_CLIENT_ID  
  - DISCORD_CLIENT_SECRET
  
- [ ] **Telegram Bot Token**
  - TELEGRAM_BOT_TOKEN

### 4. 部署服务
- [ ] **Cloudflare API Token** (CLOUDFLARE_API_TOKEN)
  - 当前：可能是测试token
  - 需要：生产环境专用token

## 密钥配置位置

### 本地开发环境
```bash
# 文件位置：.env.local
PRIVATE_KEY=你的新私钥
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的新Supabase密钥
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的新WalletConnect项目ID
TWITTER_CLIENT_ID=你的Twitter客户端ID
TWITTER_CLIENT_SECRET=你的Twitter客户端密钥
DISCORD_CLIENT_ID=你的Discord客户端ID
DISCORD_CLIENT_SECRET=你的Discord客户端密钥
TELEGRAM_BOT_TOKEN=你的Telegram机器人token
CLOUDFLARE_API_TOKEN=你的Cloudflare API token
CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a
```

### Cloudflare Pages生产环境
在Cloudflare Pages的环境变量设置中配置：
- 不要包含PRIVATE_KEY（仅用于合约部署）
- 只配置NEXT_PUBLIC_开头的公开变量

## 安全注意事项

### 🚨 极重要
1. **私钥安全**：
   - 生成全新的私钥，不要使用测试私钥
   - 私钥只在本地使用，不要上传到任何云服务
   - 备份私钥到安全位置

2. **API密钥管理**：
   - 为生产环境创建专用的API密钥
   - 设置适当的权限和限制
   - 定期轮换密钥

3. **环境隔离**：
   - 测试环境和生产环境使用不同的密钥
   - 不要在代码中硬编码任何密钥
   - 使用.env文件管理密钥

## 更换步骤

### 第1步：生成新密钥
1. 创建新的BSC钱包地址
2. 申请新的API密钥
3. 创建新的项目ID

### 第2步：本地配置
1. 更新.env.local文件
2. 测试所有功能
3. 运行部署检查

### 第3步：部署配置
1. 在Cloudflare Pages配置环境变量
2. 部署项目
3. 验证功能正常

### 第4步：合约部署（如需要）
1. 使用新私钥部署主网合约
2. 更新合约地址配置
3. 重新部署前端

## 验证清单

部署后验证以下功能：
- [ ] 钱包连接正常
- [ ] 代币交换功能
- [ ] 社交登录（如果配置）
- [ ] 数据库连接
- [ ] 所有API调用正常

## 应急计划

如果部署后发现问题：
1. 立即回滚到上一个版本
2. 检查密钥配置
3. 在测试环境重新验证
4. 修复后重新部署
