import { ethers, upgrades } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

/**
 * 部署 SocioMint 核心合约
 * @dev 这个脚本部署 SMToken 和 SMTokenExchange 可升级合约 (UUPS)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用部署账户地址:", deployer.address);
  console.log("部署账户余额:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // 配置参数
  // 团队钱包/DAO 资金池地址 - 优先使用环境变量
  const fundReceiverAddress = process.env.FUND_RECEIVER_ADDRESS || "0xYourFundReceiverAddressHere"; // TODO: 替换为实际地址
  console.log("资金接收地址:", fundReceiverAddress);
  
  // Exchange 参数
  const initialBnbPerSmPriceScaled = "833000"; // 0.000000833 BNB/SM
  const priceIncrementBnbPerSmScaled = "141900"; // 每轮增加 0.0000001419 BNB/SM

  console.log("\n====================");
  console.log("开始部署 SMToken...");
  
  // 1. 部署 SMToken 合约
  const SMToken = await ethers.getContractFactory("SMToken");
  
  console.log("部署 SMToken 代理...");
  const smToken = await upgrades.deployProxy(SMToken, [], {
    kind: "uups",
    initializer: "initialize",
  });

  console.log("等待 SMToken 部署确认...");
  await smToken.deployed();
  console.log("SMToken 已部署到地址:", smToken.address);

  // 检查部署者余额 (应该是 10亿 SM)
  const tokenDecimals = await smToken.decimals();
  const deployerBalance = await smToken.balanceOf(deployer.address);
  console.log(
    "部署者 SM 代币余额:",
    ethers.utils.formatUnits(deployerBalance, tokenDecimals)
  );

  console.log("\n====================");
  console.log("开始部署 SMTokenExchange...");
  
  // 2. 部署 SMTokenExchange 合约
  const SMTokenExchange = await ethers.getContractFactory("SMTokenExchange");
  
  console.log("部署 SMTokenExchange 代理...");
  const smTokenExchange = await upgrades.deployProxy(
    SMTokenExchange,
    [
      smToken.address,                 // SMToken 地址
      fundReceiverAddress,             // 资金接收地址
      initialBnbPerSmPriceScaled,      // 初始价格 (scaled)
      priceIncrementBnbPerSmScaled,    // 价格增量 (scaled)
      deployer.address                 // 管理员地址
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  console.log("等待 SMTokenExchange 部署确认...");
  await smTokenExchange.deployed();
  console.log("SMTokenExchange 已部署到地址:", smTokenExchange.address);

  // 3. 将部分代币转移到交易所合约
  // 计算交易所所需的代币数量 (1亿 SM)
  const tokenExchangeAmount = ethers.utils.parseUnits("100000000", tokenDecimals);
  console.log("\n为交易所合约提供 SM 代币...");
  const transferTx = await smToken.transfer(smTokenExchange.address, tokenExchangeAmount);
  await transferTx.wait();
  console.log(`已转移 ${ethers.utils.formatUnits(tokenExchangeAmount, tokenDecimals)} SM 到交易所合约`);

  // 4. 验证部署成功
  const exchangeSmBalance = await smToken.balanceOf(smTokenExchange.address);
  console.log(
    "交易所合约 SM 代币余额:",
    ethers.utils.formatUnits(exchangeSmBalance, tokenDecimals)
  );

  // 5. 获取交易所统计信息
  const exchangeStats = await smTokenExchange.getExchangeStats();
  console.log("\n====================");
  console.log("交易所信息:");
  console.log("- 总代币数量:", ethers.utils.formatUnits(exchangeStats.totalTokens, tokenDecimals));
  console.log("- 剩余代币:", ethers.utils.formatUnits(exchangeStats.remaining, tokenDecimals));
  console.log("- 当前价格:", ethers.utils.formatUnits(exchangeStats.currentPriceScaled, 18), "BNB/SM");
  console.log("- 下一轮价格:", ethers.utils.formatUnits(exchangeStats.nextPriceScaled, 18), "BNB/SM");
  console.log("- 暂停状态:", exchangeStats.paused ? "暂停" : "活跃");
  console.log("- 当前轮次:", exchangeStats.currentRound.toString());
  console.log("- 最小购买金额:", ethers.utils.formatEther(exchangeStats.minPurchaseBNB), "BNB");
  console.log("- 每用户最大购买金额:", ethers.utils.formatEther(exchangeStats.maxPurchaseBNBPerUser), "BNB");

  console.log("\n====================");
  console.log("部署后续步骤:");
  console.log("1. 验证合约 (使用 Etherscan / BSCscan)");
  console.log(`npx hardhat verify --network mainnet ${smToken.address}`);
  console.log(`npx hardhat verify --network mainnet ${smTokenExchange.address}`);
  console.log("2. 将 SMToken 和 SMTokenExchange 的管理权限转移给多签钱包");
  console.log("3. 通过 verifyUser() 函数验证用户，使他们能够参与代币兑换");
  console.log("====================");

  // 将合约地址保存到控制台，便于复制
  console.log("\n部署摘要 (复制保存):");
  console.log(`SMToken: ${smToken.address}`);
  console.log(`SMTokenExchange: ${smTokenExchange.address}`);
  console.log(`部署者: ${deployer.address}`);
  console.log(`资金接收地址: ${fundReceiverAddress}`);
}

// 处理错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 