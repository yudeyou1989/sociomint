# 🐦 Twitter OAuth 2.0 配置指南

## 📋 问题说明

您当前提供的是 Twitter API v1.1 的 Access Token，但项目需要的是 OAuth 2.0 的 Client ID 和 Client Secret。

## 🔧 重新配置步骤

### 1. 访问 Twitter Developer Portal

1. 打开 https://developer.twitter.com/en/portal/dashboard
2. 使用您的 Twitter 账户登录

### 2. 创建新的 OAuth 2.0 应用

1. **点击 "Create App"** 或选择现有应用
2. **填写应用信息**:
   ```
   App Name: SocioMint
   Description: Web3 社交任务平台
   Website URL: https://sociomint.top
   ```

### 3. 配置 OAuth 2.0 设置

1. **进入应用设置** → **User authentication settings**
2. **点击 "Set up"** 配置用户认证
3. **选择权限**:
   - ✅ Read
   - ✅ Write (如果需要发推功能)
4. **应用类型**: Web App
5. **回调 URL**:
   ```
   https://sociomint.top/auth/twitter/callback
   https://www.sociomint.top/auth/twitter/callback
   http://localhost:3000/auth/twitter/callback (开发环境)
   ```
6. **网站 URL**: `https://sociomint.top`

### 4. 获取 OAuth 2.0 凭据

配置完成后，您将获得：
- **Client ID**: 类似 `VGhpc0lzQW5FeGFtcGxl`
- **Client Secret**: 类似 `VGhpc0lzQW5FeGFtcGxlU2VjcmV0`

### 5. 测试配置

```bash
# 测试 OAuth 流程
curl -X POST "https://api.twitter.com/2/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

## 📝 配置清单

- [ ] 创建 OAuth 2.0 应用
- [ ] 配置回调 URL
- [ ] 获取 Client ID
- [ ] 获取 Client Secret
- [ ] 测试 OAuth 流程

## ⚠️ 重要提醒

1. **不要混淆 API 类型**:
   - ❌ API v1.1 Access Token (您当前的)
   - ✅ OAuth 2.0 Client Credentials (项目需要的)

2. **回调 URL 必须匹配**:
   - 开发环境: `http://localhost:3000/auth/twitter/callback`
   - 生产环境: `https://sociomint.top/auth/twitter/callback`

3. **权限设置**:
   - 根据功能需求选择适当的权限
   - 最小权限原则

完成配置后，请提供 Client ID 和 Client Secret 用于 GitHub Secrets 配置。
