# 📂 手动 GitHub 上传指南

## 🚀 方法一：使用自动化脚本 (推荐)

我已经为您创建了自动化上传脚本，只需运行一个命令：

```bash
# 进入项目目录
cd /Users/yudeyou/Desktop/sm/sociomint

# 运行自动上传脚本
npm run upload:github
```

脚本将自动完成：
- ✅ 创建 .gitignore 文件
- ✅ 初始化 Git 仓库
- ✅ 检查敏感文件
- ✅ 添加和提交所有文件
- ✅ 创建 GitHub 仓库 (如果安装了 GitHub CLI)
- ✅ 推送代码到 GitHub

## 🔧 方法二：手动上传步骤

如果自动脚本遇到问题，请按以下步骤手动操作：

### 1. 创建 GitHub 仓库

1. **访问 GitHub**
   - 打开 https://github.com
   - 登录您的账户

2. **创建新仓库**
   - 点击右上角的 "+" → "New repository"
   - 仓库名称: `sociomint`
   - 描述: `SocioMint - Web3 Social Task Platform`
   - 设置为 **Private** (推荐)
   - **不要**勾选 "Initialize this repository with a README"
   - 点击 "Create repository"

### 2. 本地 Git 配置

```bash
# 进入项目目录
cd /Users/yudeyou/Desktop/sm/sociomint

# 初始化 Git 仓库 (如果尚未初始化)
git init

# 设置默认分支为 main
git branch -M main

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: SocioMint Web3 Social Platform

🚀 Complete Web3 social task platform with:
- Next.js frontend with modern UI/UX
- Smart contracts with daily rewards system
- Supabase database integration
- Telegram bot functionality
- Social OAuth integration
- Comprehensive testing suite
- Production deployment configuration"
```

### 3. 连接远程仓库

```bash
# 添加远程仓库 (替换 YOUR_USERNAME 为您的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/sociomint.git

# 推送代码
git push -u origin main
```

### 4. 验证上传

访问您的 GitHub 仓库页面，确认：
- [ ] 所有文件都已上传
- [ ] 文件结构完整
- [ ] README.md 显示正常
- [ ] 没有敏感信息泄露

## 🔍 故障排除

### 问题 1: 推送被拒绝

**错误信息**: `Updates were rejected because the remote contains work that you do not have locally`

**解决方案**:
```bash
# 强制推送 (谨慎使用)
git push -u origin main --force
```

### 问题 2: 认证失败

**错误信息**: `Authentication failed`

**解决方案**:
1. 检查 GitHub 用户名和密码
2. 如果启用了 2FA，需要使用 Personal Access Token
3. 生成 Token: GitHub Settings → Developer settings → Personal access tokens

### 问题 3: 文件太大

**错误信息**: `File size exceeds GitHub's limit`

**解决方案**:
```bash
# 检查大文件
find . -size +100M -type f

# 移除大文件
git rm --cached large-file.zip
echo "large-file.zip" >> .gitignore
git add .gitignore
git commit -m "Remove large file"
```

## 📋 上传检查清单

### 上传前检查
- [ ] 项目在正确目录 (`/Users/yudeyou/Desktop/sm/sociomint`)
- [ ] 所有依赖已安装 (`npm install`)
- [ ] 项目可以正常构建 (`npm run build`)
- [ ] 敏感信息已排除 (私钥、API 密钥等)

### 上传后检查
- [ ] GitHub 仓库创建成功
- [ ] 所有文件都已上传
- [ ] 文件结构完整
- [ ] 仓库设置为私有
- [ ] README.md 显示正常

### 安全检查
- [ ] .env 文件未上传
- [ ] 私钥文件未上传
- [ ] node_modules 未上传
- [ ] .gitignore 文件存在

## 🎯 上传完成后的操作

1. **获取仓库 URL**
   ```
   https://github.com/YOUR_USERNAME/sociomint
   ```

2. **配置 GitHub Secrets**
   ```bash
   npm run setup:github-secrets
   ```

3. **连接 Vercel 部署**
   - 访问 https://vercel.com
   - 导入 GitHub 仓库
   - 配置自定义域名

4. **测试 CI/CD 流程**
   - 推送代码变更
   - 检查 GitHub Actions 运行状态

## 📞 需要帮助

如果遇到问题，请提供：
1. 错误信息截图
2. 执行的命令
3. 当前目录位置
4. Git 状态 (`git status`)

## 🎉 成功标志

上传成功后，您将看到：
- ✅ GitHub 仓库页面显示所有文件
- ✅ 提交历史记录正确
- ✅ 仓库设置为私有
- ✅ 文件结构完整

**仓库 URL 格式**: `https://github.com/YOUR_USERNAME/sociomint`

请将此 URL 提供给我，我将立即帮您配置 GitHub Secrets！
