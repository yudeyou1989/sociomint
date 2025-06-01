const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 获取部署信息
function getDeploymentInfo(networkName) {
  const filePath = path.join(__dirname, '../deployments', `${networkName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ 找不到网络 ${networkName} 的部署信息`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 检查合约状态
async function checkContractStatus(airdropPool) {
  log('🔍 检查合约状态...', 'cyan');
  
  try {
    // 检查基本信息
    const owner = await airdropPool.owner();
    const poolConfig = await airdropPool.poolConfig();
    const currentRound = await airdropPool.getCurrentRound();
    
    log(`📋 合约所有者: ${owner}`, 'blue');
    log(`📋 每周奖励: ${ethers.formatEther(poolConfig.weeklySmAmount)} SM`, 'blue');
    log(`📋 轮次持续时间: ${poolConfig.roundDuration} 秒`, 'blue');
    log(`📋 最小投入: ${ethers.formatEther(poolConfig.minDeposit)} 小红花`, 'blue');
    log(`📋 最大投入: ${ethers.formatEther(poolConfig.maxDeposit)} 小红花`, 'blue');
    log(`📋 池状态: ${poolConfig.isActive ? '激活' : '未激活'}`, 'blue');
    log(`📋 当前轮次: ${currentRound.id}`, 'blue');
    
    return {
      owner,
      poolConfig,
      currentRound,
      isHealthy: true
    };
  } catch (error) {
    log(`❌ 检查合约状态失败: ${error.message}`, 'red');
    return { isHealthy: false, error: error.message };
  }
}

// 转入 SM 代币到空投池
async function fundAirdropPool(smTokenAddress, airdropPoolAddress, amount, signer) {
  log(`💰 向空投池转入 ${ethers.formatEther(amount)} SM 代币...`, 'cyan');
  
  const smToken = await ethers.getContractAt("IERC20", smTokenAddress, signer);
  
  // 检查余额
  const balance = await smToken.balanceOf(signer.address);
  log(`📋 当前 SM 余额: ${ethers.formatEther(balance)} SM`, 'blue');
  
  if (balance < amount) {
    throw new Error(`❌ SM 代币余额不足，需要 ${ethers.formatEther(amount)} SM`);
  }
  
  // 检查授权
  const allowance = await smToken.allowance(signer.address, airdropPoolAddress);
  log(`📋 当前授权额度: ${ethers.formatEther(allowance)} SM`, 'blue');
  
  if (allowance < amount) {
    log('📝 授权 SM 代币...', 'yellow');
    const approveTx = await smToken.approve(airdropPoolAddress, amount);
    await approveTx.wait();
    log('✅ SM 代币授权完成', 'green');
  }
  
  // 转入代币
  const transferTx = await smToken.transfer(airdropPoolAddress, amount);
  await transferTx.wait();
  
  log('✅ SM 代币转入完成', 'green');
  
  // 验证转入
  const poolBalance = await smToken.balanceOf(airdropPoolAddress);
  log(`📋 空投池 SM 余额: ${ethers.formatEther(poolBalance)} SM`, 'blue');
}

// 设置初始参数
async function setupInitialParameters(airdropPool, signer) {
  log('⚙️  设置初始参数...', 'cyan');
  
  const poolConfig = await airdropPool.poolConfig();
  
  // 如果池未激活，激活它
  if (!poolConfig.isActive) {
    log('🔄 激活空投池...', 'yellow');
    const activateTx = await airdropPool.togglePoolStatus();
    await activateTx.wait();
    log('✅ 空投池已激活', 'green');
  }
  
  // 检查当前轮次
  const currentRound = await airdropPool.getCurrentRound();
  if (currentRound.id === 0n) {
    log('🚀 启动第一轮空投...', 'yellow');
    // 第一轮会在合约初始化时自动启动
    log('✅ 第一轮空投已启动', 'green');
  }
  
  log('✅ 初始参数设置完成', 'green');
}

// 创建测试数据
async function createTestData(airdropPool, redFlowerTokenAddress, signer) {
  log('🧪 创建测试数据...', 'cyan');
  
  if (network.name === 'bsc') {
    log('⏭️  跳过主网测试数据创建', 'yellow');
    return;
  }
  
  try {
    const redFlowerToken = await ethers.getContractAt("IERC20", redFlowerTokenAddress, signer);
    
    // 给部署者一些小红花用于测试
    const testAmount = ethers.parseEther("1000");
    
    // 检查是否有 mint 函数
    try {
      const mintTx = await redFlowerToken.mint(signer.address, testAmount);
      await mintTx.wait();
      log(`✅ 铸造了 ${ethers.formatEther(testAmount)} 小红花用于测试`, 'green');
    } catch (error) {
      log('⚠️  无法铸造小红花，可能需要手动转入', 'yellow');
    }
    
    // 授权空投池使用小红花
    const airdropPoolAddress = await airdropPool.getAddress();
    const approveTx = await redFlowerToken.approve(airdropPoolAddress, testAmount);
    await approveTx.wait();
    log('✅ 授权空投池使用小红花', 'green');
    
  } catch (error) {
    log(`⚠️  创建测试数据失败: ${error.message}`, 'yellow');
  }
}

// 运行测试
async function runTests(airdropPool, redFlowerTokenAddress, signer) {
  log('🧪 运行基本测试...', 'cyan');
  
  if (network.name === 'bsc') {
    log('⏭️  跳过主网测试', 'yellow');
    return;
  }
  
  try {
    // 测试 1: 查看当前轮次
    const currentRound = await airdropPool.getCurrentRound();
    log(`✅ 测试 1 通过: 当前轮次 ${currentRound.id}`, 'green');
    
    // 测试 2: 查看用户投入
    const userDeposit = await airdropPool.getUserCurrentDeposit(signer.address);
    log(`✅ 测试 2 通过: 用户投入 ${ethers.formatEther(userDeposit.amount)} 小红花`, 'green');
    
    // 测试 3: 小额投入测试
    const redFlowerToken = await ethers.getContractAt("IERC20", redFlowerTokenAddress, signer);
    const balance = await redFlowerToken.balanceOf(signer.address);
    
    if (balance > 0 && userDeposit.amount === 0n) {
      log('🧪 尝试小额投入测试...', 'yellow');
      const testDepositAmount = ethers.parseEther("10");
      
      try {
        const depositTx = await airdropPool.depositFlowers(testDepositAmount);
        await depositTx.wait();
        log('✅ 测试 3 通过: 小额投入成功', 'green');
      } catch (error) {
        log(`⚠️  测试 3 失败: ${error.message}`, 'yellow');
      }
    }
    
    log('✅ 基本测试完成', 'green');
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
  }
}

// 生成使用指南
function generateUsageGuide(deploymentInfo, contractStatus) {
  log('\n📖 使用指南:', 'bright');
  log('=' * 50, 'cyan');
  
  log('\n🔗 合约地址:', 'yellow');
  log(`空投池: ${deploymentInfo.airdropPool.proxy}`, 'yellow');
  log(`小红花代币: ${deploymentInfo.redFlowerToken}`, 'yellow');
  
  log('\n💻 前端集成:', 'yellow');
  log('1. 更新环境变量:', 'cyan');
  log(`   NEXT_PUBLIC_AIRDROP_POOL_ADDRESS=${deploymentInfo.airdropPool.proxy}`, 'cyan');
  log(`   NEXT_PUBLIC_RED_FLOWER_TOKEN_ADDRESS=${deploymentInfo.redFlowerToken}`, 'cyan');
  
  log('\n2. 导入组件:', 'cyan');
  log('   import { AirdropPoolCard } from "@/components/AirdropPool/AirdropPoolCard";', 'cyan');
  
  log('\n🤖 Telegram Bot:', 'yellow');
  log('1. 设置环境变量:', 'cyan');
  log('   TELEGRAM_BOT_TOKEN=your_bot_token', 'cyan');
  log('2. 启动 Bot:', 'cyan');
  log('   npm run telegram:start', 'cyan');
  
  log('\n📊 管理操作:', 'yellow');
  log('1. 分配奖励 (每周执行):', 'cyan');
  log(`   npx hardhat run scripts/distribute-rewards.js --network ${network.name}`, 'cyan');
  
  log('\n🔍 监控命令:', 'yellow');
  log('1. 查看状态:', 'cyan');
  log(`   npx hardhat run scripts/check-airdrop-status.js --network ${network.name}`, 'cyan');
  
  log('\n⚠️  重要提醒:', 'red');
  log('1. 定期向空投池转入 SM 代币', 'red');
  log('2. 每周执行奖励分配', 'red');
  log('3. 监控合约安全状态', 'red');
  log('4. 备份私钥和助记词', 'red');
}

// 主函数
async function main() {
  const networkName = network.name;
  
  log('🚀 初始化 SocioMint 空投池', 'bright');
  log(`📡 网络: ${networkName}`, 'blue');
  log('=' * 50, 'cyan');
  
  try {
    // 1. 获取部署信息
    const deploymentInfo = getDeploymentInfo(networkName);
    log('✅ 获取部署信息成功', 'green');
    
    // 2. 连接合约
    const [signer] = await ethers.getSigners();
    const airdropPool = await ethers.getContractAt(
      "AirdropPool", 
      deploymentInfo.airdropPool.proxy, 
      signer
    );
    
    log(`👤 操作者: ${signer.address}`, 'blue');
    
    // 3. 检查合约状态
    const contractStatus = await checkContractStatus(airdropPool);
    if (!contractStatus.isHealthy) {
      throw new Error(`合约状态异常: ${contractStatus.error}`);
    }
    
    // 4. 设置初始参数
    await setupInitialParameters(airdropPool, signer);
    
    // 5. 转入 SM 代币 (可选)
    const shouldFund = process.argv.includes('--fund');
    if (shouldFund) {
      const fundAmount = ethers.parseEther("10000000"); // 1000万 SM
      await fundAirdropPool(
        deploymentInfo.smTokenAddress || process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS,
        deploymentInfo.airdropPool.proxy,
        fundAmount,
        signer
      );
    }
    
    // 6. 创建测试数据 (测试网)
    const shouldCreateTestData = process.argv.includes('--test-data');
    if (shouldCreateTestData) {
      await createTestData(airdropPool, deploymentInfo.redFlowerToken, signer);
    }
    
    // 7. 运行测试 (测试网)
    const shouldRunTests = process.argv.includes('--run-tests');
    if (shouldRunTests) {
      await runTests(airdropPool, deploymentInfo.redFlowerToken, signer);
    }
    
    // 8. 最终状态检查
    log('🔍 最终状态检查...', 'cyan');
    const finalStatus = await checkContractStatus(airdropPool);
    
    if (finalStatus.isHealthy) {
      log('✅ 空投池初始化完成!', 'green');
      
      // 9. 生成使用指南
      generateUsageGuide(deploymentInfo, finalStatus);
      
    } else {
      throw new Error('初始化后状态检查失败');
    }
    
  } catch (error) {
    log(`❌ 初始化失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      log(`💥 初始化失败: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  main,
  checkContractStatus,
  fundAirdropPool,
  setupInitialParameters
};
