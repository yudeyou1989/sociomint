# 📋 Cloudflare Pages 手动部署指南

## 🎯 目标
将 SocioMint 项目部署到 Cloudflare Pages (sociomint008)

## 📂 部署文件位置
```
/Users/yudeyou/Desktop/sm/sociomint/out/
```

## 🚀 部署方法

### 方法 1: Wrangler CLI 部署（推荐）

1. **打开终端，进入项目目录**：
```bash
cd /Users/yudeyou/Desktop/sm/sociomint
```

2. **安装 Wrangler（如果未安装）**：
```bash
npm install -g wrangler
```

3. **登录 Cloudflare**：
```bash
wrangler login
```
- 会打开浏览器进行授权
- 使用你的 Cloudflare 账号登录

4. **执行部署**：
```bash
wrangler pages deploy out --project-name=sociomint008
```

5. **或者使用我们的部署脚本**：
```bash
chmod +x deploy-to-cloudflare.sh
./deploy-to-cloudflare.sh
```

### 方法 2: 通过 Cloudflare Dashboard

如果 CLI 方法不可用，可以尝试：

1. **访问 Cloudflare Pages Dashboard**
2. **找到 sociomint008 项目**
3. **寻找以下选项之一**：
   - "Create deployment" 按钮
   - "Upload files" 选项
   - "Direct upload" 功能
   - 在 "All deployments" 部分的上传选项

4. **上传整个 out 目录**：
   - 选择 `/Users/yudeyou/Desktop/sm/sociomint/out` 目录
   - 或者压缩 out 目录内容后上传

### 方法 3: 创建新的 Pages 项目

如果现有项目无法上传，可以：

1. **在 Cloudflare Dashboard 中**：
   - 进入 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages"
   - 选择 "Upload assets"

2. **上传 out 目录内容**

## 🔧 部署后配置

### 1. 自定义域名设置
- 项目设置 → Custom domains
- 添加 `sociomint.top`

### 2. 环境变量配置
确保以下环境变量已设置：
```
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[你的密钥]
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=[你的项目ID]
CLOUDFLARE_API_TOKEN=[你的API令牌]
```

## 🌐 访问地址

- **临时地址**: https://sociomint008.pages.dev
- **自定义域名**: https://sociomint.top

## ❓ 故障排除

### 如果找不到上传选项：
1. 尝试刷新页面
2. 检查是否有权限问题
3. 尝试使用 Wrangler CLI 方法

### 如果部署失败：
1. 检查 out 目录是否包含 index.html
2. 确认文件权限正确
3. 查看 Cloudflare 错误日志

## 📞 需要帮助？
如果遇到问题，请提供：
1. 错误信息截图
2. 当前看到的界面截图
3. 尝试的具体步骤
