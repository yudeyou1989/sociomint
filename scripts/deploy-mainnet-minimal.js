/**
 * 主网精简合约部署脚本
 * 部署SMTokenMinimal和SMBNBExchangeMinimal合约
 * 优化Gas费用，只包含核心功能
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 配置参数
const DEPLOYMENT_CONFIG = {
  // 多签钱包地址 (需要替换为实际的多签钱包地址)
  MULTISIG_WALLET: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9", // 示例地址，需要替换
  
  // 国库钱包地址 (用于接收BNB)
  TREASURY_WALLET: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9", // 示例地址，需要替换
  
  // Gas配置
  GAS_PRICE: ethers.parseUnits("5", "gwei"), // 5 Gwei
  GAS_LIMIT: 3000000, // 3M Gas limit
  
  // 验证延迟
  VERIFICATION_DELAY: 30000, // 30秒
};

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// 等待函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 保存部署信息
function saveDeploymentInfo(deploymentInfo) {
  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filename = `mainnet-minimal-${Date.now()}.json`;
  const filepath = path.join(deploymentPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  log(`部署信息已保存到: ${filepath}`, 'success');
  
  // 同时更新最新部署信息
  const latestPath = path.join(deploymentPath, 'mainnet-minimal-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
}

// 验证合约
async function verifyContract(address, constructorArguments, contractPath) {
  try {
    log(`开始验证合约: ${address}`, 'info');
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
      contract: contractPath
    });
    
    log(`✅ 合约验证成功: ${address}`, 'success');
    return true;
  } catch (error) {
    if (error.message.includes("already verified")) {
      log(`合约已验证: ${address}`, 'warning');
      return true;
    } else {
      log(`❌ 合约验证失败: ${error.message}`, 'error');
      return false;
    }
  }
}

// 主部署函数
async function main() {
  log("🚀 开始主网精简合约部署", 'info');
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);
  
  log(`部署账户: ${deployerAddress}`, 'info');
  log(`账户余额: ${ethers.formatEther(deployerBalance)} BNB`, 'info');
  
  // 检查余额是否足够
  const estimatedGasCost = DEPLOYMENT_CONFIG.GAS_PRICE * BigInt(DEPLOYMENT_CONFIG.GAS_LIMIT) * 2n; // 两个合约
  if (deployerBalance < estimatedGasCost) {
    log(`❌ 余额不足，预估需要: ${ethers.formatEther(estimatedGasCost)} BNB`, 'error');
    process.exit(1);
  }
  
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployerAddress,
    deployerBalance: ethers.formatEther(deployerBalance),
    timestamp: new Date().toISOString(),
    gasPrice: ethers.formatUnits(DEPLOYMENT_CONFIG.GAS_PRICE, "gwei") + " Gwei",
    contracts: {}
  };
  
  try {
    // 1. 部署SMTokenMinimal
    log("\n📝 部署SMTokenMinimal合约...", 'info');
    
    const SMTokenMinimal = await ethers.getContractFactory("SMTokenMinimal");
    const smToken = await SMTokenMinimal.deploy(
      DEPLOYMENT_CONFIG.MULTISIG_WALLET,
      {
        gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE,
        gasLimit: DEPLOYMENT_CONFIG.GAS_LIMIT
      }
    );
    
    await smToken.waitForDeployment();
    const smTokenAddress = await smToken.getAddress();
    
    log(`✅ SMTokenMinimal部署成功: ${smTokenAddress}`, 'success');
    
    // 获取部署交易信息
    const smTokenDeployTx = smToken.deploymentTransaction();
    const smTokenReceipt = await smTokenDeployTx.wait();
    
    deploymentInfo.contracts.SMTokenMinimal = {
      address: smTokenAddress,
      deploymentTx: smTokenDeployTx.hash,
      gasUsed: smTokenReceipt.gasUsed.toString(),
      gasCost: ethers.formatEther(smTokenReceipt.gasUsed * smTokenDeployTx.gasPrice),
      constructorArgs: [DEPLOYMENT_CONFIG.MULTISIG_WALLET]
    };
    
    log(`Gas使用: ${smTokenReceipt.gasUsed.toString()}`, 'info');
    log(`Gas费用: ${ethers.formatEther(smTokenReceipt.gasUsed * smTokenDeployTx.gasPrice)} BNB`, 'info');
    
    // 2. 部署SMBNBExchangeMinimal
    log("\n📝 部署SMBNBExchangeMinimal合约...", 'info');
    
    const SMBNBExchangeMinimal = await ethers.getContractFactory("SMBNBExchangeMinimal");
    const smBnbExchange = await SMBNBExchangeMinimal.deploy(
      smTokenAddress,
      DEPLOYMENT_CONFIG.TREASURY_WALLET,
      {
        gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE,
        gasLimit: DEPLOYMENT_CONFIG.GAS_LIMIT
      }
    );
    
    await smBnbExchange.waitForDeployment();
    const smBnbExchangeAddress = await smBnbExchange.getAddress();
    
    log(`✅ SMBNBExchangeMinimal部署成功: ${smBnbExchangeAddress}`, 'success');
    
    // 获取部署交易信息
    const exchangeDeployTx = smBnbExchange.deploymentTransaction();
    const exchangeReceipt = await exchangeDeployTx.wait();
    
    deploymentInfo.contracts.SMBNBExchangeMinimal = {
      address: smBnbExchangeAddress,
      deploymentTx: exchangeDeployTx.hash,
      gasUsed: exchangeReceipt.gasUsed.toString(),
      gasCost: ethers.formatEther(exchangeReceipt.gasUsed * exchangeDeployTx.gasPrice),
      constructorArgs: [smTokenAddress, DEPLOYMENT_CONFIG.TREASURY_WALLET]
    };
    
    log(`Gas使用: ${exchangeReceipt.gasUsed.toString()}`, 'info');
    log(`Gas费用: ${ethers.formatEther(exchangeReceipt.gasUsed * exchangeDeployTx.gasPrice)} BNB`, 'info');
    
    // 3. 初始化设置
    log("\n⚙️ 执行初始化设置...", 'info');
    
    // 触发首次解锁 (设置初始价格为0.000333美元，约0.0000005 BNB)
    const initialPriceInWei = ethers.parseUnits("0.0000005", 18); // 0.0000005 BNB per SM
    log(`触发首次解锁，初始价格: ${ethers.formatEther(initialPriceInWei)} BNB per SM`, 'info');
    
    const unlockTx = await smToken.triggerUnlock(initialPriceInWei, {
      gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE
    });
    await unlockTx.wait();
    
    log(`✅ 首次解锁完成`, 'success');
    
    // 向兑换合约转入SM代币 (3000万枚)
    const smAmountForExchange = ethers.parseUnits("30000000", 18); // 3000万SM
    log(`向兑换合约转入SM代币: ${ethers.formatUnits(smAmountForExchange, 18)} SM`, 'info');
    
    const transferTx = await smToken.transfer(smBnbExchangeAddress, smAmountForExchange, {
      gasPrice: DEPLOYMENT_CONFIG.GAS_PRICE
    });
    await transferTx.wait();
    
    log(`✅ SM代币转入完成`, 'success');
    
    // 4. 计算总费用
    const totalGasUsed = smTokenReceipt.gasUsed + exchangeReceipt.gasUsed;
    const totalGasCost = ethers.formatEther(totalGasUsed * DEPLOYMENT_CONFIG.GAS_PRICE);
    
    deploymentInfo.summary = {
      totalGasUsed: totalGasUsed.toString(),
      totalGasCost: totalGasCost + " BNB",
      deploymentSuccess: true
    };
    
    log(`\n📊 部署总结:`, 'success');
    log(`总Gas使用: ${totalGasUsed.toString()}`, 'info');
    log(`总Gas费用: ${totalGasCost} BNB`, 'info');
    
    // 5. 保存部署信息
    saveDeploymentInfo(deploymentInfo);
    
    // 6. 合约验证 (如果在主网或测试网)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      log(`\n🔍 等待 ${DEPLOYMENT_CONFIG.VERIFICATION_DELAY / 1000} 秒后开始验证合约...`, 'info');
      await sleep(DEPLOYMENT_CONFIG.VERIFICATION_DELAY);
      
      // 验证SMTokenMinimal
      await verifyContract(
        smTokenAddress,
        [DEPLOYMENT_CONFIG.MULTISIG_WALLET],
        "contracts/mainnet/SMTokenMinimal.sol:SMTokenMinimal"
      );
      
      // 验证SMBNBExchangeMinimal
      await verifyContract(
        smBnbExchangeAddress,
        [smTokenAddress, DEPLOYMENT_CONFIG.TREASURY_WALLET],
        "contracts/mainnet/SMBNBExchangeMinimal.sol:SMBNBExchangeMinimal"
      );
    }
    
    // 7. 输出重要信息
    log("\n🎉 主网精简合约部署完成!", 'success');
    log("\n📋 重要信息:", 'info');
    log(`SMTokenMinimal: ${smTokenAddress}`, 'success');
    log(`SMBNBExchangeMinimal: ${smBnbExchangeAddress}`, 'success');
    log(`多签钱包: ${DEPLOYMENT_CONFIG.MULTISIG_WALLET}`, 'info');
    log(`国库钱包: ${DEPLOYMENT_CONFIG.TREASURY_WALLET}`, 'info');
    
    log("\n⚠️ 下一步操作:", 'warning');
    log("1. 更新前端配置文件中的合约地址", 'warning');
    log("2. 验证多签钱包和国库钱包地址正确", 'warning');
    log("3. 测试兑换功能", 'warning');
    log("4. 设置价格监控系统", 'warning');
    
  } catch (error) {
    log(`❌ 部署失败: ${error.message}`, 'error');
    
    deploymentInfo.error = {
      message: error.message,
      stack: error.stack
    };
    deploymentInfo.summary = {
      deploymentSuccess: false
    };
    
    saveDeploymentInfo(deploymentInfo);
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`未处理的错误: ${error.message}`, 'error');
  process.exit(1);
});

// 执行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      log(`部署脚本执行失败: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { main, DEPLOYMENT_CONFIG };
