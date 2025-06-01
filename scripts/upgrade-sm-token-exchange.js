const { ethers, upgrades, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 部署配置
const DEPLOYMENT_CONFIG = {
  bscTestnet: {
    proxyAddress: "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E", // 现有代理地址
    gasPrice: ethers.parseUnits("10", "gwei"),
    gasLimit: 8000000
  },
  bsc: {
    proxyAddress: "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E", // 现有代理地址
    gasPrice: ethers.parseUnits("5", "gwei"),
    gasLimit: 8000000
  },
  localhost: {
    proxyAddress: "0x0000000000000000000000000000000000000000", // 本地测试
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
function saveUpgradeInfo(networkName, upgradeData) {
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  const existingData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
  
  const updatedData = {
    ...existingData,
    smTokenExchangeV2: upgradeData,
    lastUpgraded: new Date().toISOString(),
    network: networkName
  };
  
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
  log(`✅ 升级信息已保存到: ${filePath}`, 'green');
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

// 检查现有合约状态
async function checkCurrentContract(proxyAddress) {
  log('🔍 检查现有合约状态...', 'cyan');
  
  try {
    const contract = await ethers.getContractAt("SMTokenExchange", proxyAddress);
    
    // 检查基本信息
    const contractInfo = await contract.getContractInfo();
    log(`📋 SM Token: ${contractInfo.smTokenAddress}`, 'blue');
    log(`📋 Red Flower Token: ${contractInfo.redFlowerTokenAddress}`, 'blue');
    log(`📋 Exchange Rate: ${contractInfo.currentExchangeRate}`, 'blue');
    log(`📋 Total Exchanged: ${ethers.formatEther(contractInfo.totalExchangedAmount)} SM`, 'blue');
    
    // 检查是否已有每日奖励功能
    try {
      const dailyConfig = await contract.getDailyRewardConfig();
      log(`⚠️  合约已包含每日奖励功能`, 'yellow');
      log(`📋 每500SM奖励: ${dailyConfig._flowersPer500Sm}`, 'blue');
      log(`📋 每日最大奖励: ${dailyConfig._maxDailyFlowersPerUser}`, 'blue');
      return { hasDaily: true, contractInfo };
    } catch (error) {
      log(`📋 合约未包含每日奖励功能，需要升级`, 'blue');
      return { hasDaily: false, contractInfo };
    }
    
  } catch (error) {
    log(`❌ 检查现有合约失败: ${error.message}`, 'red');
    throw error;
  }
}

// 升级合约到 V2
async function upgradeToV2(config) {
  log('🚀 升级合约到 V2 版本...', 'cyan');
  
  const SMTokenExchangeV2 = await ethers.getContractFactory("SMTokenExchangeV2");
  
  try {
    // 执行升级
    const upgradedContract = await upgrades.upgradeProxy(
      config.proxyAddress,
      SMTokenExchangeV2,
      {
        gasPrice: config.gasPrice,
        gasLimit: config.gasLimit
      }
    );
    
    await upgradedContract.waitForDeployment();
    const proxyAddress = await upgradedContract.getAddress();
    
    log(`✅ 合约升级成功: ${proxyAddress}`, 'green');
    
    // 获取新的实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    log(`📋 新实现合约地址: ${implementationAddress}`, 'blue');
    
    return {
      proxy: proxyAddress,
      implementation: implementationAddress,
      contract: upgradedContract
    };
    
  } catch (error) {
    log(`❌ 合约升级失败: ${error.message}`, 'red');
    throw error;
  }
}

// 验证升级后的功能
async function verifyUpgrade(contract) {
  log('🔍 验证升级后的功能...', 'cyan');
  
  try {
    // 检查每日奖励配置
    const dailyConfig = await contract.getDailyRewardConfig();
    log(`✅ 每日奖励配置: ${dailyConfig._flowersPer500Sm} 小红花/500SM`, 'green');
    log(`✅ 最大每日奖励: ${dailyConfig._maxDailyFlowersPerUser} 小红花`, 'green');
    log(`✅ 领取间隔: ${dailyConfig._dailyClaimInterval} 秒`, 'green');
    
    // 检查合约基本信息
    const contractInfo = await contract.getContractInfo();
    log(`✅ 合约信息获取正常`, 'green');
    
    // 测试用户奖励信息查询（使用零地址）
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const userInfo = await contract.getUserDailyRewardInfo(zeroAddress);
    log(`✅ 用户奖励信息查询正常`, 'green');
    
    return true;
    
  } catch (error) {
    log(`❌ 功能验证失败: ${error.message}`, 'red');
    return false;
  }
}

// 设置初始配置
async function setupInitialConfig(contract, deployer) {
  log('⚙️  设置初始配置...', 'cyan');
  
  try {
    // 检查当前配置
    const currentConfig = await contract.getDailyRewardConfig();
    
    if (currentConfig._flowersPer500Sm > 0) {
      log('✅ 每日奖励配置已存在，跳过初始化', 'green');
      return;
    }
    
    // 设置每日奖励配置
    const tx = await contract.setDailyRewardConfig(
      10,   // 每 500 SM 获得 10 小红花
      200   // 每日最多 200 小红花
    );
    
    await tx.wait();
    log('✅ 每日奖励配置设置完成', 'green');
    
  } catch (error) {
    log(`❌ 初始配置失败: ${error.message}`, 'red');
    throw error;
  }
}

// 主升级函数
async function main() {
  const networkName = network.name;
  const config = DEPLOYMENT_CONFIG[networkName];
  
  if (!config) {
    throw new Error(`❌ 不支持的网络: ${networkName}`);
  }
  
  if (!config.proxyAddress || config.proxyAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error(`❌ 请先配置 ${networkName} 网络的代理合约地址`);
  }
  
  log('🚀 开始升级 SMTokenExchange 到 V2', 'bright');
  log(`📡 网络: ${networkName}`, 'blue');
  log(`📋 代理地址: ${config.proxyAddress}`, 'blue');
  log('=' * 50, 'cyan');
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  const balance = await ethers.provider.getBalance(deployerAddress);
  
  log(`👤 部署者: ${deployerAddress}`, 'blue');
  log(`💰 余额: ${ethers.formatEther(balance)} ${networkName === 'bsc' || networkName === 'bscTestnet' ? 'BNB' : 'ETH'}`, 'blue');
  
  if (balance < ethers.parseEther("0.05")) {
    throw new Error('❌ 部署者余额不足，至少需要 0.05 ETH/BNB');
  }
  
  const upgradeData = {
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    networkName: networkName,
    gasPrice: config.gasPrice.toString(),
    gasLimit: config.gasLimit
  };
  
  try {
    // 1. 检查现有合约状态
    const currentStatus = await checkCurrentContract(config.proxyAddress);
    
    if (currentStatus.hasDaily) {
      log('⚠️  合约已包含每日奖励功能，是否继续升级？', 'yellow');
      // 在生产环境中，这里应该有用户确认步骤
    }
    
    // 2. 执行升级
    const upgradeResult = await upgradeToV2(config);
    upgradeData.smTokenExchangeV2 = {
      proxy: upgradeResult.proxy,
      implementation: upgradeResult.implementation
    };
    
    // 3. 验证升级
    const verificationResult = await verifyUpgrade(upgradeResult.contract);
    if (!verificationResult) {
      throw new Error('升级后功能验证失败');
    }
    
    // 4. 设置初始配置
    await setupInitialConfig(upgradeResult.contract, deployer);
    
    // 5. 验证实现合约
    await verifyContract(upgradeResult.implementation);
    
    // 6. 保存升级信息
    saveUpgradeInfo(networkName, upgradeData);
    
    // 7. 输出升级总结
    log('\n🎉 升级完成!', 'bright');
    log('=' * 50, 'cyan');
    log(`📋 代理地址: ${upgradeResult.proxy}`, 'green');
    log(`📋 新实现地址: ${upgradeResult.implementation}`, 'green');
    
    // 8. 输出环境变量配置
    log('\n📝 环境变量配置:', 'yellow');
    log(`NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS=${upgradeResult.proxy}`, 'yellow');
    
    // 9. 输出验证命令
    if (networkName !== 'localhost' && networkName !== 'hardhat') {
      log('\n🔍 验证命令:', 'yellow');
      log(`npx hardhat verify --network ${networkName} ${upgradeResult.implementation}`, 'yellow');
    }
    
    // 10. 输出后续步骤
    log('\n📋 后续步骤:', 'cyan');
    log('1. 更新前端 ABI 文件', 'cyan');
    log('2. 更新环境变量', 'cyan');
    log('3. 测试每日奖励功能', 'cyan');
    log('4. 部署数据库迁移', 'cyan');
    log('5. 更新 Telegram Bot', 'cyan');
    
    // 11. 输出新功能说明
    log('\n🌟 新增功能:', 'cyan');
    log('- claimDailyFlowers(): 领取每日奖励', 'cyan');
    log('- getDailyFlowerAmount(address): 查询可领取数量', 'cyan');
    log('- getUserDailyRewardInfo(address): 获取用户奖励信息', 'cyan');
    log('- setDailyRewardConfig(): 管理员设置奖励配置', 'cyan');
    
  } catch (error) {
    log(`❌ 升级失败: ${error.message}`, 'red');
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

// 运行升级
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      log(`💥 升级失败: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  main,
  upgradeToV2,
  verifyContract,
  checkCurrentContract
};
