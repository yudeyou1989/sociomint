const { ethers, upgrades, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 部署配置
const DEPLOYMENT_CONFIG = {
  bscTestnet: {
    weeklySmAmount: ethers.parseEther("5000000"), // 500万 SM
    roundDuration: 7 * 24 * 60 * 60, // 7天
    smTokenAddress: "0xd7d7dd989642222B6f685aF0220dc0065F489ae0",
    redFlowerTokenAddress: "0x0000000000000000000000000000000000000000", // 待部署
    gasPrice: ethers.parseUnits("10", "gwei"),
    gasLimit: 8000000
  },
  bsc: {
    weeklySmAmount: ethers.parseEther("5000000"), // 500万 SM
    roundDuration: 7 * 24 * 60 * 60, // 7天
    smTokenAddress: "0xd7d7dd989642222B6f685aF0220dc0065F489ae0",
    redFlowerTokenAddress: "0x0000000000000000000000000000000000000000", // 待部署
    gasPrice: ethers.parseUnits("5", "gwei"),
    gasLimit: 8000000
  },
  localhost: {
    weeklySmAmount: ethers.parseEther("5000000"),
    roundDuration: 60 * 60, // 1小时用于测试
    smTokenAddress: "0x0000000000000000000000000000000000000000",
    redFlowerTokenAddress: "0x0000000000000000000000000000000000000000",
    gasPrice: ethers.parseUnits("20", "gwei"),
    gasLimit: 8000000
  }
};

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

// 保存部署信息
function saveDeploymentInfo(networkName, deploymentData) {
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  const existingData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
  
  const updatedData = {
    ...existingData,
    ...deploymentData,
    lastUpdated: new Date().toISOString(),
    network: networkName
  };
  
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
  log(`✅ 部署信息已保存到: ${filePath}`, 'green');
}

// 验证合约
async function verifyContract(address, constructorArguments = []) {
  if (network.name === 'localhost' || network.name === 'hardhat') {
    log('⏭️  跳过本地网络的合约验证', 'yellow');
    return;
  }
  
  try {
    log(`🔍 验证合约: ${address}`, 'blue');
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    log(`✅ 合约验证成功: ${address}`, 'green');
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`✅ 合约已验证: ${address}`, 'green');
    } else {
      log(`❌ 合约验证失败: ${error.message}`, 'red');
    }
  }
}

// 部署小红花代币 (如果需要)
async function deployRedFlowerToken() {
  log('🌸 部署小红花代币...', 'cyan');
  
  const RedFlowerToken = await ethers.getContractFactory("RedFlowerToken");
  const redFlowerToken = await RedFlowerToken.deploy(
    "Red Flower Token",
    "RFT",
    ethers.parseEther("1000000000") // 10亿初始供应量
  );
  
  await redFlowerToken.waitForDeployment();
  const address = await redFlowerToken.getAddress();
  
  log(`✅ 小红花代币部署成功: ${address}`, 'green');
  
  // 验证合约
  await verifyContract(address, [
    "Red Flower Token",
    "RFT",
    ethers.parseEther("1000000000")
  ]);
  
  return address;
}

// 部署空投池合约
async function deployAirdropPool(config) {
  log('🎯 部署空投池合约...', 'cyan');
  
  const AirdropPool = await ethers.getContractFactory("AirdropPool");
  
  // 使用 UUPS 代理模式部署
  const airdropPool = await upgrades.deployProxy(
    AirdropPool,
    [
      config.smTokenAddress,
      config.redFlowerTokenAddress,
      config.weeklySmAmount,
      config.roundDuration
    ],
    {
      kind: 'uups',
      initializer: 'initialize',
      gasPrice: config.gasPrice,
      gasLimit: config.gasLimit
    }
  );
  
  await airdropPool.waitForDeployment();
  const proxyAddress = await airdropPool.getAddress();
  
  log(`✅ 空投池代理合约部署成功: ${proxyAddress}`, 'green');
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  log(`📋 实现合约地址: ${implementationAddress}`, 'blue');
  
  // 验证实现合约
  await verifyContract(implementationAddress);
  
  return {
    proxy: proxyAddress,
    implementation: implementationAddress,
    contract: airdropPool
  };
}

// 初始化空投池
async function initializeAirdropPool(airdropPool, config) {
  log('⚙️  初始化空投池配置...', 'cyan');
  
  try {
    // 检查是否已初始化
    const currentRound = await airdropPool.getCurrentRound();
    if (currentRound.id > 0) {
      log('✅ 空投池已初始化', 'green');
      return;
    }
  } catch (error) {
    // 继续初始化
  }
  
  // 设置池配置
  const tx = await airdropPool.setPoolConfig(
    config.weeklySmAmount,
    config.roundDuration,
    ethers.parseEther("10"), // 最小投入 10 小红花
    ethers.parseEther("10000") // 最大投入 10000 小红花
  );
  
  await tx.wait();
  log('✅ 空投池配置设置完成', 'green');
}

// 设置权限和角色
async function setupPermissions(airdropPool, deployer) {
  log('🔐 设置权限和角色...', 'cyan');
  
  // 检查当前所有者
  const currentOwner = await airdropPool.owner();
  log(`📋 当前所有者: ${currentOwner}`, 'blue');
  
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    log('⚠️  所有者地址不匹配，请检查部署配置', 'yellow');
  }
  
  log('✅ 权限设置完成', 'green');
}

// 主部署函数
async function main() {
  const networkName = network.name;
  const config = DEPLOYMENT_CONFIG[networkName];
  
  if (!config) {
    throw new Error(`❌ 不支持的网络: ${networkName}`);
  }
  
  log('🚀 开始部署 SocioMint 空投池', 'bright');
  log(`📡 网络: ${networkName}`, 'blue');
  log('=' * 50, 'cyan');
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  const balance = await ethers.provider.getBalance(deployerAddress);
  
  log(`👤 部署者: ${deployerAddress}`, 'blue');
  log(`💰 余额: ${ethers.formatEther(balance)} ${networkName === 'bsc' || networkName === 'bscTestnet' ? 'BNB' : 'ETH'}`, 'blue');
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error('❌ 部署者余额不足，至少需要 0.1 ETH/BNB');
  }
  
  const deploymentData = {
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    networkName: networkName,
    gasPrice: config.gasPrice.toString(),
    gasLimit: config.gasLimit
  };
  
  try {
    // 1. 部署小红花代币 (如果需要)
    if (config.redFlowerTokenAddress === "0x0000000000000000000000000000000000000000") {
      const redFlowerAddress = await deployRedFlowerToken();
      config.redFlowerTokenAddress = redFlowerAddress;
      deploymentData.redFlowerToken = redFlowerAddress;
    } else {
      log(`📋 使用现有小红花代币: ${config.redFlowerTokenAddress}`, 'blue');
      deploymentData.redFlowerToken = config.redFlowerTokenAddress;
    }
    
    // 2. 部署空投池合约
    const airdropPoolDeployment = await deployAirdropPool(config);
    deploymentData.airdropPool = {
      proxy: airdropPoolDeployment.proxy,
      implementation: airdropPoolDeployment.implementation
    };
    
    // 3. 初始化空投池
    await initializeAirdropPool(airdropPoolDeployment.contract, config);
    
    // 4. 设置权限
    await setupPermissions(airdropPoolDeployment.contract, deployer);
    
    // 5. 验证部署
    log('🔍 验证部署结果...', 'cyan');
    const currentRound = await airdropPoolDeployment.contract.getCurrentRound();
    const poolConfig = await airdropPoolDeployment.contract.poolConfig();
    
    log(`✅ 当前轮次 ID: ${currentRound.id}`, 'green');
    log(`✅ 每周奖励: ${ethers.formatEther(poolConfig.weeklySmAmount)} SM`, 'green');
    log(`✅ 轮次持续时间: ${poolConfig.roundDuration} 秒`, 'green');
    
    // 6. 保存部署信息
    saveDeploymentInfo(networkName, deploymentData);
    
    // 7. 输出部署总结
    log('\n🎉 部署完成!', 'bright');
    log('=' * 50, 'cyan');
    log(`📋 空投池代理地址: ${airdropPoolDeployment.proxy}`, 'green');
    log(`📋 空投池实现地址: ${airdropPoolDeployment.implementation}`, 'green');
    log(`📋 小红花代币地址: ${config.redFlowerTokenAddress}`, 'green');
    log(`📋 SM 代币地址: ${config.smTokenAddress}`, 'green');
    
    // 8. 输出环境变量配置
    log('\n📝 环境变量配置:', 'yellow');
    log(`NEXT_PUBLIC_AIRDROP_POOL_ADDRESS=${airdropPoolDeployment.proxy}`, 'yellow');
    log(`NEXT_PUBLIC_RED_FLOWER_TOKEN_ADDRESS=${config.redFlowerTokenAddress}`, 'yellow');
    
    // 9. 输出验证命令
    if (networkName !== 'localhost' && networkName !== 'hardhat') {
      log('\n🔍 验证命令:', 'yellow');
      log(`npx hardhat verify --network ${networkName} ${airdropPoolDeployment.implementation}`, 'yellow');
    }
    
    // 10. 输出后续步骤
    log('\n📋 后续步骤:', 'cyan');
    log('1. 更新前端环境变量', 'cyan');
    log('2. 向空投池转入 SM 代币', 'cyan');
    log('3. 测试投入和领取功能', 'cyan');
    log('4. 启动第一轮空投', 'cyan');
    
  } catch (error) {
    log(`❌ 部署失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`💥 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      log(`💥 部署失败: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  main,
  deployAirdropPool,
  deployRedFlowerToken,
  verifyContract
};
