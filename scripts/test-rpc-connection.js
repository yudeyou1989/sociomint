/**
 * BSC主网RPC连接测试脚本
 * 测试多个RPC端点的连接状态
 */

const { ethers } = require("ethers");

// BSC主网RPC端点列表
const BSC_MAINNET_RPCS = [
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/", 
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
  "https://rpc.ankr.com/bsc",
  "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3",
  "https://bsc.publicnode.com",
  "https://binance.llamarpc.com",
  "https://bsc-rpc.gateway.pokt.network/"
];

async function testRPCConnection(rpcUrl, timeout = 5000) {
  try {
    console.log(`🔍 测试 RPC: ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );
    
    // 测试获取最新区块号
    const blockNumberPromise = provider.getBlockNumber();
    const blockNumber = await Promise.race([blockNumberPromise, timeoutPromise]);
    
    // 测试获取网络信息
    const networkPromise = provider.getNetwork();
    const network = await Promise.race([networkPromise, timeoutPromise]);
    
    console.log(`✅ 连接成功! 区块号: ${blockNumber}, Chain ID: ${network.chainId}`);
    return { success: true, blockNumber, chainId: network.chainId.toString(), rpcUrl };
    
  } catch (error) {
    console.log(`❌ 连接失败: ${error.message}`);
    return { success: false, error: error.message, rpcUrl };
  }
}

async function findBestRPC() {
  console.log("🚀 开始测试BSC主网RPC连接...\n");
  
  const results = [];
  
  // 并发测试所有RPC
  const promises = BSC_MAINNET_RPCS.map(rpc => testRPCConnection(rpc));
  const testResults = await Promise.all(promises);
  
  console.log("\n📊 测试结果汇总:");
  console.log("=".repeat(60));
  
  const successfulRPCs = [];
  const failedRPCs = [];
  
  testResults.forEach(result => {
    if (result.success) {
      successfulRPCs.push(result);
      console.log(`✅ ${result.rpcUrl} - 区块: ${result.blockNumber}`);
    } else {
      failedRPCs.push(result);
      console.log(`❌ ${result.rpcUrl} - ${result.error}`);
    }
  });
  
  console.log("\n📈 统计信息:");
  console.log(`成功连接: ${successfulRPCs.length}/${BSC_MAINNET_RPCS.length}`);
  console.log(`失败连接: ${failedRPCs.length}/${BSC_MAINNET_RPCS.length}`);
  
  if (successfulRPCs.length > 0) {
    console.log("\n🎯 推荐使用的RPC端点:");
    successfulRPCs.slice(0, 3).forEach((rpc, index) => {
      console.log(`${index + 1}. ${rpc.rpcUrl}`);
    });
    
    // 更新hardhat配置建议
    console.log("\n🔧 建议更新 hardhat.config.js:");
    console.log(`const BSC_MAINNET_RPC_URL = "${successfulRPCs[0].rpcUrl}";`);
    
    return successfulRPCs[0].rpcUrl;
  } else {
    console.log("\n⚠️ 所有RPC端点都无法连接，可能的原因:");
    console.log("1. 网络连接问题");
    console.log("2. 防火墙阻止");
    console.log("3. 需要使用VPN");
    console.log("4. ISP限制");
    
    console.log("\n💡 建议解决方案:");
    console.log("1. 检查网络连接");
    console.log("2. 尝试使用VPN");
    console.log("3. 使用第三方RPC服务 (Alchemy, Infura, QuickNode)");
    
    return null;
  }
}

// 测试特定账户余额
async function testAccountBalance(rpcUrl, address) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    console.log(`💰 账户 ${address} 余额: ${ethers.formatEther(balance)} BNB`);
    return ethers.formatEther(balance);
  } catch (error) {
    console.log(`❌ 获取余额失败: ${error.message}`);
    return null;
  }
}

// 主函数
async function main() {
  try {
    const bestRPC = await findBestRPC();
    
    if (bestRPC) {
      console.log(`\n🎉 最佳RPC端点: ${bestRPC}`);
      
      // 如果有私钥，测试账户余额
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        const wallet = new ethers.Wallet(privateKey);
        console.log(`\n👤 部署账户: ${wallet.address}`);
        await testAccountBalance(bestRPC, wallet.address);
      }
    }
    
  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ RPC连接测试完成!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 测试失败:", error);
      process.exit(1);
    });
}

module.exports = { testRPCConnection, findBestRPC, testAccountBalance };
