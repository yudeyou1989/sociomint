/**
 * BSC主网部署脚本
 * 部署SM代币和交换合约到BSC主网
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 部署配置
const DEPLOYMENT_CONFIG = {
  // SM代币配置
  token: {
    name: "SocioMint",
    symbol: "SM",
    initialSupply: ethers.parseEther("1000000000"), // 10亿代币
    decimals: 18
  },
  
  // 交换合约配置
  exchange: {
    initialPrice: ethers.parseEther("0.000000833"), // 初始价格 0.000000833 BNB/SM
    priceIncrement: ethers.parseEther("0.0000001419"), // 每轮价格增量
    maxTokensPerRound: ethers.parseEther("1000000"), // 每轮最大代币数
  },
  
  // 多签钱包地址
  multisigWallet: "0x681E8E1921778A450930Bc1991c93981FD0B1F24",
  
  // Gas配置
  gasLimit: 3000000,
  gasPrice: ethers.parseUnits("5", "gwei"), // 5 Gwei
};

async function main() {
  console.log("🚀 开始部署到BSC主网...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  
  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.05")) {
    throw new Error("❌ 账户余额不足，至少需要0.05 BNB用于部署 (降低了要求)");
  }
  
  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log("🌐 网络:", network.name, "Chain ID:", network.chainId.toString());
  
  if (network.chainId !== 56n) {
    throw new Error("❌ 请确保连接到BSC主网 (Chain ID: 56)");
  }
  
  console.log("\n=== 开始部署合约 ===\n");
  
  // 1. 部署SM代币合约
  console.log("📦 部署SM代币合约...");
  const SMToken = await ethers.getContractFactory("SMToken");
  const smToken = await SMToken.deploy(
    DEPLOYMENT_CONFIG.token.name,
    DEPLOYMENT_CONFIG.token.symbol,
    DEPLOYMENT_CONFIG.token.initialSupply,
    {
      gasLimit: DEPLOYMENT_CONFIG.gasLimit,
      gasPrice: DEPLOYMENT_CONFIG.gasPrice
    }
  );
  
  await smToken.waitForDeployment();
  const smTokenAddress = await smToken.getAddress();
  console.log("✅ SM代币合约部署成功:", smTokenAddress);
  
  // 2. 部署交换合约
  console.log("📦 部署SM代币交换合约...");
  const SMTokenExchange = await ethers.getContractFactory("SMTokenExchange");
  const smTokenExchange = await SMTokenExchange.deploy(
    smTokenAddress,
    DEPLOYMENT_CONFIG.exchange.initialPrice,
    DEPLOYMENT_CONFIG.exchange.priceIncrement,
    DEPLOYMENT_CONFIG.exchange.maxTokensPerRound,
    {
      gasLimit: DEPLOYMENT_CONFIG.gasLimit,
      gasPrice: DEPLOYMENT_CONFIG.gasPrice
    }
  );
  
  await smTokenExchange.waitForDeployment();
  const smTokenExchangeAddress = await smTokenExchange.getAddress();
  console.log("✅ SM代币交换合约部署成功:", smTokenExchangeAddress);
  
  // 3. 配置合约权限
  console.log("🔧 配置合约权限...");
  
  // 将代币的铸造权限转移给交换合约
  const transferTx = await smToken.transfer(
    smTokenExchangeAddress,
    DEPLOYMENT_CONFIG.token.initialSupply,
    {
      gasLimit: 100000,
      gasPrice: DEPLOYMENT_CONFIG.gasPrice
    }
  );
  await transferTx.wait();
  console.log("✅ 代币转移到交换合约完成");
  
  // 4. 转移所有权到多签钱包
  console.log("🔐 转移合约所有权到多签钱包...");
  
  const transferOwnershipTx1 = await smToken.transferOwnership(
    DEPLOYMENT_CONFIG.multisigWallet,
    {
      gasLimit: 100000,
      gasPrice: DEPLOYMENT_CONFIG.gasPrice
    }
  );
  await transferOwnershipTx1.wait();
  console.log("✅ SM代币合约所有权转移完成");
  
  const transferOwnershipTx2 = await smTokenExchange.transferOwnership(
    DEPLOYMENT_CONFIG.multisigWallet,
    {
      gasLimit: 100000,
      gasPrice: DEPLOYMENT_CONFIG.gasPrice
    }
  );
  await transferOwnershipTx2.wait();
  console.log("✅ 交换合约所有权转移完成");
  
  // 5. 保存部署信息
  const deploymentInfo = {
    network: "BSC Mainnet",
    chainId: 56,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: {
      SMToken: {
        address: smTokenAddress,
        name: DEPLOYMENT_CONFIG.token.name,
        symbol: DEPLOYMENT_CONFIG.token.symbol,
        initialSupply: DEPLOYMENT_CONFIG.token.initialSupply.toString(),
      },
      SMTokenExchange: {
        address: smTokenExchangeAddress,
        initialPrice: DEPLOYMENT_CONFIG.exchange.initialPrice.toString(),
        priceIncrement: DEPLOYMENT_CONFIG.exchange.priceIncrement.toString(),
        maxTokensPerRound: DEPLOYMENT_CONFIG.exchange.maxTokensPerRound.toString(),
      }
    },
    multisigWallet: DEPLOYMENT_CONFIG.multisigWallet,
    gasUsed: {
      gasPrice: DEPLOYMENT_CONFIG.gasPrice.toString(),
      gasLimit: DEPLOYMENT_CONFIG.gasLimit,
    }
  };
  
  // 保存到文件
  const deploymentPath = path.join(__dirname, '../deployments/mainnet-deployment.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n=== 部署完成 ===\n");
  console.log("📄 部署信息已保存到:", deploymentPath);
  console.log("\n📋 合约地址:");
  console.log("🪙 SM代币合约:", smTokenAddress);
  console.log("🔄 SM代币交换合约:", smTokenExchangeAddress);
  console.log("🔐 多签钱包:", DEPLOYMENT_CONFIG.multisigWallet);
  
  console.log("\n🔍 验证合约命令:");
  console.log(`npx hardhat verify --network bsc ${smTokenAddress} "${DEPLOYMENT_CONFIG.token.name}" "${DEPLOYMENT_CONFIG.token.symbol}" "${DEPLOYMENT_CONFIG.token.initialSupply}"`);
  console.log(`npx hardhat verify --network bsc ${smTokenExchangeAddress} "${smTokenAddress}" "${DEPLOYMENT_CONFIG.exchange.initialPrice}" "${DEPLOYMENT_CONFIG.exchange.priceIncrement}" "${DEPLOYMENT_CONFIG.exchange.maxTokensPerRound}"`);
  
  console.log("\n✅ 主网部署成功完成!");
  
  return {
    smToken: smTokenAddress,
    smTokenExchange: smTokenExchangeAddress,
    multisigWallet: DEPLOYMENT_CONFIG.multisigWallet
  };
}

// 错误处理
main()
  .then((addresses) => {
    console.log("\n🎉 所有合约部署成功!");
    console.log("合约地址:", addresses);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
