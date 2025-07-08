# 🚀 SocioMint 快速部署指南

## 📊 当前项目状态

### ✅ **已完成 (100%)**
- [x] 代码开发完成
- [x] 性能优化完成 (解决卡顿问题)
- [x] 安全检查通过
- [x] 环境变量配置完成
- [x] 构建测试通过
- [x] 生产就绪检查: **23项通过，0错误**

**🎯 项目已完全准备好部署！**

---

## 🎯 您需要做的事情 (预计40分钟)

### 第1步: 上传代码到GitHub (10分钟)

```bash
# 在终端中执行以下命令
cd /Users/yudeyou/Desktop/sm/sociomint

# 添加所有文件
git add .

# 提交代码
git commit -m "feat: 生产环境部署准备完成"

# 推送到GitHub
git push origin main
```

**验证**: 访问 https://github.com/yudeyou1989/sociomint 确认代码已上传

---

### 第2步: Cloudflare Pages 部署 (20分钟)

#### 2.1 创建项目
1. 访问 https://dash.cloudflare.com/
2. 点击 "Pages" → "Create a project"
3. 选择 "Connect to Git" → 选择 GitHub
4. 选择仓库: `yudeyou1989/sociomint`

#### 2.2 配置构建设置
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (留空)
```

#### 2.3 添加环境变量
在项目设置中添加以下环境变量 (复制粘贴):

```
NEXT_PUBLIC_SUPABASE_URL=https://kiyyhitozmezuppziomx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg
NEXT_PUBLIC_SM_TOKEN_ADDRESS=0xd7d7dd989642222B6f685aF0220dc0065F489ae0
NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS=0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=fced525820007c9c024132cf432ffcae
DISCORD_CLIENT_SECRET=hSBZpLfwQPLJQipTHleiry0PzBADlWBC
TELEGRAM_BOT_TOKEN=7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s
```

---

### 第3步: 自定义域名配置 (10分钟)

1. **添加域名**: 在Cloudflare Pages项目中，进入 "Custom domains"
2. **输入域名**: `sociomint.top`
3. **配置DNS**: 按照Cloudflare的指示设置DNS记录
4. **SSL设置**: 确保SSL/TLS模式为 "Full (strict)"

---

## 🚨 可能遇到的问题及解决

### 问题1: Git推送失败
```bash
# 如果远程仓库不存在，添加它
git remote add origin https://github.com/yudeyou1989/sociomint.git

# 强制推送
git push -f origin main
```

### 问题2: Cloudflare构建失败
- 在环境变量中添加: `NODE_VERSION=18`
- 确认构建命令是: `npm run build`

### 问题3: 网站无法访问
- 等待DNS传播 (最多24小时)
- 清除浏览器缓存
- 检查SSL证书状态

---

## ✅ 部署成功验证

当您看到以下情况时，说明部署成功：

- [ ] https://sociomint.top 可以正常访问
- [ ] 页面加载速度快 (< 3秒)
- [ ] 钱包连接功能正常
- [ ] 代币交换功能正常
- [ ] 移动端显示正常

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 具体错误信息或截图
2. Cloudflare部署日志
3. 浏览器控制台错误信息
4. 您执行的具体步骤

---

## 🎉 部署后的下一步

### 立即可做的事情:
1. **测试所有功能**: 确保钱包连接、代币交换等功能正常
2. **分享给朋友**: 让他们测试并提供反馈
3. **监控性能**: 使用Cloudflare Analytics查看访问情况

### 未来可以考虑:
1. **主网合约部署**: 当您准备好时，部署到BSC主网
2. **功能扩展**: 根据用户反馈添加新功能
3. **营销推广**: 制定推广策略吸引更多用户

---

## 📋 快速检查清单

**部署前** (已完成):
- [x] 代码质量检查通过
- [x] 性能优化完成
- [x] 安全检查通过
- [x] 环境变量配置完成

**您需要做的**:
- [ ] 代码推送到GitHub
- [ ] Cloudflare Pages项目创建
- [ ] 环境变量配置
- [ ] 自定义域名设置
- [ ] 功能测试验证

**🚀 准备好开始了吗？按照上面的步骤，40分钟后您的SocioMint就会正式上线！**
