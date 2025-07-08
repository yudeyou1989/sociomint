# 🔧 SocioMint 问题解决手册

## 🚨 常见部署问题及解决方案

### 问题1: Git推送失败

**症状**:
```
fatal: remote origin already exists
或
error: failed to push some refs
```

**解决方案**:
```bash
# 检查远程仓库
git remote -v

# 如果没有远程仓库，添加
git remote add origin https://github.com/yudeyou1989/sociomint.git

# 如果已存在但不正确，更新
git remote set-url origin https://github.com/yudeyou1989/sociomint.git

# 强制推送
git push -f origin main
```

---

### 问题2: Cloudflare构建失败

**症状**: 构建日志显示错误，如 "Build failed"

**常见原因及解决**:

#### 2.1 Node.js版本问题
**错误信息**: `Node.js version not supported`
**解决**: 在环境变量中添加:
```
NODE_VERSION=18
```

#### 2.2 依赖安装失败
**错误信息**: `npm install failed`
**解决**: 
1. 确认 `package.json` 文件已正确上传到GitHub
2. 检查网络连接
3. 在环境变量中添加: `NPM_FLAGS=--legacy-peer-deps`

#### 2.3 构建命令错误
**错误信息**: `Build command failed`
**解决**: 确认构建设置为:
- Build command: `npm run build`
- Build output directory: `.next`

#### 2.4 环境变量缺失
**错误信息**: `Missing required environment variables`
**解决**: 确保所有必需的环境变量都已添加

---

### 问题3: 网站无法访问

#### 3.1 域名解析问题
**症状**: 访问 sociomint.top 显示 "This site can't be reached"

**解决步骤**:
1. **等待DNS传播**: 可能需要24小时
2. **检查DNS设置**: 使用 https://dnschecker.org/ 验证
3. **清除DNS缓存**:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```

#### 3.2 SSL证书问题
**症状**: 显示 "Your connection is not private"

**解决步骤**:
1. 在Cloudflare Dashboard中检查SSL/TLS设置
2. 确保模式设置为 "Full (strict)"
3. 等待证书颁发 (通常几分钟)
4. 清除浏览器缓存

---

### 问题4: 功能异常

#### 4.1 钱包连接失败
**症状**: 点击连接钱包没有反应或报错

**解决步骤**:
1. **检查WalletConnect配置**:
   - 确认 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 已设置
   - 验证项目ID是否正确

2. **检查浏览器控制台**:
   - 按F12打开开发者工具
   - 查看Console标签页的错误信息

3. **测试不同钱包**:
   - 尝试MetaMask
   - 尝试WalletConnect
   - 检查钱包是否已安装

#### 4.2 代币交换功能异常
**症状**: 交换按钮不可用或交易失败

**解决步骤**:
1. **检查合约地址**:
   - 确认 `NEXT_PUBLIC_SM_TOKEN_ADDRESS` 正确
   - 确认 `NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS` 正确

2. **检查网络配置**:
   - 确认 `NEXT_PUBLIC_RPC_URL` 可访问
   - 验证链ID设置正确

3. **检查钱包余额**:
   - 确保有足够的BNB支付Gas费
   - 检查代币余额

#### 4.3 页面加载缓慢
**症状**: 页面加载时间超过5秒

**解决步骤**:
1. **检查Cloudflare缓存设置**
2. **优化图片资源**
3. **检查API响应时间**
4. **使用浏览器性能工具分析**

---

## 🔍 调试工具和方法

### 1. 浏览器开发者工具
```
F12 → Console 标签页
查看JavaScript错误和警告
```

### 2. 网络请求检查
```
F12 → Network 标签页
检查API请求是否成功
查看响应时间和状态码
```

### 3. Cloudflare Analytics
```
Cloudflare Dashboard → Analytics
查看访问量、性能指标
检查错误率
```

### 4. DNS检查工具
- https://dnschecker.org/
- https://www.whatsmydns.net/

### 5. SSL检查工具
- https://www.ssllabs.com/ssltest/

---

## 📞 获取帮助的步骤

### 1. 收集信息
在寻求帮助前，请收集以下信息：

**基本信息**:
- 操作系统和浏览器版本
- 具体的错误信息或截图
- 问题发生的具体步骤

**技术信息**:
- Cloudflare部署日志
- 浏览器控制台错误信息
- 网络请求详情

### 2. 自助排查
1. 查看本文档的相关章节
2. 检查Cloudflare部署状态
3. 验证环境变量配置
4. 测试基本功能

### 3. 寻求技术支持
如果自助排查无法解决问题，请提供：
- 详细的问题描述
- 错误截图或日志
- 已尝试的解决方法
- 期望的结果

---

## 🛠️ 预防性维护

### 定期检查项目
1. **每周检查**:
   - 网站访问状态
   - 基本功能测试
   - 性能监控数据

2. **每月检查**:
   - 依赖包更新
   - 安全漏洞扫描
   - 备份数据验证

3. **季度检查**:
   - 全面功能测试
   - 性能优化评估
   - 用户反馈收集

### 监控设置
1. **设置告警**:
   - 网站宕机告警
   - 错误率告警
   - 性能下降告警

2. **定期备份**:
   - 代码备份
   - 配置备份
   - 数据库备份

---

## 🎯 快速诊断检查清单

当遇到问题时，按以下顺序检查：

- [ ] 网站是否可以访问
- [ ] DNS解析是否正常
- [ ] SSL证书是否有效
- [ ] 环境变量是否正确配置
- [ ] Cloudflare部署是否成功
- [ ] 浏览器控制台是否有错误
- [ ] 网络请求是否正常
- [ ] 钱包连接是否正常
- [ ] 合约地址是否正确

**🔧 记住：大多数问题都可以通过检查配置和重新部署来解决！**
