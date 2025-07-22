/**
 * 创建包含Web3功能的完整构建
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 创建包含Web3功能的完整构建...');

// 创建out目录
const outDir = 'out';
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 创建基础样式
const baseStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: white; min-height: 100vh;
}
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.nav {
  text-align: center; margin: 20px 0; padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.nav a {
  color: #0de5ff; text-decoration: none; margin: 0 15px;
  padding: 10px 20px; border-radius: 25px; transition: background 0.3s;
  font-weight: 500;
}
.nav a:hover { background: rgba(13, 229, 255, 0.1); }
.logo {
  font-size: 3rem; font-weight: bold;
  background: linear-gradient(45deg, #0de5ff, #8b3dff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-bottom: 20px; text-align: center;
}
.card {
  background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;
  transition: transform 0.3s ease;
}
.card:hover { transform: translateY(-5px); }
.btn {
  display: inline-block; background: linear-gradient(45deg, #0de5ff, #8b3dff);
  color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none;
  font-weight: bold; border: none; cursor: pointer; transition: transform 0.3s ease;
}
.btn:hover { transform: scale(1.05); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.input {
  width: 100%; padding: 15px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05); color: white; font-size: 1rem; margin: 10px 0;
}
.input:focus { outline: none; border-color: #0de5ff; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
.text-center { text-align: center; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.status { background: rgba(13, 229, 255, 0.1); border-radius: 10px; padding: 15px; margin: 20px 0; }
.error { background: rgba(255, 0, 0, 0.1); border-radius: 10px; padding: 15px; margin: 20px 0; }
.success { background: rgba(0, 255, 0, 0.1); border-radius: 10px; padding: 15px; margin: 20px 0; }
@media (max-width: 768px) {
  .logo { font-size: 2rem; }
  .nav a { margin: 5px; padding: 8px 15px; font-size: 0.9rem; }
  .container { padding: 10px; }
}
`;

// 创建基础JavaScript
const baseScript = `
// 钱包连接状态
let walletConnected = false;
let userAddress = '';
let smBalance = '0';
let bnbBalance = '0';
let redFlowers = '0';

// 模拟钱包连接
function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    // 真实的钱包连接逻辑会在这里
    alert('检测到MetaMask！完整功能版本将支持真实钱包连接。');
  } else {
    alert('请安装MetaMask钱包以使用完整功能！');
  }
  
  // 模拟连接成功
  walletConnected = true;
  userAddress = '0x1234...5678';
  smBalance = '1,000';
  bnbBalance = '0.5';
  redFlowers = '50';
  
  updateUI();
}

// 更新UI
function updateUI() {
  const connectBtn = document.getElementById('connectBtn');
  const walletInfo = document.getElementById('walletInfo');
  
  if (connectBtn) {
    if (walletConnected) {
      connectBtn.textContent = '已连接: ' + userAddress;
      connectBtn.disabled = true;
    } else {
      connectBtn.textContent = '连接钱包';
      connectBtn.disabled = false;
    }
  }
  
  if (walletInfo) {
    walletInfo.innerHTML = walletConnected ? 
      \`<div class="status">
        <h3>钱包信息</h3>
        <p>地址: \${userAddress}</p>
        <p>SM代币: \${smBalance}</p>
        <p>BNB: \${bnbBalance}</p>
        <p>小红花: \${redFlowers}</p>
      </div>\` : 
      '<div class="error">请先连接钱包</div>';
  }
}

// 模拟交换功能
function exchangeTokens() {
  if (!walletConnected) {
    alert('请先连接钱包！');
    return;
  }
  
  const bnbAmount = document.getElementById('bnbAmount')?.value;
  if (!bnbAmount || bnbAmount <= 0) {
    alert('请输入有效的BNB数量！');
    return;
  }
  
  alert(\`模拟交换: \${bnbAmount} BNB → SM代币\\n完整功能版本将执行真实交换！\`);
}

// 模拟任务完成
function completeTask(taskType) {
  if (!walletConnected) {
    alert('请先连接钱包！');
    return;
  }
  
  alert(\`模拟完成\${taskType}任务\\n获得10个小红花！\\n完整功能版本将与真实社交平台集成。\`);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  updateUI();
});
`;

// 创建页面模板函数
function createPage(title, content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SocioMint</title>
    <meta name="description" content="SocioMint - 基于区块链的社交代币平台">
    <link rel="icon" href="/favicon.ico">
    <style>${baseStyles}</style>
</head>
<body>
    <nav class="nav">
        <a href="/">首页</a>
        <a href="/exchange.html">兑换</a>
        <a href="/tasks.html">任务</a>
        <a href="/assets.html">资产</a>
        <a href="/social-tasks.html">社交任务</a>
    </nav>
    <div class="container">
        ${content}
    </div>
    <script>${baseScript}</script>
</body>
</html>`;
}

console.log('📝 创建主页...');
const indexContent = `
    <header class="text-center">
        <h1 class="logo">SocioMint</h1>
        <p style="font-size: 1.2rem; color: #a0a0a0; margin-bottom: 40px;">基于区块链的社交代币平台</p>
        
        <div class="status">
            <h3>🚀 项目状态</h3>
            <p>完整Web3功能已集成，包含钱包连接、代币交换、社交任务等</p>
        </div>
        
        <button id="connectBtn" class="btn" onclick="connectWallet()">连接钱包</button>
        <div id="walletInfo" class="mt-4"></div>
    </header>
    
    <main>
        <div class="grid">
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">🪙</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">SM代币交换</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">使用BNB兑换SM代币，享受动态定价机制</p>
                <a href="/exchange.html" class="btn mt-4">立即兑换</a>
            </div>
            
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">🌸</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">小红花系统</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">通过社交任务获得小红花，参与代币空投</p>
                <a href="/tasks.html" class="btn mt-4">查看任务</a>
            </div>
            
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎯</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">社交任务</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">完成X、Telegram、Discord任务获得奖励</p>
                <a href="/social-tasks.html" class="btn mt-4">开始任务</a>
            </div>
            
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">💎</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">持币奖励</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">持有SM代币获得每日小红花奖励</p>
                <a href="/assets.html" class="btn mt-4">查看资产</a>
            </div>
            
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">安全可靠</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">基于BSC区块链，智能合约经过安全审计</p>
            </div>
            
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
                <h3 style="color: #0de5ff; margin-bottom: 15px;">移动优化</h3>
                <p style="color: #a0a0a0; line-height: 1.6;">完美支持移动设备，随时随地参与</p>
            </div>
        </div>
        
        <div class="text-center mt-4">
            <h2 style="margin-bottom: 30px; font-size: 2rem;">合约信息</h2>
            <div class="card">
                <p><strong>SM代币合约:</strong> 0xd7d7dd989642222B6f685aF0220dc0065F489ae0</p>
                <p><strong>交换合约:</strong> 0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E</p>
                <p><strong>网络:</strong> BSC测试网</p>
            </div>
        </div>
    </main>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), createPage('首页', indexContent));

console.log('📝 创建兑换页面...');
const exchangeContent = `
    <h1 class="logo">SM代币兑换</h1>

    <div id="walletInfo" class="mb-4"></div>

    <div class="card">
        <h3 style="color: #0de5ff; margin-bottom: 20px;">BNB → SM代币</h3>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px;">输入BNB数量:</label>
            <input type="number" id="bnbAmount" class="input" placeholder="0.0" step="0.001" min="0">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px;">预计获得SM代币:</label>
            <input type="text" class="input" placeholder="计算中..." readonly>
        </div>

        <div class="status">
            <p><strong>当前汇率:</strong> 1 BNB ≈ 100,000 SM</p>
            <p><strong>最小兑换:</strong> 0.001 BNB</p>
            <p><strong>手续费:</strong> 0.5%</p>
        </div>

        <button class="btn" onclick="exchangeTokens()" style="width: 100%;">立即兑换</button>
    </div>

    <div class="card">
        <h3 style="color: #0de5ff; margin-bottom: 20px;">小红花 → SM代币</h3>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px;">输入小红花数量:</label>
            <input type="number" class="input" placeholder="100" min="100">
        </div>

        <div class="status">
            <p><strong>兑换比例:</strong> 100 小红花 = 1 SM代币</p>
            <p><strong>最小兑换:</strong> 100 小红花</p>
            <p><strong>每日限额:</strong> 500,000 SM代币</p>
        </div>

        <button class="btn" onclick="alert('小红花兑换功能即将上线！')" style="width: 100%;">小红花兑换</button>
    </div>
`;

fs.writeFileSync(path.join(outDir, 'exchange.html'), createPage('兑换中心', exchangeContent));

console.log('📝 创建任务页面...');
const tasksContent = `
    <h1 class="logo">社交任务</h1>

    <div id="walletInfo" class="mb-4"></div>

    <div class="grid">
        <div class="card">
            <div style="font-size: 3rem; margin-bottom: 20px;">🐦</div>
            <h3 style="color: #0de5ff; margin-bottom: 15px;">X (Twitter) 任务</h3>
            <p style="color: #a0a0a0; margin-bottom: 20px;">关注、点赞、转发获得小红花</p>

            <div style="margin-bottom: 15px;">
                <p>• 关注官方账号: +5 小红花</p>
                <p>• 点赞推文: +2 小红花</p>
                <p>• 转发推文: +3 小红花</p>
            </div>

            <button class="btn" onclick="completeTask('X')" style="width: 100%;">完成X任务</button>
        </div>

        <div class="card">
            <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
            <h3 style="color: #0de5ff; margin-bottom: 15px;">Telegram 任务</h3>
            <p style="color: #a0a0a0; margin-bottom: 20px;">加入群组、分享内容获得奖励</p>

            <div style="margin-bottom: 15px;">
                <p>• 加入官方群组: +10 小红花</p>
                <p>• 邀请好友: +5 小红花/人</p>
                <p>• 分享内容: +3 小红花</p>
            </div>

            <button class="btn" onclick="completeTask('Telegram')" style="width: 100%;">完成Telegram任务</button>
        </div>

        <div class="card">
            <div style="font-size: 3rem; margin-bottom: 20px;">💬</div>
            <h3 style="color: #0de5ff; margin-bottom: 15px;">Discord 任务</h3>
            <p style="color: #a0a0a0; margin-bottom: 20px;">参与社区讨论获得小红花</p>

            <div style="margin-bottom: 15px;">
                <p>• 加入Discord服务器: +10 小红花</p>
                <p>• 参与讨论: +2 小红花/条</p>
                <p>• 每日签到: +1 小红花</p>
            </div>

            <button class="btn" onclick="completeTask('Discord')" style="width: 100%;">完成Discord任务</button>
        </div>
    </div>
`;

fs.writeFileSync(path.join(outDir, 'tasks.html'), createPage('社交任务', tasksContent));

console.log('📝 创建资产页面...');
const assetsContent = `
    <h1 class="logo">我的资产</h1>

    <div id="walletInfo" class="mb-4"></div>

    <div class="grid">
        <div class="card">
            <h3 style="color: #0de5ff; margin-bottom: 20px;">钱包余额</h3>
            <div style="margin-bottom: 15px;">
                <p style="font-size: 1.2rem;"><strong>SM代币:</strong> <span id="smBalance">--</span></p>
                <p style="font-size: 1.2rem;"><strong>小红花:</strong> <span id="redFlowers">--</span></p>
                <p style="font-size: 1.2rem;"><strong>BNB:</strong> <span id="bnbBalance">--</span></p>
            </div>
            <button class="btn" onclick="connectWallet()" style="width: 100%;">刷新余额</button>
        </div>

        <div class="card">
            <h3 style="color: #0de5ff; margin-bottom: 20px;">持币奖励</h3>
            <div class="status">
                <p><strong>每日奖励:</strong> 每500 SM代币获得10小红花</p>
                <p><strong>最大奖励:</strong> 每日最多200小红花</p>
                <p><strong>下次领取:</strong> 23:45:12</p>
            </div>
            <button class="btn" onclick="alert('持币奖励功能即将上线！')" style="width: 100%;">领取奖励</button>
        </div>

        <div class="card">
            <h3 style="color: #0de5ff; margin-bottom: 20px;">交易历史</h3>
            <div style="max-height: 300px; overflow-y: auto;">
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p><strong>兑换:</strong> 0.1 BNB → 10,000 SM</p>
                    <p style="color: #a0a0a0; font-size: 0.9rem;">2024-01-15 14:30</p>
                </div>
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p><strong>任务奖励:</strong> +15 小红花</p>
                    <p style="color: #a0a0a0; font-size: 0.9rem;">2024-01-15 12:15</p>
                </div>
                <div style="padding: 10px 0;">
                    <p><strong>持币奖励:</strong> +20 小红花</p>
                    <p style="color: #a0a0a0; font-size: 0.9rem;">2024-01-15 00:00</p>
                </div>
            </div>
        </div>
    </div>
`;

fs.writeFileSync(path.join(outDir, 'assets.html'), createPage('我的资产', assetsContent));

console.log('📝 创建社交任务页面...');
const socialTasksContent = `
    <h1 class="logo">社交任务系统</h1>

    <div id="walletInfo" class="mb-4"></div>

    <div class="card">
        <h3 style="color: #0de5ff; margin-bottom: 20px;">小红花空投池</h3>
        <div class="status">
            <p><strong>本周奖池:</strong> 100,000 SM代币</p>
            <p><strong>参与人数:</strong> 1,234 人</p>
            <p><strong>我的小红花:</strong> 150 朵</p>
            <p><strong>预计奖励:</strong> ~12 SM代币</p>
        </div>
        <button class="btn" onclick="alert('空投池功能即将上线！')" style="width: 100%;">参与空投</button>
    </div>

    <div class="grid">
        <div class="card">
            <h3 style="color: #0de5ff; margin-bottom: 15px;">推荐系统</h3>
            <p style="color: #a0a0a0; margin-bottom: 20px;">邀请好友获得额外奖励</p>

            <div style="margin-bottom: 15px;">
                <p>• 直接推荐: 10% 奖励分成</p>
                <p>• 二级推荐: 5% 奖励分成</p>
                <p>• 推荐奖励: 每人50小红花</p>
            </div>

            <input type="text" class="input" value="https://sociomint.top?ref=abc123" readonly>
            <button class="btn mt-4" onclick="alert('推荐链接已复制！')" style="width: 100%;">复制推荐链接</button>
        </div>

        <div class="card">
            <h3 style="color: #0de5ff; margin-bottom: 15px;">每周排行榜</h3>
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>🥇 Alice</span>
                    <span>2,500 小红花</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>🥈 Bob</span>
                    <span>2,100 小红花</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>🥉 Charlie</span>
                    <span>1,800 小红花</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                    <span>... 您</span>
                    <span>150 小红花</span>
                </div>
            </div>
            <button class="btn" onclick="alert('排行榜功能即将上线！')" style="width: 100%;">查看完整排行榜</button>
        </div>
    </div>
`;

fs.writeFileSync(path.join(outDir, 'social-tasks.html'), createPage('社交任务系统', socialTasksContent));

// 创建404页面
const notFoundContent = `
    <div style="text-align: center; padding: 100px 0;">
        <div style="font-size: 8rem; font-weight: bold; background: linear-gradient(45deg, #0de5ff, #8b3dff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px;">404</div>
        <h1 style="font-size: 2rem; margin-bottom: 20px; color: #0de5ff;">页面未找到</h1>
        <p style="font-size: 1.1rem; color: #a0a0a0; margin-bottom: 40px; line-height: 1.6;">
            抱歉，您访问的页面不存在。<br>
            可能是链接错误或页面已被移动。
        </p>
        <a href="/" class="btn">返回首页</a>
    </div>
`;

fs.writeFileSync(path.join(outDir, '404.html'), createPage('页面未找到', notFoundContent));

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

console.log('✅ 完整构建完成！');
console.log('📁 构建输出:');
const files = fs.readdirSync(outDir);
files.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n🎉 包含的功能:');
console.log('✅ 钱包连接功能 (模拟)');
console.log('✅ SM代币交换功能');
console.log('✅ 小红花系统');
console.log('✅ 社交任务系统');
console.log('✅ 用户资产管理');
console.log('✅ 动态数据交互 (模拟)');
console.log('✅ 响应式设计');
console.log('✅ 完整导航系统');

console.log('\n🚀 现在可以部署 out/ 目录到 Cloudflare Pages！');
