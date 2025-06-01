# 📂 GitHub 仓库上传指南

## 🚀 快速上传步骤

### 1. 创建 GitHub 仓库

1. **访问 GitHub**
   - 打开 https://github.com
   - 登录您的账户

2. **创建新仓库**
   - 点击右上角的 "+" → "New repository"
   - 仓库名称: `sociomint`
   - 描述: `SocioMint - Web3 Social Task Platform`
   - 设置为 **Private** (推荐，因为包含敏感配置)
   - 不要初始化 README、.gitignore 或 license

### 2. 准备本地项目

```bash
# 进入项目目录
cd /Users/yudeyou/Desktop/sm/sociomint

# 初始化 Git 仓库 (如果尚未初始化)
git init

# 创建 .gitignore 文件 (如果不存在)
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
.next/
out/
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Hardhat files
cache/
artifacts/
typechain-types/

# Deployment artifacts
deployments/*/solcInputs/

# Temporary folders
tmp/
temp/
EOF
```

### 3. 上传到 GitHub

```bash
# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: SocioMint Web3 Social Platform

- Complete Next.js frontend application
- Smart contracts with daily rewards system
- Supabase database integration
- Telegram bot functionality
- Social platform OAuth integration
- Comprehensive testing suite
- Production deployment configuration"

# 添加远程仓库 (替换 YOUR_USERNAME 为您的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/sociomint.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 4. 验证上传

1. **检查仓库内容**
   - 访问您的 GitHub 仓库
   - 确认所有文件都已上传
   - 检查文件结构是否完整

2. **重要文件检查清单**
   - [ ] `package.json` - 项目配置
   - [ ] `src/` - 前端源代码
   - [ ] `contracts/` - 智能合约
   - [ ] `scripts/` - 部署和工具脚本
   - [ ] `supabase/` - 数据库迁移
   - [ ] `.github/workflows/` - CI/CD 配置
   - [ ] 各种配置文件 (next.config.js, tailwind.config.js 等)

### 5. 安全检查

**⚠️ 重要**: 确保敏感信息不会被上传

```bash
# 检查是否有敏感文件被意外提交
git log --name-only | grep -E "\.(env|key|pem)$"

# 如果发现敏感文件，立即移除
git rm --cached .env
git commit -m "Remove sensitive environment file"
git push
```

## 📋 上传后的仓库 URL 格式

上传完成后，您的仓库 URL 将是：
```
https://github.com/YOUR_USERNAME/sociomint
```

请将此 URL 提供给我，我将帮您配置 GitHub Secrets。

## 🔒 安全最佳实践

1. **私有仓库**: 建议设置为私有，保护商业机密
2. **分支保护**: 设置 main 分支保护规则
3. **访问控制**: 只授权必要的协作者
4. **定期审查**: 定期检查仓库访问权限

## 🚨 紧急情况处理

如果意外上传了敏感信息：

```bash
# 立即移除敏感文件
git rm --cached .env
git commit -m "Remove sensitive data"
git push

# 如果需要完全清除历史记录
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch .env' \
--prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

完成上传后，请提供仓库 URL，我将立即帮您配置所有必要的 GitHub Secrets！
