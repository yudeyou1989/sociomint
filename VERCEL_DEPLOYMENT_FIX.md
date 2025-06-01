# 🔧 Vercel 部署问题解决方案

## 🚨 问题分析

您的域名 `sociomint.top` 显示 404 错误的原因：
1. ✅ DNS 配置正确 (A 记录: 76.76.21.21)
2. ❌ Vercel 项目尚未部署
3. ❌ 域名未正确连接到 Vercel 项目

## 🚀 解决步骤

### 步骤 1: 部署项目到 Vercel

#### 方法 A: 通过 GitHub 自动部署 (推荐)

1. **上传项目到 GitHub**
   ```bash
   # 按照 GITHUB_UPLOAD_GUIDE.md 的步骤上传项目
   ```

2. **连接 Vercel 到 GitHub**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 连接您的 GitHub 账户
   - 选择 `sociomint` 仓库

3. **配置部署设置**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **添加环境变量**
   在 Vercel 项目设置中添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
   NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-S1WC84RZQR
   SENTRY_DSN=https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568
   ```

#### 方法 B: 使用 Vercel CLI 直接部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 进入项目目录
cd /Users/yudeyou/Desktop/sm/sociomint

# 部署项目
vercel --prod

# 添加自定义域名
vercel domains add sociomint.top
```

### 步骤 2: 配置自定义域名

1. **在 Vercel Dashboard 中**
   - 进入您的项目
   - 点击 "Settings" → "Domains"
   - 添加 `sociomint.top`
   - 添加 `www.sociomint.top`

2. **验证域名配置**
   - 确保 DNS 记录正确
   - 等待 SSL 证书自动配置

### 步骤 3: 修复构建问题

如果部署失败，可能需要修复以下问题：

#### 3.1 更新 package.json 构建脚本

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint"
  }
}
```

#### 3.2 创建 vercel.json 配置文件

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "NEXT_PUBLIC_SM_TOKEN_ADDRESS": "@next_public_sm_token_address",
    "NEXT_PUBLIC_SM_EXCHANGE_ADDRESS": "@next_public_sm_exchange_address"
  }
}
```

#### 3.3 修复 Next.js 配置

确保 `next.config.js` 正确配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SM_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS,
    NEXT_PUBLIC_SM_EXCHANGE_ADDRESS: process.env.NEXT_PUBLIC_SM_EXCHANGE_ADDRESS,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

## 🔍 故障排除

### 问题 1: 构建失败

**症状**: Vercel 部署时构建失败
**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查错误日志
npm run lint

# 修复 TypeScript 错误
npm run type-check
```

### 问题 2: 环境变量未生效

**症状**: 应用运行但功能异常
**解决方案**:
1. 检查 Vercel 项目设置中的环境变量
2. 确保变量名称正确 (区分大小写)
3. 重新部署项目

### 问题 3: 域名仍显示 404

**症状**: DNS 配置正确但仍显示 404
**解决方案**:
1. 等待 DNS 传播 (最多 48 小时)
2. 清除浏览器缓存
3. 使用不同网络测试

## 📋 部署检查清单

### 部署前检查
- [ ] 项目已上传到 GitHub
- [ ] 所有依赖已安装
- [ ] 构建脚本正常工作
- [ ] 环境变量已准备

### 部署后检查
- [ ] Vercel 项目部署成功
- [ ] 自定义域名已添加
- [ ] SSL 证书已配置
- [ ] 网站可正常访问

### 功能验证
- [ ] 首页正常加载
- [ ] 钱包连接功能
- [ ] API 接口正常
- [ ] 静态资源加载

## 🚀 快速修复命令

```bash
# 1. 确保项目可以本地构建
npm install
npm run build

# 2. 部署到 Vercel
vercel --prod

# 3. 添加域名
vercel domains add sociomint.top

# 4. 检查部署状态
vercel ls

# 5. 查看部署日志
vercel logs
```

## 📞 需要帮助

如果问题仍然存在，请提供：
1. Vercel 部署日志
2. 浏览器控制台错误信息
3. DNS 检查结果

完成这些步骤后，您的 `sociomint.top` 应该能正常显示网站内容！
