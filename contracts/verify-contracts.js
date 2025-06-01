// 验证合约脚本 (verify-contracts.js)
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=== 开始验证合约 ===");
  
  // 从环境变量中获取合约地址
  const smTokenAddress = process.env.SM_TOKEN_ADDRESS;
  const smTokenExchangeImplementationAddress = process.env.SM_TOKEN_EXCHANGE_IMPLEMENTATION;
  
  if (!smTokenAddress) {
    console.log("⚠️ 未设置SM_TOKEN_ADDRESS环境变量");
    return;
  }
  
  if (!smTokenExchangeImplementationAddress) {
    console.log("⚠️ 未设置SM_TOKEN_EXCHANGE_IMPLEMENTATION环境变量");
    return;
  }
  
  console.log(`SMToken地址: ${smTokenAddress}`);
  console.log(`SMTokenExchange实现地址: ${smTokenExchangeImplementationAddress}`);
  
  // 验证SMToken合约
  console.log("\n开始验证SMToken合约...");
  try {
    // SMToken构造函数参数
    // 注意：这里需要替换为实际部署时使用的参数
    const initialSupply = "1000000000"; // 10亿初始供应量
    const name = "SocioMint Token"; 
    const symbol = "SM";
    
    // 构建验证命令参数
    const smTokenArgs = [
      initialSupply,
      name,
      symbol
    ];
    
    console.log("验证命令:");
    console.log(`npx hardhat verify --network bscTestnet ${smTokenAddress} ${smTokenArgs.join(' ')}`);
    
    // 执行验证
    await hre.run("verify:verify", {
      address: smTokenAddress,
      constructorArguments: smTokenArgs,
      contract: "contracts/SMToken.sol:SMToken"
    });
    
    console.log("✅ SMToken合约验证成功");
  } catch (error) {
    console.error("❌ SMToken验证失败:", error.message);
    
    if (error.message.includes("already verified")) {
      console.log("已经验证过，无需重复验证");
    } else if (error.message.includes("missing arguments")) {
      console.log("构造函数参数不正确，请检查参数数量和类型");
    }
  }
  
  // 验证SMTokenExchange实现合约
  console.log("\n开始验证SMTokenExchange实现合约...");
  try {
    // 代理合约通常不需要构造函数参数，因为构造函数参数是在initialize函数中提供的
    await hre.run("verify:verify", {
      address: smTokenExchangeImplementationAddress,
      contract: "contracts/SMTokenExchange.sol:SMTokenExchange"
    });
    
    console.log("✅ SMTokenExchange实现合约验证成功");
  } catch (error) {
    console.error("❌ SMTokenExchange验证失败:", error.message);
    
    if (error.message.includes("already verified")) {
      console.log("已经验证过，无需重复验证");
    } else if (error.message.includes("Bytecode")) {
      console.log("合约字节码不匹配，请确保验证的是正确的合约版本");
    }
  }
  
  console.log("\n=== 合约验证完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("验证过程发生错误:", error);
    process.exit(1);
  });