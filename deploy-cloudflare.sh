#!/bin/bash

# SocioMint Cloudflare Pages 部署脚本
# 修复 Connection timed out (Error 522) 问题

set -e

echo "🚀 开始部署 SocioMint 到 Cloudflare Pages..."

# 1. 清理之前的构建
echo "📦 清理之前的构建..."
rm -rf out .next

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci --production=false

# 3. 构建静态文件
echo "🔨 构建静态文件..."
npm run build

# 4. 检查构建结果
if [ ! -d "out" ]; then
    echo "❌ 构建失败：out 目录不存在"
    exit 1
fi

echo "✅ 构建成功！生成的文件："
ls -la out/

# 5. 创建 Cloudflare Pages 配置
echo "⚙️ 创建 Cloudflare Pages 配置..."

# 创建 _headers 文件（如果不存在）
if [ ! -f "out/_headers" ]; then
    cat > out/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.ico
  Cache-Control: public, max-age=86400

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
EOF
fi

# 创建 _redirects 文件（如果不存在）
if [ ! -f "out/_redirects" ]; then
    cat > out/_redirects << 'EOF'
# SPA 路由重定向
/admin/* /admin/dashboard/index.html 200
/profile/* /profile/index.html 200
/vault/* /vault/index.html 200
/exchange/* /exchange/index.html 200
/market/* /market/index.html 200
/presale/* /presale/index.html 200
/tasks/* /tasks/index.html 200
/social-tasks/* /social-tasks/index.html 200
/assets/* /assets/index.html 200
/debug/* /debug/supabase/index.html 200

# 404 处理
/* /404.html 404
EOF
fi

echo "📁 部署文件准备完成："
echo "- 静态文件: $(find out -name "*.html" | wc -l) 个 HTML 文件"
echo "- 资源文件: $(find out/_next/static -type f | wc -l) 个静态资源"
echo "- 配置文件: _headers, _redirects"

echo ""
echo "🎯 下一步操作："
echo "1. 登录 Cloudflare Dashboard"
echo "2. 进入 Pages 页面"
echo "3. 选择 'Direct Upload'"
echo "4. 上传 out/ 目录中的所有文件"
echo "5. 配置自定义域名 sociomint.top"
echo ""
echo "📂 要上传的目录: $(pwd)/out"
echo "🌐 目标域名: https://sociomint.top"
echo ""
echo "✅ 部署准备完成！"
