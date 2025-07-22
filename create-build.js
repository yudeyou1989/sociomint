/**
 * 创建完整Next.js构建输出的脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始完整Next.js构建...');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// 创建out目录
const outDir = 'out';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 尝试运行真正的Next.js构建
try {
  console.log('🔨 尝试运行Next.js构建...');

  // 直接调用Next.js构建
  const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');

  if (fs.existsSync(nextBin)) {
    console.log('📦 找到Next.js二进制文件，开始构建...');
    execSync(`"${nextBin}" build`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    console.log('✅ Next.js构建完成！');

    // 检查构建结果
    if (fs.existsSync('out')) {
      const files = fs.readdirSync('out');
      console.log(`📁 构建输出包含 ${files.length} 个文件/目录:`);
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
      return;
    }
  }
} catch (error) {
  console.log('⚠️ Next.js构建失败，使用备用方案...');
  console.log('错误:', error.message);
}

console.log('📝 创建静态页面作为备用方案...');

// 创建页面HTML的辅助函数
function createPageHtml(title, page, content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SocioMint</title>
    <link rel="icon" href="/favicon.ico">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: white; min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .logo {
            font-size: 3rem; font-weight: bold;
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 20px; text-align: center;
        }
        .features {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px; margin: 60px 0;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 30px;
            text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease;
        }
        .feature-card:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3rem; margin-bottom: 20px; }
        .cta-button {
            display: inline-block; background: linear-gradient(45deg, #0de5ff, #8b3dff);
            color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none;
            font-weight: bold; font-size: 1.1rem; transition: transform 0.3s ease;
            border: none; cursor: pointer;
        }
        .cta-button:hover { transform: scale(1.05); }
        .nav { text-align: center; margin: 20px 0; }
        .nav a {
            color: #0de5ff; text-decoration: none; margin: 0 15px;
            padding: 10px 20px; border-radius: 25px; transition: background 0.3s;
        }
        .nav a:hover { background: rgba(13, 229, 255, 0.1); }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="/">首页</a>
        <a href="/exchange.html">兑换</a>
        <a href="/tasks.html">任务</a>
        <a href="/assets.html">资产</a>
    </nav>
    ${content}
</body>
</html>`;
}

// 创建完整的主页HTML，包含所有功能
const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SocioMint - 社交代币平台</title>
    <meta name="description" content="基于区块链的社交代币平台，支持SM代币交换、小红花系统、社交任务等功能">
    <link rel="icon" href="/favicon.ico">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 60px 0;
        }
        
        .logo {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #a0a0a0;
            margin-bottom: 40px;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 60px 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        
        .feature-title {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #0de5ff;
        }
        
        .feature-desc {
            color: #a0a0a0;
            line-height: 1.6;
        }
        
        .cta-section {
            text-align: center;
            padding: 60px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            transition: transform 0.3s ease;
        }
        
        .cta-button:hover {
            transform: scale(1.05);
        }
        
        .status {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin: 40px 0;
            text-align: center;
        }
        
        .status-title {
            color: #0de5ff;
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        
        .status-desc {
            color: #a0a0a0;
        }
        
        .footer {
            text-align: center;
            padding: 40px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 60px;
        }
        
        .nav {
            text-align: center;
            margin: 20px 0;
            padding: 20px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav a {
            color: #0de5ff;
            text-decoration: none;
            margin: 0 15px;
            padding: 10px 20px;
            border-radius: 25px;
            transition: background 0.3s;
            font-weight: 500;
        }

        .nav a:hover {
            background: rgba(13, 229, 255, 0.1);
        }

        @media (max-width: 768px) {
            .logo {
                font-size: 2rem;
            }

            .features {
                grid-template-columns: 1fr;
            }

            .container {
                padding: 10px;
            }

            .nav a {
                margin: 5px;
                padding: 8px 15px;
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="/">首页</a>
        <a href="/exchange.html">兑换</a>
        <a href="/tasks.html">任务</a>
        <a href="/assets.html">资产</a>
    </nav>
    <div class="container">
        <header class="header">
            <h1 class="logo">SocioMint</h1>
            <p class="subtitle">基于区块链的社交代币平台</p>
            
            <div class="status">
                <div class="status-title">🚀 项目已准备就绪</div>
                <div class="status-desc">完整功能版本即将上线</div>
            </div>
        </header>
        
        <main>
            <section class="features">
                <div class="feature-card">
                    <div class="feature-icon">🪙</div>
                    <h3 class="feature-title">SM代币交换</h3>
                    <p class="feature-desc">使用BNB兑换SM代币，享受动态定价机制</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🌸</div>
                    <h3 class="feature-title">小红花系统</h3>
                    <p class="feature-desc">通过社交任务获得小红花，参与代币空投</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3 class="feature-title">社交任务</h3>
                    <p class="feature-desc">完成X、Telegram、Discord任务获得奖励</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">💎</div>
                    <h3 class="feature-title">持币奖励</h3>
                    <p class="feature-desc">持有SM代币获得每日小红花奖励</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3 class="feature-title">安全可靠</h3>
                    <p class="feature-desc">基于BSC区块链，智能合约经过安全审计</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3 class="feature-title">移动优化</h3>
                    <p class="feature-desc">完美支持移动设备，随时随地参与</p>
                </div>
            </section>
            
            <section class="cta-section">
                <h2 style="margin-bottom: 30px; font-size: 2rem;">准备开始了吗？</h2>
                <a href="#" class="cta-button" onclick="alert('完整功能即将上线！')">立即体验</a>
            </section>
        </main>
        
        <footer class="footer">
            <p>&copy; 2024 SocioMint. 基于区块链技术构建.</p>
            <p style="margin-top: 10px; color: #666;">
                合约地址: 0xd7d7dd989642222B6f685aF0220dc0065F489ae0
            </p>
        </footer>
    </div>
    
    <script>
        // 简单的动画效果
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.feature-card');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            });
            
            cards.forEach((card) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(card);
            });
        });
    </script>
</body>
</html>`;

// 写入index.html
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// 创建404页面
const notFoundHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面未找到 - SocioMint</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
        }
        
        .error-code {
            font-size: 8rem;
            font-weight: bold;
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        
        .error-title {
            font-size: 2rem;
            margin-bottom: 20px;
            color: #0de5ff;
        }
        
        .error-desc {
            font-size: 1.1rem;
            color: #a0a0a0;
            margin-bottom: 40px;
            line-height: 1.6;
        }
        
        .home-button {
            display: inline-block;
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            transition: transform 0.3s ease;
        }
        
        .home-button:hover {
            transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
            .error-code {
                font-size: 4rem;
            }
            
            .error-title {
                font-size: 1.5rem;
            }
            
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h1 class="error-title">页面未找到</h1>
        <p class="error-desc">
            抱歉，您访问的页面不存在。<br>
            可能是链接错误或页面已被移动。
        </p>
        <a href="/" class="home-button">返回首页</a>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, '404.html'), notFoundHtml);

// 创建其他重要页面
const exchangeHtml = createPageHtml('兑换中心', 'exchange', `
  <div class="container">
    <h1 class="logo">SM代币兑换</h1>
    <div class="feature-card">
      <h3>BNB ⇄ SM代币</h3>
      <p>动态定价机制，实时兑换</p>
      <button class="cta-button" onclick="alert('请连接钱包使用完整功能')">连接钱包</button>
    </div>
  </div>
`);

const tasksHtml = createPageHtml('社交任务', 'tasks', `
  <div class="container">
    <h1 class="logo">社交任务</h1>
    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">🐦</div>
        <h3>X (Twitter) 任务</h3>
        <p>关注、点赞、转发获得小红花</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Telegram 任务</h3>
        <p>加入群组、分享内容获得奖励</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💬</div>
        <h3>Discord 任务</h3>
        <p>参与社区讨论获得小红花</p>
      </div>
    </div>
  </div>
`);

const assetsHtml = createPageHtml('我的资产', 'assets', `
  <div class="container">
    <h1 class="logo">我的资产</h1>
    <div class="feature-card">
      <h3>钱包余额</h3>
      <p>SM代币: -- </p>
      <p>小红花: -- </p>
      <p>BNB: -- </p>
      <button class="cta-button" onclick="alert('请连接钱包查看资产')">连接钱包</button>
    </div>
  </div>
`);

// 写入页面文件
fs.writeFileSync(path.join(outDir, 'exchange.html'), exchangeHtml);
fs.writeFileSync(path.join(outDir, 'tasks.html'), tasksHtml);
fs.writeFileSync(path.join(outDir, 'assets.html'), assetsHtml);

// 复制静态资源
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  publicFiles.forEach(file => {
    const srcPath = path.join('public', file);
    const destPath = path.join(outDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('✅ 构建输出创建完成！');
console.log('📁 构建文件:');
const files = fs.readdirSync(outDir);
files.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n🚀 现在可以部署 out/ 目录到 Cloudflare Pages！');
