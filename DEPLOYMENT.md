# SocioMint 部署指南

## 📋 部署前检查清单

### 1. 环境变量配置

确保以下环境变量已正确配置：

#### 必需的环境变量
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed.binance.org/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

#### 可选的环境变量
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
DISCORD_CLIENT_SECRET=your-discord-secret
TWITTER_CLIENT_SECRET=your-twitter-secret
TELEGRAM_BOT_TOKEN=your-telegram-token
```

### 2. 生产就绪检查

运行生产就绪检查脚本：
```bash
npm run production:check
```

### 3. 构建测试

确保项目可以成功构建：
```bash
npm run build
```

## 🚀 Cloudflare Pages 部署

### 1. 准备工作

1. 确保代码已推送到 GitHub 仓库
2. 登录 Cloudflare Dashboard
3. 进入 Pages 部分

### 2. 创建项目

1. 点击 "Create a project"
2. 选择 "Connect to Git"
3. 选择你的 GitHub 仓库
4. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`

### 3. 环境变量配置

在 Cloudflare Pages 项目设置中添加环境变量：

1. 进入项目设置
2. 选择 "Environment variables"
3. 添加所有必需的环境变量

### 4. 自定义域名配置

1. 在项目设置中选择 "Custom domains"
2. 添加你的域名 `sociomint.top`
3. 按照指示配置 DNS 记录

### 5. SSL/TLS 配置

1. 确保 SSL/TLS 模式设置为 "Full (strict)"
2. 启用 "Always Use HTTPS"
3. 配置 HSTS 设置

## 🔧 高级配置

### 1. 缓存配置

在 Cloudflare 中配置页面规则：
```
sociomint.top/api/*
- Cache Level: Bypass
- Security Level: High

sociomint.top/_next/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
```

### 2. 安全配置

启用以下 Cloudflare 安全功能：
- WAF (Web Application Firewall)
- DDoS Protection
- Bot Fight Mode
- Rate Limiting

### 3. 性能优化

启用以下性能优化：
- Auto Minify (HTML, CSS, JS)
- Brotli Compression
- HTTP/2
- HTTP/3

## 📊 监控和日志

### 1. 错误监控

配置 Sentry 进行错误监控：
```bash
npm install @sentry/nextjs
```

### 2. 性能监控

使用 Cloudflare Analytics 监控：
- 页面加载时间
- 用户访问量
- 错误率

### 3. 日志记录

配置日志记录：
- 应用程序日志
- 安全事件日志
- 性能指标日志

## 🔄 CI/CD 配置

### 1. GitHub Actions

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

### 2. 自动部署

配置 Cloudflare Pages 自动部署：
- 连接到 GitHub 仓库
- 设置自动部署分支
- 配置构建钩子

## 🛠️ 故障排除

### 常见问题

1. **构建失败**
   - 检查环境变量配置
   - 验证依赖项版本
   - 查看构建日志

2. **运行时错误**
   - 检查 Sentry 错误报告
   - 验证 API 端点
   - 检查网络连接

3. **性能问题**
   - 分析 Bundle 大小
   - 检查图片优化
   - 验证缓存配置

### 调试工具

- Cloudflare Analytics
- Sentry Error Tracking
- Browser DevTools
- Lighthouse Performance Audit

## 📞 支持

如果遇到部署问题，请：
1. 检查本文档的故障排除部分
2. 查看项目 Issues
3. 联系开发团队

## 🔐 安全注意事项

1. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Cloudflare 环境变量管理
   - 定期轮换 API 密钥

2. **域名安全**
   - 启用 DNSSEC
   - 配置 CAA 记录
   - 使用强密码

3. **应用安全**
   - 定期更新依赖项
   - 运行安全审计
   - 监控安全事件

## 📈 性能优化

1. **代码优化**
   - 使用代码分割
   - 实现懒加载
   - 优化图片资源

2. **缓存策略**
   - 配置适当的缓存头
   - 使用 CDN 缓存
   - 实现服务端缓存

3. **监控指标**
   - Core Web Vitals
   - 页面加载时间
   - 用户交互延迟
