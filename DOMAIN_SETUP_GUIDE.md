# 🌐 SocioMint 域名配置指南 (sociomint.top)

## 📋 概述

本指南将帮助您配置 `sociomint.top` 域名，包括 DNS 设置、SSL 证书、CDN 配置等。

## 🚀 部署平台选择

### 推荐方案：Vercel + 自定义域名

#### 优势
- ✅ 自动 SSL 证书
- ✅ 全球 CDN 加速
- ✅ 自动部署
- ✅ 免费额度充足

#### 配置步骤

1. **在 Vercel 中添加域名**
   ```bash
   # 登录 Vercel
   vercel login
   
   # 添加域名
   vercel domains add sociomint.top
   ```

2. **在 GoDaddy 中配置 DNS**
   
   登录 GoDaddy 控制面板，添加以下 DNS 记录：
   
   | 类型 | 名称 | 值 | TTL |
   |------|------|-----|-----|
   | A | @ | 76.76.21.21 | 600 |
   | CNAME | www | cname.vercel-dns.com | 600 |
   | CNAME | api | cname.vercel-dns.com | 600 |

3. **验证域名配置**
   ```bash
   # 检查 DNS 传播
   nslookup sociomint.top
   
   # 检查 HTTPS
   curl -I https://sociomint.top
   ```

## 🔧 环境变量更新

### 更新域名相关配置

```env
# 生产环境域名
NEXT_PUBLIC_APP_URL=https://sociomint.top
NEXT_PUBLIC_BASE_URL=https://sociomint.top

# API 端点
NEXT_PUBLIC_API_URL=https://sociomint.top/api

# OAuth 回调 URL 更新
NEXT_PUBLIC_TWITTER_REDIRECT_URI=https://sociomint.top/auth/twitter/callback
NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://sociomint.top/auth/discord/callback

# Telegram Bot Webhook
TELEGRAM_WEBHOOK_URL=https://sociomint.top/api/telegram/webhook
```

## 📱 社交平台 OAuth 更新

### Twitter OAuth 配置

1. **访问 Twitter Developer Portal**
   - 地址: https://developer.twitter.com/en/portal/dashboard

2. **更新回调 URL**
   ```
   https://sociomint.top/auth/twitter/callback
   https://www.sociomint.top/auth/twitter/callback
   ```

3. **更新网站 URL**
   ```
   https://sociomint.top
   ```

### Discord OAuth 配置

1. **访问 Discord Developer Portal**
   - 地址: https://discord.com/developers/applications

2. **更新重定向 URI**
   ```
   https://sociomint.top/auth/discord/callback
   https://www.sociomint.top/auth/discord/callback
   ```

## 🔒 SSL 证书配置

### Vercel 自动 SSL

Vercel 会自动为您的域名配置 SSL 证书：

1. **验证 SSL 状态**
   - 在 Vercel Dashboard 中检查域名状态
   - 确保显示 "Valid Configuration"

2. **强制 HTTPS 重定向**
   ```javascript
   // next.config.js
   module.exports = {
     async redirects() {
       return [
         {
           source: '/:path*',
           has: [
             {
               type: 'header',
               key: 'x-forwarded-proto',
               value: 'http',
             },
           ],
           destination: 'https://sociomint.top/:path*',
           permanent: true,
         },
       ]
     },
   }
   ```

## 📊 监控和分析配置

### Google Analytics 更新

1. **更新 GA4 属性设置**
   - 网站 URL: `https://sociomint.top`
   - 数据流设置: 添加新域名

2. **验证跟踪代码**
   ```javascript
   // 确保 GA 代码正确加载
   gtag('config', 'G-S1WC84RZQR', {
     page_title: 'SocioMint',
     page_location: 'https://sociomint.top'
   });
   ```

### Sentry 配置更新

```javascript
// sentry.config.js
Sentry.init({
  dsn: "https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568",
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // 过滤本地开发环境
    if (event.request?.url?.includes('localhost')) {
      return null;
    }
    return event;
  }
});
```

## 🚀 部署流程

### 1. 更新环境变量

```bash
# 创建生产环境配置
cp .env.example .env.production

# 编辑生产环境变量
nano .env.production
```

### 2. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod

# 添加自定义域名
vercel domains add sociomint.top
```

### 3. 验证部署

```bash
# 检查网站可访问性
curl -I https://sociomint.top

# 检查 API 端点
curl https://sociomint.top/api/health

# 检查重定向
curl -I http://sociomint.top
```

## 📋 部署检查清单

### 域名配置
- [ ] DNS 记录配置正确
- [ ] SSL 证书自动配置
- [ ] www 重定向设置
- [ ] API 子域名配置

### 应用配置
- [ ] 环境变量更新
- [ ] OAuth 回调 URL 更新
- [ ] API 端点配置
- [ ] 监控服务配置

### 功能验证
- [ ] 网站正常访问
- [ ] 钱包连接功能
- [ ] 社交登录功能
- [ ] API 接口正常
- [ ] Telegram Bot 功能

## 🔧 故障排除

### 常见问题

#### 1. DNS 传播延迟
**症状**: 域名无法访问
**解决方案**: 
- 等待 DNS 传播（通常 24-48 小时）
- 使用 DNS 检查工具验证配置

#### 2. SSL 证书问题
**症状**: HTTPS 访问失败
**解决方案**:
- 检查 Vercel 域名配置状态
- 确认 DNS 记录正确
- 等待证书自动配置完成

#### 3. OAuth 回调失败
**症状**: 社交登录失败
**解决方案**:
- 更新 OAuth 应用的回调 URL
- 检查域名配置是否正确
- 验证 HTTPS 证书有效

## 📈 性能优化

### CDN 配置

Vercel 自动提供全球 CDN，但您可以进一步优化：

1. **静态资源优化**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['sociomint.top'],
       formats: ['image/webp', 'image/avif'],
     },
     compress: true,
   }
   ```

2. **缓存策略**
   ```javascript
   // 设置缓存头
   export async function middleware(request) {
     const response = NextResponse.next();
     
     if (request.nextUrl.pathname.startsWith('/api/')) {
       response.headers.set('Cache-Control', 'no-cache');
     } else {
       response.headers.set('Cache-Control', 'public, max-age=3600');
     }
     
     return response;
   }
   ```

## 🎯 下一步计划

1. **完成域名配置**: 按照上述步骤配置 DNS
2. **更新 OAuth 设置**: 修改社交平台回调 URL
3. **部署到生产环境**: 使用新域名部署应用
4. **监控和测试**: 确保所有功能正常工作
5. **SEO 优化**: 配置搜索引擎优化设置

---

**重要提醒**: 
- 🌐 DNS 传播可能需要 24-48 小时
- 🔒 确保所有 OAuth 应用都更新了回调 URL
- 📊 更新所有监控和分析服务的域名配置
- 🔄 定期检查 SSL 证书状态

配置完成后，您的 SocioMint 平台将在 `https://sociomint.top` 正式上线！
