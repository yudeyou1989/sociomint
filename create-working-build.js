#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 创建可工作的静态构建...');

// 创建输出目录
const outDir = path.join(__dirname, 'out');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 创建静态资源目录
fs.mkdirSync(path.join(outDir, '_next', 'static', 'css'), { recursive: true });
fs.mkdirSync(path.join(outDir, '_next', 'static', 'js'), { recursive: true });

// 基础HTML模板
const createPage = (title, content, additionalHead = '') => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SocioMint</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg { 
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
        }
        .glass-card { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn-primary {
            background: linear-gradient(45deg, #0de5ff, #8b3dff);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .text-primary { color: #0de5ff; }
        .text-secondary { color: #8b3dff; }
    </style>
    ${additionalHead}
</head>
<body class="min-h-screen gradient-bg text-white">
    <!-- 导航栏 -->
    <nav class="p-4 border-b border-gray-800">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                SocioMint
            </h1>
            <div class="hidden md:flex space-x-6">
                <a href="/" class="hover:text-blue-300 transition-colors">首页</a>
                <a href="/exchange.html" class="hover:text-blue-300 transition-colors">兑换</a>
                <a href="/tasks.html" class="hover:text-blue-300 transition-colors">任务</a>
                <a href="/assets.html" class="hover:text-blue-300 transition-colors">资产</a>
                <a href="/social-tasks.html" class="hover:text-blue-300 transition-colors">社交任务</a>
            </div>
            <button id="connectBtn" onclick="connectWallet()" class="btn-primary px-4 py-2 rounded-lg font-medium">
                连接钱包
            </button>
        </div>
    </nav>

    <!-- 主要内容 -->
    <main class="container mx-auto px-4 py-8">
        ${content}
    </main>

    <!-- 钱包连接脚本 -->
    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
    <script>
        let wallet = { isConnected: false, address: null };
        
        async function connectWallet() {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    
                    wallet.isConnected = true;
                    wallet.address = address;
                    
                    document.getElementById('connectBtn').innerHTML = 
                        address.substring(0, 6) + '...' + address.substring(38);
                    
                    // 更新页面显示
                    updateWalletDisplay();
                } catch (error) {
                    console.error('连接钱包失败:', error);
                    alert('连接钱包失败');
                }
            } else {
                alert('请安装MetaMask钱包');
            }
        }
        
        function updateWalletDisplay() {
            const walletInfo = document.getElementById('walletInfo');
            if (walletInfo && wallet.isConnected) {
                walletInfo.innerHTML = 
                    '<div class="glass-card p-4 rounded-lg"><p>已连接钱包: ' + 
                    wallet.address.substring(0, 6) + '...' + wallet.address.substring(38) + 
                    '</p></div>';
            }
        }
        
        // 检查是否已连接钱包
        window.addEventListener('load', async () => {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    wallet.isConnected = true;
                    wallet.address = accounts[0];
                    document.getElementById('connectBtn').innerHTML = 
                        accounts[0].substring(0, 6) + '...' + accounts[0].substring(38);
                    updateWalletDisplay();
                }
            }
        });
    </script>
</body>
</html>`;

// 主页内容
const homeContent = `
    <div class="text-center mb-12">
        <h1 class="text-5xl font-bold mb-6">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                SocioMint
            </span>
        </h1>
        <p class="text-xl mb-8">通过社交媒体任务互动赚取SM代币</p>
        <div id="walletInfo" class="mt-4"></div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="glass-card p-6 rounded-lg text-center">
            <h3 class="text-lg mb-2">社交认证数量</h3>
            <p class="text-4xl font-bold text-blue-400">10,000+</p>
        </div>
        <div class="glass-card p-6 rounded-lg text-center">
            <h3 class="text-lg mb-2">SM兑换分发</h3>
            <p class="text-4xl font-bold text-purple-400">50,000+ SM</p>
        </div>
        <div class="glass-card p-6 rounded-lg text-center">
            <h3 class="text-lg mb-2">可用任务数</h3>
            <p class="text-4xl font-bold text-green-400">100+</p>
        </div>
    </div>

    <!-- 功能区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- SM代币兑换 -->
        <div class="glass-card p-6 rounded-lg">
            <h2 class="text-2xl font-bold mb-4 text-blue-400">🔄 SM代币兑换</h2>
            <div class="mb-4">
                <p class="mb-2">当前汇率: 1 BNB = 1100 SM</p>
                <div class="space-y-4">
                    <div>
                        <label class="block mb-2">BNB数量</label>
                        <input type="number" placeholder="0.0" class="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white">
                    </div>
                    <div>
                        <label class="block mb-2">获得SM</label>
                        <input type="text" placeholder="0" readonly class="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white">
                    </div>
                    <button class="btn-primary w-full py-3 rounded-lg font-medium">
                        立即兑换
                    </button>
                </div>
            </div>
        </div>

        <!-- 兑换中心 -->
        <div class="glass-card p-6 rounded-lg">
            <h2 class="text-2xl font-bold mb-4 text-purple-400">💼 兑换中心</h2>
            <div class="space-y-4">
                <div class="flex justify-between">
                    <span>交易总计</span>
                    <span>无有效交易数据</span>
                </div>
                <div class="flex justify-between">
                    <span>购买代币</span>
                    <span>-</span>
                </div>
                <button onclick="connectWallet()" class="btn-primary w-full py-3 rounded-lg font-medium">
                    连接钱包查看详情
                </button>
            </div>
        </div>
    </div>
`;

// 兑换页面内容
const exchangeContent = `
    <div class="max-w-2xl mx-auto">
        <h1 class="text-4xl font-bold text-center mb-8">BNB兑换SM</h1>
        <div class="glass-card p-8 rounded-lg">
            <div class="mb-6">
                <h3 class="text-xl mb-4">当前汇率: 1 BNB = 1100 SM</h3>
            </div>
            <div class="space-y-6">
                <div>
                    <label class="block mb-2 text-lg">输入BNB数量</label>
                    <input type="number" step="0.001" placeholder="0.000"
                           class="w-full p-4 text-xl rounded bg-gray-800 border border-gray-600 text-white">
                </div>
                <div>
                    <label class="block mb-2 text-lg">将获得SM代币</label>
                    <input type="text" placeholder="0" readonly
                           class="w-full p-4 text-xl rounded bg-gray-700 border border-gray-600 text-white">
                </div>
                <button class="btn-primary w-full py-4 text-xl rounded-lg font-medium">
                    确认兑换
                </button>
            </div>
        </div>
    </div>
`;

// 任务页面内容
const tasksContent = `
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold text-center mb-8">社交任务</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="glass-card p-6 rounded-lg">
                <div class="text-4xl mb-4">🐦</div>
                <h3 class="text-xl font-bold mb-2">X (Twitter) 任务</h3>
                <p class="text-gray-300 mb-4">关注、点赞、转发获得小红花</p>
                <button class="btn-primary w-full py-2 rounded-lg">查看任务</button>
            </div>
            <div class="glass-card p-6 rounded-lg">
                <div class="text-4xl mb-4">📱</div>
                <h3 class="text-xl font-bold mb-2">Telegram 任务</h3>
                <p class="text-gray-300 mb-4">加入群组、分享内容获得奖励</p>
                <button class="btn-primary w-full py-2 rounded-lg">查看任务</button>
            </div>
            <div class="glass-card p-6 rounded-lg">
                <div class="text-4xl mb-4">💬</div>
                <h3 class="text-xl font-bold mb-2">Discord 任务</h3>
                <p class="text-gray-300 mb-4">参与社区讨论获得小红花</p>
                <button class="btn-primary w-full py-2 rounded-lg">查看任务</button>
            </div>
        </div>
    </div>
`;

// 创建页面
console.log('📝 创建主页...');
fs.writeFileSync(path.join(outDir, 'index.html'), createPage('首页', homeContent));

console.log('📝 创建兑换页面...');
fs.writeFileSync(path.join(outDir, 'exchange.html'), createPage('代币兑换', exchangeContent));

console.log('📝 创建任务页面...');
fs.writeFileSync(path.join(outDir, 'tasks.html'), createPage('社交任务', tasksContent));

console.log('✅ 静态构建创建完成！');
console.log('📁 输出目录:', outDir);
console.log('🌐 可以通过以下方式预览:');
console.log('   npx serve out');
console.log('   或者直接打开 out/index.html');
