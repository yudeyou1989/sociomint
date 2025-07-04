# SocioMint 问题解决指南

## 🚨 当前需要解决的关键问题

### 1. Cloudflare API权限问题 (高优先级)

**问题描述**: API Token权限不足，无法部署到Cloudflare Pages
**错误信息**: `Authentication error [code: 10000]`

**解决步骤**:
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 找到现有的API Token或创建新的
3. 确保Token包含以下权限:
   - `Zone:Read` (用于域名管理)
   - `Page:Edit` (用于Pages部署)
   - `Account:Read` (用于账户信息)
4. 更新环境变量中的Token
5. 重新尝试部署

**验证命令**:
```bash
export CLOUDFLARE_API_TOKEN=your_new_token
npx wrangler whoami
```

### 2. BSC主网连接问题 (高优先级)

**问题描述**: 连接BSC主网RPC时超时
**错误信息**: `ConnectTimeoutError: Connect Timeout Error`

**解决方案**:

**方案A: 更换RPC端点**
```javascript
// 在 hardhat.config.js 中尝试不同的RPC
const BSC_MAINNET_RPCS = [
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/", 
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
  "https://rpc.ankr.com/bsc",
  "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3"
];
```

**方案B: 网络诊断**
```bash
# 测试网络连接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://bsc-dataseed1.binance.org/

# 如果失败，尝试使用VPN或代理
```

**方案C: 使用第三方服务**
- 注册 [Alchemy](https://www.alchemy.com/) 或 [Infura](https://infura.io/)
- 获取BSC主网端点
- 更新配置文件

### 3. GitHub Secrets配置 (中优先级)

**问题描述**: 需要手动配置GitHub仓库的环境变量

**解决步骤**:

1. **访问GitHub仓库设置**
   ```
   https://github.com/yudeyou1989/sociomint/settings/secrets/actions
   ```

2. **添加Secrets** (点击 "New repository secret"):
   ```
   CLOUDFLARE_API_TOKEN=XpccrkCXCftioZiaheAr56SycITGqn5Yu7fDOsRS
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PRIVATE_KEY=c5fb271357b68d1af53d91871b60e7213ffe0180f81d4e67404396ec1f22caa7
   BSCSCAN_API_KEY=E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8
   DISCORD_PUBLIC_KEY=503e65872d278469c269776fb904c10885beb1dd180aca5338ca7a5664b2c9e0
   TWITTER_ACCESS_TOKEN=1517814177359753216-avZNfz2TQULAOoRnlh4SYIX9bWuhvi
   TWITTER_ACCESS_TOKEN_SECRET=cOIsVBdLgaHjJ63XsNhltGDkpvIFfKl9ZXJvlsX7PXCKo
   TELEGRAM_BOT_TOKEN=7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s
   ```

3. **添加Variables** (点击 "Variables" 标签):
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
   NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
   NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
   NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS=0x681E8E1921778A450930Bc1991c93981FD0B1F24
   NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_DISCORD_CLIENT_ID=1377572072602996797
   CLOUDFLARE_ACCOUNT_ID=ff431aed46e94b0593b8b1ee48842c7a
   ```

## 🔧 其他常见问题

### 构建文件过大问题

**问题**: Cloudflare Pages文件大小限制25MB
**解决方案**: 
```bash
# 清理缓存文件
rm -rf .next/cache cache
find .next -name "*.pack" -delete

# 重新构建
npm run build
```

### TypeScript类型错误

**问题**: 构建时出现类型错误
**临时解决方案**: 
```typescript
// 在 next.config.ts 中
typescript: {
  ignoreBuildErrors: true, // 临时跳过类型检查
}
```

**长期解决方案**: 逐步修复类型定义

### 依赖安装问题

**问题**: npm安装依赖失败
**解决方案**:
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 📋 问题解决优先级

### 🔴 立即解决 (阻塞部署)
1. Cloudflare API权限问题
2. BSC主网连接问题
3. GitHub Secrets配置

### 🟡 短期解决 (1-3天)
4. 完成生产环境部署
5. 全面功能测试
6. 修复发现的bug

### 🟢 长期优化 (1-2周)
7. TypeScript类型完善
8. 测试覆盖率提升
9. 性能优化
10. 文档完善

## 🆘 紧急联系方式

如果遇到无法解决的问题:

1. **技术支持**: 
   - Cloudflare Support: https://support.cloudflare.com/
   - BSC官方文档: https://docs.bnbchain.org/

2. **社区支持**:
   - Next.js Discord: https://nextjs.org/discord
   - Hardhat Discord: https://hardhat.org/discord

3. **备用方案**:
   - 使用Vercel部署 (如果Cloudflare问题无法解决)
   - 使用测试网合约 (如果主网部署失败)

## ✅ 验证清单

部署完成后，请验证以下功能:

- [ ] 网站可以正常访问 (https://sociomint.top)
- [ ] 钱包连接功能正常
- [ ] 代币交换功能正常
- [ ] 社交任务系统正常
- [ ] 空投池功能正常
- [ ] 用户认证正常
- [ ] 移动端适配正常
- [ ] 多语言切换正常

完成验证后，项目即可正式上线！
