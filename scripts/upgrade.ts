import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

/**
 * 升级 SocioMint 核心合约
 * @dev 此脚本用于升级 SMToken 或 SMTokenExchange 合约
 */
async function main() {
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("使用部署账户地址:", deployer.address);
  console.log("部署账户余额:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // 请在此替换为已部署的代理合约地址
  const smTokenProxyAddress = process.env.SMTOKEN_PROXY_ADDRESS || "0xYourSMTokenProxyAddressHere";
  const smTokenExchangeProxyAddress = process.env.SMTOKENEXCHANGE_PROXY_ADDRESS || "0xYourSMTokenExchangeProxyAddressHere";

  // 选择要升级的合约
  // 默认升级交易所合约，可以通过环境变量指定升级代币合约
  // 使用 TARGET=token npm run upgrade 升级代币合约
  // 使用 TARGET=exchange npm run upgrade 升级交易所合约 (默认)
  const upgradeTarget = process.env.TARGET || "exchange";

  if (upgradeTarget.toLowerCase() === "token") {
    await upgradeSMToken(smTokenProxyAddress);
  } else {
    await upgradeSMTokenExchange(smTokenExchangeProxyAddress);
  }
}

/**
 * 升级 SMToken 合约
 * @param proxyAddress 代理合约地址
 */
async function upgradeSMToken(proxyAddress: string) {
  console.log("\n====================");
  console.log(`开始升级 SMToken 合约 (代理地址: ${proxyAddress})...`);

  // 获取新的实现合约工厂
  const SMTokenV2 = await ethers.getContractFactory("SMToken"); // 使用新版本的合约
  
  console.log("准备升级...");
  const upgradedToken = await upgrades.upgradeProxy(proxyAddress, SMTokenV2);
  
  console.log("等待交易确认...");
  await upgradedToken.deployed();
  
  // 验证升级成功
  console.log("SMToken 升级成功!");
  
  // 检查版本号 (如果合约有 getVersion 函数)
  try {
    const newVersion = await upgradedToken.getVersion();
    console.log("新版本:", newVersion);
  } catch (e) {
    console.log("无法读取版本号");
  }
  
  console.log("升级完成! 请验证合约功能是否正常工作。");
}

/**
 * 升级 SMTokenExchange 合约
 * @param proxyAddress 代理合约地址
 */
async function upgradeSMTokenExchange(proxyAddress: string) {
  console.log("\n====================");
  console.log(`开始升级 SMTokenExchange 合约 (代理地址: ${proxyAddress})...`);
  
  // 获取新的实现合约工厂
  const SMTokenExchangeV2 = await ethers.getContractFactory("SMTokenExchange"); // 使用新版本的合约
  
  console.log("准备升级...");
  const upgradedExchange = await upgrades.upgradeProxy(proxyAddress, SMTokenExchangeV2);
  
  console.log("等待交易确认...");
  await upgradedExchange.deployed();
  
  // 验证升级成功
  console.log("SMTokenExchange 升级成功!");
  
  // 获取交易所统计信息
  const exchangeStats = await upgradedExchange.getExchangeStats();
  console.log("\n交易所信息:");
  console.log("- 总代币数量:", exchangeStats.totalTokens.toString());
  console.log("- 剩余代币:", exchangeStats.remaining.toString());
  console.log("- 已售代币:", exchangeStats.totalExchanged.toString());
  console.log("- 已募集 BNB:", ethers.utils.formatEther(exchangeStats.totalRaised), "BNB");
  console.log("- 当前价格:", ethers.utils.formatUnits(exchangeStats.currentPriceScaled, 18), "BNB/SM");
  console.log("- 下一轮价格:", ethers.utils.formatUnits(exchangeStats.nextPriceScaled, 18), "BNB/SM");
  console.log("- 暂停状态:", exchangeStats.paused ? "暂停" : "活跃");
  console.log("- 当前轮次:", exchangeStats.currentRound.toString());
  
  console.log("升级完成! 请验证合约功能是否正常工作。");
}

// 处理错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 