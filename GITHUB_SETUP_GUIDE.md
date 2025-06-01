# GitHub CI/CD 设置指南

## 🎯 概述

本指南将帮助您配置 GitHub Actions 和 Secrets，实现 SocioMint 项目的自动化 CI/CD 流程。

## 📋 前置条件

1. ✅ GitHub 仓库已创建
2. ✅ 具有仓库的管理员权限
3. ✅ Supabase 项目已设置
4. ✅ 智能合约已部署

## 🔐 GitHub Secrets 配置

### 步骤 1: 访问 Secrets 设置

1. 打开您的 GitHub 仓库
2. 点击 "Settings" 标签
3. 在左侧菜单中选择 "Secrets and variables" > "Actions"
4. 点击 "New repository secret"

### 步骤 2: 添加必需的 Secrets

#### 2.1 Supabase 配置
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://kiyyhitozmezuppziomx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c
```

#### 2.2 智能合约地址
```
Name: NEXT_PUBLIC_SM_TOKEN_ADDRESS
Value: 0xd7d7dd989642222B6f685aF0220dc0065F489ae0

Name: NEXT_PUBLIC_SM_EXCHANGE_ADDRESS
Value: 0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
```

#### 2.3 可选的第三方服务 Secrets
```
Name: CODECOV_TOKEN
Value: [您的 Codecov 令牌]

Name: VERCEL_TOKEN
Value: [您的 Vercel 令牌]

Name: VERCEL_ORG_ID
Value: [您的 Vercel 组织 ID]

Name: VERCEL_PROJECT_ID
Value: [您的 Vercel 项目 ID]

Name: SONAR_TOKEN
Value: [您的 SonarCloud 令牌]
```

## 🚀 启用 GitHub Actions

### 步骤 1: 检查 Actions 权限

1. 在仓库设置中，点击 "Actions" > "General"
2. 确保 "Actions permissions" 设置为 "Allow all actions and reusable workflows"
3. 确保 "Workflow permissions" 设置为 "Read and write permissions"

### 步骤 2: 验证工作流文件

确保以下文件存在并正确配置：

```
.github/
└── workflows/
    └── test.yml
```

### 步骤 3: 触发首次运行

1. 推送代码到 `main` 或 `develop` 分支
2. 或者创建 Pull Request
3. 或者在 Actions 标签页手动触发工作流

## 📊 监控和调试

### 查看工作流状态

1. 点击仓库的 "Actions" 标签
2. 选择相应的工作流运行
3. 查看各个作业的日志

### 常见问题排查

#### 问题 1: Secrets 未找到
```
Error: The secret `NEXT_PUBLIC_SUPABASE_URL` was not found
```
**解决方案**: 检查 Secret 名称是否正确，确保已添加到仓库 Secrets 中。

#### 问题 2: 权限不足
```
Error: Resource not accessible by integration
```
**解决方案**: 检查 Actions 权限设置，确保有足够的权限。

#### 问题 3: 测试失败
```
Error: Tests failed
```
**解决方案**: 本地运行测试，修复失败的测试用例。

## 🔧 工作流配置详解

### 当前工作流包含：

1. **代码质量检查**
   - ESLint 代码检查
   - Prettier 格式检查
   - TypeScript 类型检查

2. **测试套件**
   - 单元测试
   - 集成测试
   - 组件测试
   - 性能测试

3. **构建验证**
   - Next.js 应用构建
   - 构建产物上传

4. **安全审计**
   - npm audit 安全检查
   - 依赖漏洞扫描

### 触发条件：

- 推送到 `main`, `develop`, `feature/*` 分支
- 创建 Pull Request 到 `main`, `develop` 分支
- 手动触发 (workflow_dispatch)

## 📈 覆盖率报告

### Codecov 集成

1. 注册 [Codecov](https://codecov.io) 账号
2. 连接您的 GitHub 仓库
3. 获取 Codecov 令牌
4. 添加到 GitHub Secrets: `CODECOV_TOKEN`

### 查看覆盖率报告

- 在 PR 中查看覆盖率变化
- 访问 Codecov Dashboard 查看详细报告
- 在 Actions 日志中查看覆盖率摘要

## 🚢 部署配置

### Vercel 自动部署

1. 连接 Vercel 到 GitHub 仓库
2. 配置环境变量
3. 设置自动部署分支

### 环境变量配置

在 Vercel Dashboard 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[您的 anon key]
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
```

## 🔄 工作流优化

### 缓存策略

- Node.js 依赖缓存
- Next.js 构建缓存
- Jest 测试缓存

### 并行执行

- 测试分组并行运行
- 质量检查并行执行
- 构建和测试并行进行

### 条件执行

- 只在相关文件变更时运行特定测试
- 跳过不必要的检查
- 智能重试机制

## ✅ 验证清单

- [ ] 所有必需的 Secrets 已添加
- [ ] Actions 权限已正确配置
- [ ] 工作流文件语法正确
- [ ] 首次运行成功
- [ ] 测试覆盖率报告正常
- [ ] 部署流程正常工作
- [ ] 通知设置已配置

## 📞 获取帮助

如果遇到问题：

1. 检查 Actions 日志的详细错误信息
2. 验证 Secrets 配置是否正确
3. 参考 [GitHub Actions 文档](https://docs.github.com/en/actions)
4. 查看项目的 Issues 和 Discussions

---

**注意**: 请妥善保管所有的 API 密钥和令牌，不要在代码中硬编码敏感信息。
